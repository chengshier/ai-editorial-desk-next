from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from apps.editorial_api import scheduler_event, scheduler_retry
from apps.editorial_api.scheduler_event_store import SchedulerEventPostgresStore
from apps.editorial_api.spike_harness import _RESEARCH, _RESEARCH_LOCK, _ResearchRecord


@pytest.mark.asyncio
async def test_event_task_dispatch_is_restart_safe_and_idempotent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_url = os.getenv("SCHEDULER_POSTGRES_TEST_URL")
    if not database_url:
        pytest.skip("PostgreSQL integration URL is not configured")
    monkeypatch.setenv("DATABASE_URL", database_url)

    suffix = uuid4().hex
    research_case_id = f"rc_{suffix[:12]}"
    opportunity_id = "opp_dishwasher_water"
    event_id = f"evt_{suffix}"
    calls = 0

    async def fake_execute(payload: dict[str, object]) -> dict[str, object]:
        nonlocal calls
        calls += 1
        return {
            "ok": True,
            "scheduler_run_id": payload["scheduler_run_id"],
            "operation": payload["operation"],
            "research_case_id": payload["research_case_id"],
            "opportunity_id": payload["opportunity_id"],
            "harness_session_id": "session-event-runtime",
            "completion_signal": "agent_idle+canonical_tool_result",
            "tool_result_observed": True,
            "harness_commit": scheduler_event.HARNESS_COMMIT,
            "harness_release": scheduler_event.HARNESS_RELEASE,
            "execution_seam": scheduler_event.EXECUTION_SEAM,
            "provider": "deepseek-official",
            "model": "deepseek-v4-flash",
        }

    monkeypatch.setattr(scheduler_event, "_execute_headless", fake_execute)
    with _RESEARCH_LOCK:
        _RESEARCH[research_case_id] = _ResearchRecord(
            research_case_id=research_case_id,
            opportunity_id=opportunity_id,
            goal="event integration",
            completed=True,
        )

    try:
        task = await scheduler_event.create_research_event_task(
            research_case_id,
            scheduler_event.EventTaskRequest(
                retry_max_attempts=2,
                retry_backoff_seconds=1,
            ),
        )
        assert task.trigger_kind == "event"
        assert task.schedule_expression == scheduler_event.EVENT_RESEARCH_COMPLETED
        assert task.next_run_at is None

        first = await scheduler_event.dispatch_research_completed_event(
            scheduler_event.ResearchCompletedEventRequest(
                event_id=event_id,
                research_case_id=research_case_id,
                occurred_at=datetime.now(UTC),
            )
        )
        assert first.matched_task_count == 1
        assert len(first.runs) == 1
        run = first.runs[0]
        assert run.task_id == task.task_id
        assert run.trigger_kind == "event"
        assert run.business_object_id == research_case_id
        assert run.status == "succeeded"
        assert run.runtime_provenance["harness_session_id"] == "session-event-runtime"
        assert run.idempotency_key == f"event:{task.task_id}:{event_id}"

        duplicate = await scheduler_event.dispatch_research_completed_event(
            scheduler_event.ResearchCompletedEventRequest(
                event_id=event_id,
                research_case_id=research_case_id,
            )
        )
        assert duplicate.runs[0].run_id == run.run_id
        assert calls == 1

        status = await scheduler_event.get_research_scheduler_status(research_case_id)
        assert status.durable_scheduler_configured is True
        assert any(item.task_id == task.task_id and item.trigger_kind == "event" for item in status.tasks)
        assert status.runs[0].run_id == run.run_id

        restarted = SchedulerEventPostgresStore(database_url)
        matching = await restarted.list_matching_event_tasks(
            event_name=scheduler_event.EVENT_RESEARCH_COMPLETED,
            business_object_type="research_case",
            business_object_id=research_case_id,
        )
        assert [item["task_id"] for item in matching] == [task.task_id]
        restored = await restarted.get_run(run.run_id)
        assert restored is not None
        assert restored["trigger_kind"] == "event"
        assert restored["business_object_id"] == research_case_id
        await restarted.close()
    finally:
        with _RESEARCH_LOCK:
            _RESEARCH.pop(research_case_id, None)


@pytest.mark.asyncio
async def test_failed_event_run_retries_same_logical_run(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_url = os.getenv("SCHEDULER_POSTGRES_TEST_URL")
    if not database_url:
        pytest.skip("PostgreSQL integration URL is not configured")
    monkeypatch.setenv("DATABASE_URL", database_url)

    suffix = uuid4().hex
    research_case_id = f"rc_{suffix[:12]}"
    opportunity_id = "opp_dishwasher_water"

    async def fail_execute(payload: dict[str, object]) -> dict[str, object]:
        return {
            "ok": False,
            "scheduler_run_id": payload["scheduler_run_id"],
            "tool_result_observed": False,
            "failure_code": "provider_transient",
            "failure_reason": "temporary provider failure",
        }

    async def success_execute(payload: dict[str, object]) -> dict[str, object]:
        return {
            "ok": True,
            "scheduler_run_id": payload["scheduler_run_id"],
            "operation": payload["operation"],
            "research_case_id": payload["research_case_id"],
            "opportunity_id": payload["opportunity_id"],
            "harness_session_id": "session-event-retry",
            "completion_signal": "agent_idle+canonical_tool_result",
            "tool_result_observed": True,
        }

    monkeypatch.setattr(scheduler_event, "_execute_headless", fail_execute)
    with _RESEARCH_LOCK:
        _RESEARCH[research_case_id] = _ResearchRecord(
            research_case_id=research_case_id,
            opportunity_id=opportunity_id,
            goal="event retry integration",
            completed=True,
        )

    try:
        task = await scheduler_event.create_research_event_task(
            research_case_id,
            scheduler_event.EventTaskRequest(
                retry_max_attempts=2,
                retry_backoff_seconds=1,
            ),
        )
        dispatched = await scheduler_event.dispatch_research_completed_event(
            scheduler_event.ResearchCompletedEventRequest(
                event_id=f"evt_{suffix}",
                research_case_id=research_case_id,
            )
        )
        failed = dispatched.runs[0]
        assert failed.status == "failed"
        assert failed.next_retry_at is not None

        monkeypatch.setattr(scheduler_retry, "_execute_headless", success_execute)
        retried = await scheduler_retry.run_scheduler_retry_tick(
            scheduler_retry.RetryTickRequest(now=datetime.now(UTC) + timedelta(seconds=5))
        )
        matching = [item for item in retried if item.run_id == failed.run_id]
        assert len(matching) == 1
        retry = matching[0]
        assert retry.run_id == failed.run_id
        assert retry.idempotency_key == failed.idempotency_key
        assert retry.business_object_id == research_case_id
        assert retry.trigger_kind == "event"
        assert retry.attempt == 2
        assert retry.status == "succeeded"

        store = SchedulerEventPostgresStore(database_url)
        attempts = await store.list_attempts(failed.run_id)
        assert [item["attempt"] for item in attempts] == [1, 2]
        assert attempts[0]["status"] == "failed"
        assert attempts[1]["status"] == "succeeded"
        assert attempts[1]["execution_provenance"]["event_name"] == scheduler_event.EVENT_RESEARCH_COMPLETED
        await store.close()
    finally:
        with _RESEARCH_LOCK:
            _RESEARCH.pop(research_case_id, None)
