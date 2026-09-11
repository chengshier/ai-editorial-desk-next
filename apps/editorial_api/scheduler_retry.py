from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from apps.editorial_api.scheduler import (
    _execute_headless,
    _finish_run,
    _research_case_for_tick,
)
from apps.editorial_api.scheduler_persistence import SchedulerPostgresStore, scheduler_database_url

router = APIRouter(
    prefix="/api/v1/integrations/harness/scheduler",
    tags=["harness-scheduler-retry"],
)


class TaskPolicyRequest(BaseModel):
    catch_up_policy: Literal["skip", "bounded"] = "skip"
    catch_up_limit: int = Field(default=1, ge=1, le=10)
    retry_max_attempts: int = Field(default=1, ge=1, le=5)
    retry_backoff_seconds: int = Field(default=60, ge=1, le=86_400)


class SchedulerTaskPolicyView(BaseModel):
    task_id: str
    operation: str
    business_object_type: str
    business_object_id: str
    enabled: bool
    schedule_kind: str | None
    schedule_expression: str | None
    catch_up_policy: Literal["skip", "bounded"]
    catch_up_limit: int
    retry_max_attempts: int
    retry_backoff_seconds: int
    next_run_at: datetime | None
    last_run_at: datetime | None
    persistence: Literal["postgresql"] = "postgresql"


class SchedulerRunAttempt(BaseModel):
    attempt_id: str
    run_id: str
    attempt: int
    status: str
    started_at: datetime
    finished_at: datetime | None = None
    failure_code: str | None = None
    failure_reason: str | None = None
    runtime_provenance: dict[str, Any]
    execution_provenance: dict[str, Any]


class RetryRunView(BaseModel):
    run_id: str
    task_id: str | None = None
    operation: str
    business_object_type: str
    business_object_id: str
    opportunity_id: str
    trigger_kind: str
    status: str
    idempotency_key: str
    attempt: int
    scheduled_for: datetime | None = None
    started_at: datetime
    finished_at: datetime | None = None
    next_retry_at: datetime | None = None
    failure_code: str | None = None
    failure_reason: str | None = None
    runtime_provenance: dict[str, Any]
    execution_provenance: dict[str, Any]
    persistence: Literal["postgresql"] = "postgresql"


class RetryTickRequest(BaseModel):
    now: datetime | None = None
    limit: int = Field(default=20, ge=1, le=100)


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise HTTPException(status_code=422, detail="scheduler datetime must include a timezone")
    return value.astimezone(UTC)


def _store() -> SchedulerPostgresStore:
    database_url = scheduler_database_url()
    if database_url is None:
        raise HTTPException(
            status_code=503,
            detail="DATABASE_URL is required for retry/catch-up scheduler state",
        )
    return SchedulerPostgresStore(database_url)


async def _finish_claimed_retry(
    wire: dict[str, Any],
    result: dict[str, Any],
) -> None:
    run_id = str(wire["run_id"])
    if wire.get("trigger_kind") == "event":
        # Imported lazily to keep router registration acyclic while allowing
        # event-triggered runs to reuse the same durable retry queue.
        from apps.editorial_api.scheduler_event import finish_event_run

        await finish_event_run(run_id, result)
        return
    await _finish_run(run_id, result)


@router.post("/tasks/{task_id}/policy", response_model=SchedulerTaskPolicyView)
async def set_scheduler_task_policy(
    task_id: str,
    payload: TaskPolicyRequest,
) -> SchedulerTaskPolicyView:
    store = _store()
    try:
        task = await store.set_task_policy(
            task_id,
            catch_up_policy=payload.catch_up_policy,
            catch_up_limit=payload.catch_up_limit,
            retry_max_attempts=payload.retry_max_attempts,
            retry_backoff_seconds=payload.retry_backoff_seconds,
            updated_at=_utcnow(),
        )
    finally:
        await store.close()
    if task is None:
        raise HTTPException(status_code=404, detail="scheduler task not found")
    return SchedulerTaskPolicyView.model_validate(task)


@router.get("/runs/{run_id}/attempts", response_model=list[SchedulerRunAttempt])
async def list_scheduler_run_attempts(run_id: str) -> list[SchedulerRunAttempt]:
    store = _store()
    try:
        run = await store.get_run(run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="scheduler run not found")
        attempts = await store.list_attempts(run_id)
    finally:
        await store.close()
    return [SchedulerRunAttempt.model_validate(item) for item in attempts]


@router.post("/retry-tick", response_model=list[RetryRunView])
async def run_scheduler_retry_tick(payload: RetryTickRequest) -> list[RetryRunView]:
    store = _store()
    now = _utcnow() if payload.now is None else _aware_utc(payload.now)
    try:
        claimed = await store.claim_due_retries(now=now, limit=payload.limit)
    finally:
        await store.close()

    results: list[RetryRunView] = []
    for wire in claimed:
        research_case_id = str(wire["business_object_id"])
        opportunity_id, completed = _research_case_for_tick(research_case_id)
        if opportunity_id is None:
            await _finish_claimed_retry(
                wire,
                {
                    "ok": False,
                    "tool_result_observed": False,
                    "failure_code": "business_object_missing",
                    "failure_reason": "Scheduled Research Case no longer exists.",
                    "completion_signal": "business_object_not_runnable",
                },
            )
        elif not completed:
            await _finish_claimed_retry(
                wire,
                {
                    "ok": False,
                    "tool_result_observed": False,
                    "failure_code": "business_object_not_ready",
                    "failure_reason": "Scheduled Research Case is not completed yet.",
                    "completion_signal": "business_object_not_runnable",
                },
            )
        else:
            result = await _execute_headless(
                {
                    "scheduler_run_id": wire["run_id"],
                    "operation": wire["operation"],
                    "research_case_id": research_case_id,
                    "opportunity_id": opportunity_id,
                }
            )
            await _finish_claimed_retry(wire, result)

        refresh = _store()
        try:
            persisted = await refresh.get_run(str(wire["run_id"]))
        finally:
            await refresh.close()
        if persisted is None:
            raise RuntimeError(f"durable SchedulerRun disappeared: {wire['run_id']}")
        results.append(RetryRunView.model_validate(persisted))

    return results
