from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from apps.editorial_api.scheduler_persistence import SchedulerPostgresStore


def _run_fixture(*, run_id: str, task_id: str, research_case_id: str, now: datetime) -> dict[str, object]:
    return {
        "run_id": run_id,
        "task_id": task_id,
        "operation": "research.rehydrate",
        "business_object_type": "research_case",
        "business_object_id": research_case_id,
        "opportunity_id": "opp_retry_integration",
        "trigger_kind": "schedule",
        "status": "running",
        "idempotency_key": f"schedule:{task_id}:{now.isoformat()}",
        "attempt": 1,
        "scheduled_for": now,
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
            "trigger_kind": "schedule",
            "attempt": 1,
            "input_hash": "b" * 64,
        },
    }


@pytest.mark.asyncio
async def test_failed_schedule_run_retries_same_logical_run_with_attempt_history() -> None:
    database_url = os.getenv("SCHEDULER_POSTGRES_TEST_URL")
    if not database_url:
        pytest.skip("PostgreSQL integration URL is not configured")

    suffix = uuid4().hex
    task_id = f"task_{suffix}"
    run_id = f"run_{suffix}"
    research_case_id = f"rc_{suffix[:12]}"
    now = datetime.now(UTC)
    store = SchedulerPostgresStore(database_url)

    await store.upsert_interval_task(
        {
            "task_id": task_id,
            "operation": "research.rehydrate",
            "business_object_type": "research_case",
            "business_object_id": research_case_id,
            "enabled": True,
            "interval_seconds": 300,
            "catch_up_policy": "skip",
            "catch_up_limit": 1,
            "retry_max_attempts": 3,
            "retry_backoff_seconds": 30,
            "next_run_at": now + timedelta(seconds=300),
            "created_at": now,
            "updated_at": now,
        }
    )
    run = _run_fixture(run_id=run_id, task_id=task_id, research_case_id=research_case_id, now=now)
    await store.create_run(run, "b" * 64)

    run["status"] = "failed"
    run["finished_at"] = now
    run["failure_code"] = "provider_transient"
    failed = await store.update_run(run)
    assert failed["run_id"] == run_id
    assert failed["attempt"] == 1
    assert failed["next_retry_at"] == now + timedelta(seconds=30)

    claimed = await store.claim_due_retries(now=now + timedelta(seconds=30), limit=10)
    assert len(claimed) == 1
    retry = claimed[0]
    assert retry["run_id"] == run_id
    assert retry["attempt"] == 2
    assert retry["status"] == "running"
    assert retry["business_object_id"] == research_case_id
    assert retry["idempotency_key"] == run["idempotency_key"]
    assert retry["execution_provenance"]["attempt"] == 2

    retry["status"] = "failed"
    retry["finished_at"] = now + timedelta(seconds=31)
    retry["failure_code"] = "provider_transient"
    failed_again = await store.update_run(retry)
    assert failed_again["next_retry_at"] == now + timedelta(seconds=91)

    attempts = await store.list_attempts(run_id)
    assert [item["attempt"] for item in attempts] == [1, 2]
    assert attempts[0]["status"] == "failed"
    assert attempts[1]["status"] == "failed"

    task = await store.get_task(task_id)
    assert task is not None
    assert task["last_run_at"] == now + timedelta(seconds=31)
    await store.close()


@pytest.mark.asyncio
async def test_bounded_catch_up_discards_excess_backlog_after_policy_limit() -> None:
    database_url = os.getenv("SCHEDULER_POSTGRES_TEST_URL")
    if not database_url:
        pytest.skip("PostgreSQL integration URL is not configured")

    suffix = uuid4().hex
    task_id = f"task_{suffix}"
    now = datetime.now(UTC)
    first_due = now - timedelta(seconds=240)
    store = SchedulerPostgresStore(database_url)
    await store.upsert_interval_task(
        {
            "task_id": task_id,
            "operation": "research.rehydrate",
            "business_object_type": "research_case",
            "business_object_id": f"rc_{suffix[:12]}",
            "enabled": True,
            "interval_seconds": 60,
            "catch_up_policy": "bounded",
            "catch_up_limit": 2,
            "retry_max_attempts": 1,
            "retry_backoff_seconds": 60,
            "next_run_at": first_due,
            "created_at": now,
            "updated_at": now,
        }
    )

    claimed = await store.claim_due_interval_tasks(now=now, limit=10)
    matching = [item for item in claimed if item["task_id"] == task_id]
    assert [item["claimed_for_at"] for item in matching] == [
        first_due,
        first_due + timedelta(seconds=60),
    ]

    task = await store.get_task(task_id)
    assert task is not None
    assert task["next_run_at"] == now + timedelta(seconds=60)
    assert await store.claim_due_interval_tasks(now=now, limit=10) == []
    await store.close()
