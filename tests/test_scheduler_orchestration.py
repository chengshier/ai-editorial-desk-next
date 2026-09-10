from collections.abc import AsyncIterator

import pytest
from fastapi.testclient import TestClient

from apps.editorial_api import scheduler
from apps.editorial_api.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_scheduler_ledger() -> None:
    with scheduler._RUN_LOCK:
        scheduler._RUNS.clear()
        scheduler._RUN_BY_IDEMPOTENCY.clear()
        scheduler._RUN_INPUT_HASH.clear()


def _create_research_case(opportunity_id: str = "opp_dishwasher_water") -> str:
    response = client.post(
        "/api/v1/spike/research-cases",
        json={"opportunity_id": opportunity_id},
    )
    assert response.status_code == 201
    return response.json()["research_case_id"]


def _complete_research_case(opportunity_id: str = "opp_dishwasher_water") -> str:
    research_case_id = _create_research_case(opportunity_id)
    progress = None
    for _ in range(5):
        response = client.get(f"/api/v1/spike/research-cases/{research_case_id}")
        assert response.status_code == 200
        progress = response.json()
    assert progress is not None
    assert progress["status"] == "completed"
    return research_case_id


def _success_result(payload: dict[str, object]) -> dict[str, object]:
    return {
        "ok": True,
        "scheduler_run_id": payload["scheduler_run_id"],
        "operation": payload["operation"],
        "research_case_id": payload["research_case_id"],
        "opportunity_id": payload["opportunity_id"],
        "harness_session_id": "session-headless-a",
        "completion_signal": "agent_idle+canonical_tool_result",
        "tool_result_observed": True,
        "harness_commit": scheduler.HARNESS_COMMIT,
        "harness_release": scheduler.HARNESS_RELEASE,
        "execution_seam": scheduler.EXECUTION_SEAM,
        "provider": "deepseek-official",
        "model": "deepseek-v4-flash",
    }


def test_manual_run_records_business_identity_separately_from_runtime_metadata(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    research_case_id = _complete_research_case()

    async def fake_execute(payload: dict[str, object]) -> dict[str, object]:
        return _success_result(payload)

    monkeypatch.setattr(scheduler, "_execute_headless", fake_execute)
    response = client.post(
        f"/api/v1/integrations/harness/scheduler/research/{research_case_id}/run-now",
        json={"idempotency_key": "manual-success-1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "succeeded"
    assert body["business_object_type"] == "research_case"
    assert body["business_object_id"] == research_case_id
    assert body["operation"] == "research.rehydrate"
    assert body["runtime_provenance"]["harness_session_id"] == "session-headless-a"
    assert body["runtime_provenance"]["harness_session_id"] != research_case_id
    assert body["runtime_provenance"]["completion_signal"] == "agent_idle+canonical_tool_result"
    assert body["execution_provenance"]["business_object_id"] == research_case_id
    assert body["persistence"] == "transitional_in_memory"

    replay = client.get(f"/api/v1/integrations/harness/scheduler/runs/{body['run_id']}")
    assert replay.status_code == 200
    assert replay.json() == body


def test_manual_run_same_idempotency_key_reuses_existing_run(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    research_case_id = _complete_research_case()
    calls = 0

    async def fake_execute(payload: dict[str, object]) -> dict[str, object]:
        nonlocal calls
        calls += 1
        return _success_result(payload)

    monkeypatch.setattr(scheduler, "_execute_headless", fake_execute)
    path = f"/api/v1/integrations/harness/scheduler/research/{research_case_id}/run-now"
    first = client.post(path, json={"idempotency_key": "same-manual-key"})
    second = client.post(path, json={"idempotency_key": "same-manual-key"})

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["run_id"] == second.json()["run_id"]
    assert calls == 1


def test_idempotency_key_cannot_be_reused_for_different_business_input(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    first_case = _complete_research_case("opp_dishwasher_water")
    second_case = _complete_research_case("opp_job_scam_yes")

    async def fake_execute(payload: dict[str, object]) -> dict[str, object]:
        return _success_result(payload)

    monkeypatch.setattr(scheduler, "_execute_headless", fake_execute)
    first = client.post(
        f"/api/v1/integrations/harness/scheduler/research/{first_case}/run-now",
        json={"idempotency_key": "bound-once"},
    )
    assert first.status_code == 200

    conflict = client.post(
        f"/api/v1/integrations/harness/scheduler/research/{second_case}/run-now",
        json={"idempotency_key": "bound-once"},
    )
    assert conflict.status_code == 409
    assert "different scheduler input" in conflict.json()["detail"]


def test_manual_run_records_explicit_failure_and_redacts_secret(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    research_case_id = _complete_research_case()
    monkeypatch.setenv("DEEPSEEK_API_KEY", "do-not-leak-this-key")

    async def fake_execute(_payload: dict[str, object]) -> dict[str, object]:
        return {
            "ok": False,
            "tool_result_observed": False,
            "failure_code": "canonical_tool_result_missing",
            "failure_reason": "provider diagnostic do-not-leak-this-key",
            "completion_signal": "agent_idle_without_canonical_tool_result",
            "harness_session_id": "session-headless-failed",
        }

    monkeypatch.setattr(scheduler, "_execute_headless", fake_execute)
    response = client.post(
        f"/api/v1/integrations/harness/scheduler/research/{research_case_id}/run-now",
        json={"idempotency_key": "manual-failure-1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "failed"
    assert body["failure_code"] == "canonical_tool_result_missing"
    assert body["failure_reason"] == "provider diagnostic [REDACTED]"
    assert body["runtime_provenance"]["completion_signal"] == "agent_idle_without_canonical_tool_result"


def test_manual_run_rejects_unknown_or_incomplete_research_case() -> None:
    unknown = client.post(
        "/api/v1/integrations/harness/scheduler/research/rc_missing/run-now",
        json={},
    )
    assert unknown.status_code == 404

    incomplete_case = _create_research_case()
    incomplete = client.post(
        f"/api/v1/integrations/harness/scheduler/research/{incomplete_case}/run-now",
        json={},
    )
    assert incomplete.status_code == 409
    assert "must be completed" in incomplete.json()["detail"]
