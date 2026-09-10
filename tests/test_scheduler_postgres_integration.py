from __future__ import annotations

import os
from datetime import UTC, datetime
from uuid import uuid4

import pytest

from apps.editorial_api.scheduler_persistence import SchedulerPostgresStore


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
