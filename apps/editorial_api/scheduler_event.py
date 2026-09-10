from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from apps.editorial_api.scheduler import (
    EXECUTION_SEAM,
    HARNESS_COMMIT,
    HARNESS_RELEASE,
    OPERATION_RESEARCH_REHYDRATE,
    _RUN_LOCK,
    _RUNS,
    _execute_headless,
    _redact,
    _research_case,
)
from apps.editorial_api.scheduler_event_store import SchedulerEventPostgresStore
from apps.editorial_api.scheduler_persistence import scheduler_database_url

EVENT_RESEARCH_COMPLETED = "research.completed"

router = APIRouter(
    prefix="/api/v1/integrations/harness/scheduler",
    tags=["harness-scheduler-event"],
)


class EventTaskRequest(BaseModel):
    event_name: Literal["research.completed"] = EVENT_RESEARCH_COMPLETED
    enabled: bool = True
    retry_max_attempts: int = Field(default=1, ge=1, le=5)
    retry_backoff_seconds: int = Field(default=60, ge=1, le=86_400)


class EventTaskEnabledRequest(BaseModel):
    enabled: bool


class EventTaskView(BaseModel):
    task_id: str
    operation: str
    business_object_type: str
    business_object_id: str
    trigger_kind: Literal["event"]
    enabled: bool
    schedule_kind: Literal["event"]
    schedule_expression: str
    catch_up_policy: str
    catch_up_limit: int
    retry_max_attempts: int
    retry_backoff_seconds: int
    next_run_at: datetime | None
    last_run_at: datetime | None
    created_at: datetime
    updated_at: datetime
    persistence: Literal["postgresql"] = "postgresql"


class ResearchCompletedEventRequest(BaseModel):
    event_id: str = Field(min_length=1, max_length=80)
    research_case_id: str = Field(min_length=1, max_length=160)
    occurred_at: datetime | None = None


class EventRunView(BaseModel):
    run_id: str
    task_id: str
    operation: str
    business_object_type: str
    business_object_id: str
    opportunity_id: str
    trigger_kind: Literal["event"]
    status: str
    idempotency_key: str
    attempt: int
    started_at: datetime
    finished_at: datetime | None = None
    next_retry_at: datetime | None = None
    failure_code: str | None = None
    failure_reason: str | None = None
    runtime_provenance: dict[str, Any]
    execution_provenance: dict[str, Any]
    persistence: Literal["postgresql"] = "postgresql"


class EventDispatchResult(BaseModel):
    event_id: str
    event_name: Literal["research.completed"] = EVENT_RESEARCH_COMPLETED
    research_case_id: str
    matched_task_count: int
    runs: list[EventRunView]


class SchedulerTaskStatus(BaseModel):
    task_id: str
    trigger_kind: str
    enabled: bool
    schedule_kind: str | None
    schedule_expression: str | None
    retry_max_attempts: int
    next_run_at: datetime | None
    last_run_at: datetime | None


class SchedulerRunStatus(BaseModel):
    run_id: str
    task_id: str | None
    trigger_kind: str
    status: str
    attempt: int
    started_at: datetime
    finished_at: datetime | None
    next_retry_at: datetime | None = None
    failure_code: str | None = None


class ResearchSchedulerStatus(BaseModel):
    research_case_id: str
    persistence: Literal["postgresql", "transitional_in_memory"]
    durable_scheduler_configured: bool
    tasks: list[SchedulerTaskStatus]
    runs: list[SchedulerRunStatus]


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _aware_utc(value: datetime | None) -> datetime:
    if value is None:
        return _utcnow()
    if value.tzinfo is None:
        raise HTTPException(status_code=422, detail="scheduler event datetime must include a timezone")
    return value.astimezone(UTC)


def _event_store() -> SchedulerEventPostgresStore:
    database_url = scheduler_database_url()
    if database_url is None:
        raise HTTPException(
            status_code=503,
            detail="DATABASE_URL is required for durable event scheduler tasks",
        )
    return SchedulerEventPostgresStore(database_url)


def _event_input_hash(
    *,
    task_id: str,
    event_id: str,
    event_name: str,
    research_case_id: str,
    opportunity_id: str,
) -> str:
    canonical = json.dumps(
        {
            "task_id": task_id,
            "event_id": event_id,
            "event_name": event_name,
            "operation": OPERATION_RESEARCH_REHYDRATE,
            "business_object_type": "research_case",
            "business_object_id": research_case_id,
            "opportunity_id": opportunity_id,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


async def _create_or_reuse_event_run(
    *,
    task_id: str,
    event_id: str,
    event_name: str,
    research_case_id: str,
    opportunity_id: str,
) -> tuple[EventRunView, bool]:
    input_hash = _event_input_hash(
        task_id=task_id,
        event_id=event_id,
        event_name=event_name,
        research_case_id=research_case_id,
        opportunity_id=opportunity_id,
    )
    run = {
        "run_id": f"run_{uuid4().hex}",
        "task_id": task_id,
        "operation": OPERATION_RESEARCH_REHYDRATE,
        "business_object_type": "research_case",
        "business_object_id": research_case_id,
        "opportunity_id": opportunity_id,
        "trigger_kind": "event",
        "status": "running",
        "idempotency_key": f"event:{task_id}:{event_id}",
        "attempt": 1,
        "started_at": _utcnow(),
        "finished_at": None,
        "failure_code": None,
        "failure_reason": None,
        "runtime_provenance": {
            "harness_commit": HARNESS_COMMIT,
            "harness_release": HARNESS_RELEASE,
            "execution_seam": EXECUTION_SEAM,
            "harness_session_id": None,
            "provider": None,
            "model": None,
            "completion_signal": None,
        },
        "execution_provenance": {
            "operation": OPERATION_RESEARCH_REHYDRATE,
            "business_object_type": "research_case",
            "business_object_id": research_case_id,
            "trigger_kind": "event",
            "attempt": 1,
            "input_hash": input_hash,
            "event_id": event_id,
            "event_name": event_name,
        },
    }
    store = _event_store()
    try:
        stored, reused = await store.create_run(run, input_hash)
    finally:
        await store.close()
    if reused and stored["input_hash"] != input_hash:
        raise HTTPException(
            status_code=409,
            detail="event idempotency key is already bound to a different scheduler input",
        )
    return EventRunView.model_validate(stored), reused


async def finish_event_run(run_id: str, result: dict[str, Any]) -> EventRunView:
    """Persist one event-triggered attempt without converting its trigger into a schedule run."""
    store = _event_store()
    try:
        current = await store.get_run(run_id)
        if current is None:
            raise RuntimeError(f"durable SchedulerRun disappeared: {run_id}")
        runtime = dict(current["runtime_provenance"])
        runtime.update(
            {
                "harness_commit": str(result.get("harness_commit") or HARNESS_COMMIT),
                "harness_release": str(result.get("harness_release") or HARNESS_RELEASE),
                "execution_seam": str(result.get("execution_seam") or EXECUTION_SEAM),
                "harness_session_id": result.get("harness_session_id"),
                "provider": result.get("provider"),
                "model": result.get("model"),
                "completion_signal": result.get("completion_signal"),
            }
        )
        current["runtime_provenance"] = runtime
        current["finished_at"] = _utcnow()
        if result.get("ok") is True and result.get("tool_result_observed") is True:
            current["status"] = "succeeded"
            current["failure_code"] = None
            current["failure_reason"] = None
        else:
            current["status"] = "failed"
            current["failure_code"] = str(result.get("failure_code") or "headless_run_failed")
            current["failure_reason"] = _redact(
                str(result.get("failure_reason") or "Headless Harness run failed without a reason.")
            )
        persisted = await store.update_run(current)
        return EventRunView.model_validate(persisted)
    finally:
        await store.close()


@router.post(
    "/research/{research_case_id}/tasks/event",
    response_model=EventTaskView,
    status_code=201,
)
async def create_research_event_task(
    research_case_id: str,
    payload: EventTaskRequest,
) -> EventTaskView:
    _research_case(research_case_id)
    now = _utcnow()
    store = _event_store()
    try:
        stored = await store.upsert_event_task(
            {
                "task_id": f"task_{uuid4().hex}",
                "operation": OPERATION_RESEARCH_REHYDRATE,
                "business_object_type": "research_case",
                "business_object_id": research_case_id,
                "event_name": payload.event_name,
                "enabled": payload.enabled,
                "retry_max_attempts": payload.retry_max_attempts,
                "retry_backoff_seconds": payload.retry_backoff_seconds,
                "created_at": now,
                "updated_at": now,
            }
        )
        return EventTaskView.model_validate(stored)
    finally:
        await store.close()


@router.get("/event-tasks/{task_id}", response_model=EventTaskView)
async def get_event_task(task_id: str) -> EventTaskView:
    store = _event_store()
    try:
        task = await store.get_task(task_id)
    finally:
        await store.close()
    if task is None or task.get("trigger_kind") != "event":
        raise HTTPException(status_code=404, detail="event scheduler task not found")
    return EventTaskView.model_validate(task)


@router.post("/event-tasks/{task_id}/enabled", response_model=EventTaskView)
async def set_event_task_enabled(
    task_id: str,
    payload: EventTaskEnabledRequest,
) -> EventTaskView:
    store = _event_store()
    try:
        task = await store.set_event_task_enabled(
            task_id,
            enabled=payload.enabled,
            updated_at=_utcnow(),
        )
    finally:
        await store.close()
    if task is None:
        raise HTTPException(status_code=404, detail="event scheduler task not found")
    return EventTaskView.model_validate(task)


@router.post("/events/research-completed", response_model=EventDispatchResult)
async def dispatch_research_completed_event(
    payload: ResearchCompletedEventRequest,
) -> EventDispatchResult:
    opportunity_id, completed = _research_case(payload.research_case_id)
    if not completed:
        raise HTTPException(
            status_code=409,
            detail="research.completed cannot be dispatched before the Research Case completes",
        )
    _aware_utc(payload.occurred_at)

    store = _event_store()
    try:
        tasks = await store.list_matching_event_tasks(
            event_name=EVENT_RESEARCH_COMPLETED,
            business_object_type="research_case",
            business_object_id=payload.research_case_id,
        )
    finally:
        await store.close()

    runs: list[EventRunView] = []
    for task in tasks:
        run, reused = await _create_or_reuse_event_run(
            task_id=str(task["task_id"]),
            event_id=payload.event_id,
            event_name=EVENT_RESEARCH_COMPLETED,
            research_case_id=payload.research_case_id,
            opportunity_id=opportunity_id,
        )
        if reused:
            runs.append(run)
            continue
        result = await _execute_headless(
            {
                "scheduler_run_id": run.run_id,
                "operation": run.operation,
                "research_case_id": payload.research_case_id,
                "opportunity_id": opportunity_id,
            }
        )
        runs.append(await finish_event_run(run.run_id, result))

    return EventDispatchResult(
        event_id=payload.event_id,
        research_case_id=payload.research_case_id,
        matched_task_count=len(tasks),
        runs=runs,
    )


@router.get("/research/{research_case_id}/status", response_model=ResearchSchedulerStatus)
async def get_research_scheduler_status(
    research_case_id: str,
    limit: int = Query(default=10, ge=1, le=50),
) -> ResearchSchedulerStatus:
    _research_case(research_case_id)
    database_url = scheduler_database_url()
    if database_url is None:
        with _RUN_LOCK:
            rows = [
                run.model_dump(mode="python")
                for run in _RUNS.values()
                if run.business_object_id == research_case_id
            ]
        rows.sort(key=lambda item: item["started_at"], reverse=True)
        return ResearchSchedulerStatus(
            research_case_id=research_case_id,
            persistence="transitional_in_memory",
            durable_scheduler_configured=False,
            tasks=[],
            runs=[SchedulerRunStatus.model_validate(item) for item in rows[:limit]],
        )

    store = SchedulerEventPostgresStore(database_url)
    try:
        tasks = await store.list_tasks_for_business_object(
            business_object_type="research_case",
            business_object_id=research_case_id,
        )
        runs = await store.list_runs_for_business_object(
            business_object_type="research_case",
            business_object_id=research_case_id,
            limit=limit,
        )
    finally:
        await store.close()
    return ResearchSchedulerStatus(
        research_case_id=research_case_id,
        persistence="postgresql",
        durable_scheduler_configured=True,
        tasks=[SchedulerTaskStatus.model_validate(item) for item in tasks],
        runs=[SchedulerRunStatus.model_validate(item) for item in runs],
    )
