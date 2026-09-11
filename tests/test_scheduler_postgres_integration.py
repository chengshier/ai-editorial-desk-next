from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from apps.editorial_api import scheduler
from apps.editorial_api.scheduler_persistence import SchedulerPostgresStore
from apps.editorial_api.spike_harness import _RESEARCH, _RESEARCH_LOCK, _ResearchRecord


@pytest.mark.asyncio
async def test_scheduler_run_survives_repository_restart() -> None:
    database_url = os.getenv("SCHEDULER_POSTGRES_TEST_URL")
    if not database_url:
        pytest.skip("PostgreSQL integration URL is not configured")

    suffix = uuid4().hex
    run_id = f"run_{suffix}"
    research_case_id = f"rc_{suffix[:12]}"
    idempotency_key = f"integration:{suffix}"
    now = datetime.now(UTC)
    run = {
        "run_id": run_id,
        "task_id": None,
        "operation": "research.rehydrate",
        "business_object_type": "research_case",
        "business_object_id": research_case_id,
        "opportunity_id": "opp_postgres_integration",
        "trigger_kind": "manual",
        "status": "running",
        "idempotency_key": idempotency_key,
        "attempt": 1,
        "started_at": now,
        "finished_at": None,
        "failure_code": None,
        "failure_reason": None,
        "runtime_provenance": {
            "harness_commit": "pin",
            "harness_release": "release",
            "execution_seam": "typescript-sdk-jsonrpc-stdio",
            "harness_session_id": None,
            "provider": None,
            "model": None,
            "completion_signal": None,
        },
        "execution_provenance": {
            "operation": "research.rehydrate",
            "business_object_type": "research_case",
            "business_object_id": research_case_id,
            "trigger_kind": "manual",
            "attempt": 1,
            "input_hash": "a" * 64,
        },
    }

    first = SchedulerPostgresStore(database_url)
    created, reused = await first.create_run(run, "a" * 64)
    assert reused is False
    assert created["persistence"] == "postgresql"
    await first.close()

    restarted = SchedulerPostgresStore(database_url)
    restored = await restarted.get_run(run_id)
    assert restored is not None
    assert restored["business_object_id"] == research_case_id
    assert restored["runtime_provenance"]["harness_session_id"] is None

    duplicate, reused = await restarted.create_run({**run, "run_id": f"run_{uuid4().hex}"}, "a" * 64)
    assert reused is True
    assert duplicate["run_id"] == run_id

    restored["status"] = "succeeded"
    restored["finished_at"] = datetime.now(UTC)
    restored["runtime_provenance"]["harness_session_id"] = "session-runtime-only"
    persisted = await restarted.update_run(restored)
    assert persisted["status"] == "succeeded"

    history = await restarted.list_runs(business_object_id=research_case_id)
    assert [item["run_id"] for item in history] == [run_id]
    assert history[0]["runtime_provenance"]["harness_session_id"] == "session-runtime-only"
    await restarted.close()


@pytest.mark.asyncio
async def test_interval_task_claim_is_restart_safe_and_single_consumer() -> None:
    database_url = os.getenv("SCHEDULER_POSTGRES_TEST_URL")
    if not database_url:
        pytest.skip("PostgreSQL integration URL is not configured")

    suffix = uuid4().hex
    task_id = f"task_{suffix}"
    research_case_id = f"rc_{suffix[:12]}"
    now = datetime.now(UTC)
    due_at = now - timedelta(seconds=1)
    task = {
        "task_id": task_id,
        "operation": "research.rehydrate",
        "business_object_type": "research_case",
        "business_object_id": research_case_id,
        "enabled": True,
        "interval_seconds": 300,
        "next_run_at": due_at,
        "created_at": now,
        "updated_at": now,
    }

    first = SchedulerPostgresStore(database_url)
    stored = await first.upsert_interval_task(task)
    assert stored["next_run_at"] == due_at
    claimed = await first.claim_due_interval_tasks(now=now, limit=10)
    assert len(claimed) == 1
    assert claimed[0]["task_id"] == task_id
    assert claimed[0]["claimed_for_at"] == due_at
    assert claimed[0]["next_run_at"] == now + timedelta(seconds=300)
    await first.close()

    restarted = SchedulerPostgresStore(database_url)
    no_duplicate_claim = await restarted.claim_due_interval_tasks(now=now, limit=10)
    assert no_duplicate_claim == []
    recovered = await restarted.get_task(task_id)
    assert recovered is not None
    assert recovered["next_run_at"] == now + timedelta(seconds=300)

    disabled = await restarted.set_task_enabled(task_id, enabled=False, updated_at=now)
    assert disabled is not None
    assert disabled["enabled"] is False
    still_not_claimed = await restarted.claim_due_interval_tasks(
        now=now + timedelta(seconds=600),
        limit=10,
    )
    assert still_not_claimed == []
    await restarted.close()


@pytest.mark.asyncio
async def test_interval_tick_creates_one_scheduled_run_with_business_identity(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_url = os.getenv("SCHEDULER_POSTGRES_TEST_URL")
    if not database_url:
        pytest.skip("PostgreSQL integration URL is not configured")

    suffix = uuid4().hex
    research_case_id = f"rc_{suffix[:12]}"
    opportunity_id = "opp_dishwasher_water"
    now = datetime.now(UTC)
    store = SchedulerPostgresStore(database_url)
    monkeypatch.setattr(scheduler, "_durable_store", lambda: store)

    async def fake_execute(payload: dict[str, object]) -> dict[str, object]:
        return {
            "ok": True,
            "scheduler_run_id": payload["scheduler_run_id"],
            "operation": payload["operation"],
            "research_case_id": payload["research_case_id"],
            "opportunity_id": payload["opportunity_id"],
            "harness_session_id": "session-scheduled-runtime",
            "completion_signal": "agent_idle+canonical_tool_result",
            "tool_result_observed": True,
            "harness_commit": scheduler.HARNESS_COMMIT,
            "harness_release": scheduler.HARNESS_RELEASE,
            "execution_seam": scheduler.EXECUTION_SEAM,
            "provider": "deepseek-official",
            "model": "deepseek-v4-flash",
        }

    monkeypatch.setattr(scheduler, "_execute_headless", fake_execute)
    with _RESEARCH_LOCK:
        _RESEARCH[research_case_id] = _ResearchRecord(
            research_case_id=research_case_id,
            opportunity_id=opportunity_id,
            goal="integration",
            completed=True,
        )

    try:
        task = await scheduler.create_interval_task(
            research_case_id,
            scheduler.IntervalTaskRequest(
                interval_seconds=300,
                first_run_at=now - timedelta(seconds=1),
            ),
        )
        assert task.business_object_id == research_case_id
        assert task.next_run_at == now - timedelta(seconds=1)

        runs = await scheduler.run_scheduler_tick(scheduler.SchedulerTickRequest(now=now))
        matching = [run for run in runs if run.task_id == task.task_id]
        assert len(matching) == 1
        run = matching[0]
        assert run.trigger_kind == "schedule"
        assert run.business_object_id == research_case_id
        assert run.opportunity_id == opportunity_id
        assert run.status == "succeeded"
        assert run.runtime_provenance.harness_session_id == "session-scheduled-runtime"
        assert run.idempotency_key.startswith(f"schedule:{task.task_id}:")

        second_tick = await scheduler.run_scheduler_tick(scheduler.SchedulerTickRequest(now=now))
        assert all(item.task_id != task.task_id for item in second_tick)
    finally:
        with _RESEARCH_LOCK:
            _RESEARCH.pop(research_case_id, None)
        await store.close()
