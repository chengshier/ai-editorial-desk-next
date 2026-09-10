from __future__ import annotations

import asyncio
import hashlib
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from threading import Lock
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from apps.editorial_api.scheduler_persistence import SchedulerPostgresStore, scheduler_database_url
from apps.editorial_api.spike_harness import _RESEARCH, _RESEARCH_LOCK

HARNESS_COMMIT = "99f6f02fecdb7dff40c3fbc9470f5907c29f74ca"
HARNESS_RELEASE = "dsh@0.1.0-rc.7"
EXECUTION_SEAM = "typescript-sdk-jsonrpc-stdio"
OPERATION_RESEARCH_REHYDRATE = "research.rehydrate"

router = APIRouter(
    prefix="/api/v1/integrations/harness/scheduler",
    tags=["harness-scheduler"],
)


class ManualRunRequest(BaseModel):
    idempotency_key: str | None = Field(default=None, min_length=1, max_length=160)


class RuntimeProvenance(BaseModel):
    harness_commit: str = HARNESS_COMMIT
    harness_release: str = HARNESS_RELEASE
    execution_seam: str = EXECUTION_SEAM
    harness_session_id: str | None = None
    provider: str | None = None
    model: str | None = None
    completion_signal: str | None = None


class ExecutionProvenance(BaseModel):
    operation: str
    business_object_type: str
    business_object_id: str
    trigger_kind: str
    attempt: int
    input_hash: str


class SchedulerRun(BaseModel):
    run_id: str
    task_id: str | None = None
    operation: str
    business_object_type: str
    business_object_id: str
    opportunity_id: str
    trigger_kind: Literal["manual"] = "manual"
    status: Literal["queued", "running", "succeeded", "failed", "cancelled", "skipped"]
    idempotency_key: str
    attempt: int = Field(ge=1)
    started_at: datetime
    finished_at: datetime | None = None
    failure_code: str | None = None
    failure_reason: str | None = None
    runtime_provenance: RuntimeProvenance
    execution_provenance: ExecutionProvenance
    persistence: Literal["transitional_in_memory", "postgresql"] = "transitional_in_memory"


_RUN_LOCK = Lock()
_RUNS: dict[str, SchedulerRun] = {}
_RUN_BY_IDEMPOTENCY: dict[str, str] = {}
_RUN_INPUT_HASH: dict[str, str] = {}
_POSTGRES_STORE: SchedulerPostgresStore | None = None
_POSTGRES_STORE_URL: str | None = None


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _durable_store() -> SchedulerPostgresStore | None:
    global _POSTGRES_STORE, _POSTGRES_STORE_URL
    database_url = scheduler_database_url()
    if database_url is None:
        return None
    if _POSTGRES_STORE is None or _POSTGRES_STORE_URL != database_url:
        _POSTGRES_STORE = SchedulerPostgresStore(database_url)
        _POSTGRES_STORE_URL = database_url
    return _POSTGRES_STORE


def _input_hash(*, operation: str, research_case_id: str, opportunity_id: str) -> str:
    canonical = json.dumps(
        {
            "operation": operation,
            "research_case_id": research_case_id,
            "opportunity_id": opportunity_id,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _research_case(research_case_id: str) -> tuple[str, bool]:
    # Research itself is still a deterministic fixture in S4. N4-C only moves
    # Scheduler Task/Run truth to PostgreSQL; runtime ids remain metadata.
    with _RESEARCH_LOCK:
        record = _RESEARCH.get(research_case_id)
        if record is None:
            raise HTTPException(status_code=404, detail="research case not found")
        return record.opportunity_id, record.completed


def _redact(text: str) -> str:
    result = text
    for name, value in os.environ.items():
        if not value or not any(
            marker in name.upper()
            for marker in ("API_KEY", "TOKEN", "SECRET", "PASSWORD", "CREDENTIAL")
        ):
            continue
        result = result.replace(value, "[REDACTED]")
    return result[:2000]


async def _stop_process(process: asyncio.subprocess.Process) -> None:
    if process.returncode is not None:
        return
    process.terminate()
    try:
        await asyncio.wait_for(process.wait(), timeout=5)
    except TimeoutError:
        process.kill()
        await process.wait()


async def _execute_headless(payload: dict[str, Any]) -> dict[str, Any]:
    harness_root_raw = os.getenv("EDITORIAL_HARNESS_ROOT")
    if not harness_root_raw:
        return {
            "ok": False,
            "failure_code": "harness_root_not_configured",
            "failure_reason": "EDITORIAL_HARNESS_ROOT is not configured for headless execution.",
            "harness_commit": HARNESS_COMMIT,
            "harness_release": HARNESS_RELEASE,
            "execution_seam": EXECUTION_SEAM,
        }

    harness_root = Path(harness_root_raw).expanduser().resolve()
    runner = harness_root / "packages" / "examples" / "editorial-headless-runner" / "runner.mjs"
    if not runner.is_file():
        return {
            "ok": False,
            "failure_code": "headless_runner_missing",
            "failure_reason": f"Prepared headless runner is missing: {runner}",
            "harness_commit": HARNESS_COMMIT,
            "harness_release": HARNESS_RELEASE,
            "execution_seam": EXECUTION_SEAM,
        }

    timeout_seconds_raw = os.getenv("EDITORIAL_SCHEDULER_RUN_TIMEOUT_SECONDS", "120")
    try:
        timeout_seconds = max(1.0, float(timeout_seconds_raw))
    except ValueError:
        timeout_seconds = 120.0

    env = os.environ.copy()
    env.setdefault("EDITORIAL_API_BASE_URL", "http://127.0.0.1:18000")
    node_command = os.getenv("EDITORIAL_HARNESS_NODE", "node")
    process = await asyncio.create_subprocess_exec(
        node_command,
        str(runner),
        cwd=str(harness_root),
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env,
    )
    try:
        stdout, stderr = await asyncio.wait_for(
            process.communicate((json.dumps(payload) + "\n").encode("utf-8")),
            timeout=timeout_seconds,
        )
    except TimeoutError:
        await _stop_process(process)
        return {
            "ok": False,
            "failure_code": "headless_run_timeout",
            "failure_reason": f"Headless Harness run exceeded {timeout_seconds:g}s and was terminated.",
            "harness_commit": HARNESS_COMMIT,
            "harness_release": HARNESS_RELEASE,
            "execution_seam": EXECUTION_SEAM,
        }

    output_lines = [line for line in stdout.decode("utf-8", errors="replace").splitlines() if line.strip()]
    if output_lines:
        try:
            result = json.loads(output_lines[-1])
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            pass

    stderr_text = _redact(stderr.decode("utf-8", errors="replace").strip())
    return {
        "ok": False,
        "failure_code": "headless_runner_invalid_output",
        "failure_reason": stderr_text
        or f"Headless runner exited with code {process.returncode} without a JSON result.",
        "harness_commit": HARNESS_COMMIT,
        "harness_release": HARNESS_RELEASE,
        "execution_seam": EXECUTION_SEAM,
    }


async def _create_or_reuse_run(
    *,
    research_case_id: str,
    opportunity_id: str,
    requested_key: str | None,
) -> tuple[SchedulerRun, bool]:
    operation = OPERATION_RESEARCH_REHYDRATE
    input_hash = _input_hash(
        operation=operation,
        research_case_id=research_case_id,
        opportunity_id=opportunity_id,
    )
    idempotency_key = requested_key or f"manual:{uuid4().hex}"
    store = _durable_store()

    run = SchedulerRun(
        run_id=f"run_{uuid4().hex}",
        operation=operation,
        business_object_type="research_case",
        business_object_id=research_case_id,
        opportunity_id=opportunity_id,
        status="running",
        idempotency_key=idempotency_key,
        attempt=1,
        started_at=_utcnow(),
        runtime_provenance=RuntimeProvenance(),
        execution_provenance=ExecutionProvenance(
            operation=operation,
            business_object_type="research_case",
            business_object_id=research_case_id,
            trigger_kind="manual",
            attempt=1,
            input_hash=input_hash,
        ),
        persistence="postgresql" if store is not None else "transitional_in_memory",
    )

    if store is not None:
        stored, reused = await store.create_run(run.model_dump(mode="python"), input_hash)
        if reused and stored["input_hash"] != input_hash:
            raise HTTPException(
                status_code=409,
                detail="idempotency key is already bound to a different scheduler input",
            )
        return SchedulerRun.model_validate(stored), reused

    with _RUN_LOCK:
        existing_run_id = _RUN_BY_IDEMPOTENCY.get(idempotency_key)
        if existing_run_id is not None:
            existing_hash = _RUN_INPUT_HASH[idempotency_key]
            if existing_hash != input_hash:
                raise HTTPException(
                    status_code=409,
                    detail="idempotency key is already bound to a different scheduler input",
                )
            return _RUNS[existing_run_id].model_copy(deep=True), True
        _RUNS[run.run_id] = run
        _RUN_BY_IDEMPOTENCY[idempotency_key] = run.run_id
        _RUN_INPUT_HASH[idempotency_key] = input_hash
        return run.model_copy(deep=True), False


async def _finish_run(run_id: str, result: dict[str, Any]) -> SchedulerRun:
    store = _durable_store()
    if store is not None:
        stored = await store.get_run(run_id)
        if stored is None:
            raise RuntimeError(f"durable SchedulerRun disappeared: {run_id}")
        current = SchedulerRun.model_validate(stored)
    else:
        with _RUN_LOCK:
            current = _RUNS[run_id].model_copy(deep=True)

    runtime = current.runtime_provenance.model_copy(
        update={
            "harness_commit": str(result.get("harness_commit") or HARNESS_COMMIT),
            "harness_release": str(result.get("harness_release") or HARNESS_RELEASE),
            "execution_seam": str(result.get("execution_seam") or EXECUTION_SEAM),
            "harness_session_id": result.get("harness_session_id"),
            "provider": result.get("provider"),
            "model": result.get("model"),
            "completion_signal": result.get("completion_signal"),
        }
    )
    if result.get("ok") is True and result.get("tool_result_observed") is True:
        updated = current.model_copy(
            update={
                "status": "succeeded",
                "finished_at": _utcnow(),
                "runtime_provenance": runtime,
                "failure_code": None,
                "failure_reason": None,
            }
        )
    else:
        updated = current.model_copy(
            update={
                "status": "failed",
                "finished_at": _utcnow(),
                "runtime_provenance": runtime,
                "failure_code": str(result.get("failure_code") or "headless_run_failed"),
                "failure_reason": _redact(
                    str(result.get("failure_reason") or "Headless Harness run failed without a reason.")
                ),
            }
        )

    if store is not None:
        persisted = await store.update_run(updated.model_dump(mode="python"))
        return SchedulerRun.model_validate(persisted)
    with _RUN_LOCK:
        _RUNS[run_id] = updated
    return updated.model_copy(deep=True)


@router.post(
    "/research/{research_case_id}/run-now",
    response_model=SchedulerRun,
)
async def run_research_now(
    research_case_id: str,
    payload: ManualRunRequest,
) -> SchedulerRun:
    opportunity_id, completed = _research_case(research_case_id)
    if not completed:
        raise HTTPException(
            status_code=409,
            detail="research case must be completed before research.rehydrate can run",
        )

    run, reused = await _create_or_reuse_run(
        research_case_id=research_case_id,
        opportunity_id=opportunity_id,
        requested_key=payload.idempotency_key,
    )
    if reused:
        return run

    result = await _execute_headless(
        {
            "scheduler_run_id": run.run_id,
            "operation": run.operation,
            "research_case_id": research_case_id,
            "opportunity_id": opportunity_id,
        }
    )
    return await _finish_run(run.run_id, result)


@router.get("/runs/{run_id}", response_model=SchedulerRun)
async def get_scheduler_run(run_id: str) -> SchedulerRun:
    store = _durable_store()
    if store is not None:
        run = await store.get_run(run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="scheduler run not found")
        return SchedulerRun.model_validate(run)
    with _RUN_LOCK:
        run = _RUNS.get(run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="scheduler run not found")
        return run.model_copy(deep=True)


@router.get("/research/{research_case_id}/runs", response_model=list[SchedulerRun])
async def list_research_runs(
    research_case_id: str,
    limit: int = Query(default=50, ge=1, le=200),
) -> list[SchedulerRun]:
    store = _durable_store()
    if store is not None:
        rows = await store.list_runs(business_object_id=research_case_id, limit=limit)
        return [SchedulerRun.model_validate(row) for row in rows]
    with _RUN_LOCK:
        rows = [
            run.model_copy(deep=True)
            for run in _RUNS.values()
            if run.business_object_id == research_case_id
        ]
    rows.sort(key=lambda run: run.started_at, reverse=True)
    return rows[:limit]
