from fastapi.testclient import TestClient
from apps.editorial_api.main import app


client = TestClient(app)


def _create_research_case(opportunity_id: str = "opp_dishwasher_water") -> dict[str, str]:
    response = client.post(
        "/api/v1/spike/research-cases",
        json={"opportunity_id": opportunity_id},
    )
    assert response.status_code == 201
    return response.json()


def test_research_runtime_binding_is_business_case_scoped_and_rebindable() -> None:
    created = _create_research_case()
    research_case_id = created["research_case_id"]

    initial = client.get(f"/api/v1/integrations/harness/runtime/research/{research_case_id}")
    assert initial.status_code == 200
    assert initial.json() == {
        "research_case_id": research_case_id,
        "opportunity_id": "opp_dishwasher_water",
        "harness_session_id": None,
        "bootstrap_required": True,
    }

    bound = client.post(
        f"/api/v1/integrations/harness/runtime/research/{research_case_id}/session",
        json={"harness_session_id": "session-a"},
    )
    assert bound.status_code == 200
    assert bound.json()["harness_session_id"] == "session-a"
    assert bound.json()["bootstrap_required"] is True

    wrong = client.post(
        f"/api/v1/integrations/harness/runtime/research/{research_case_id}/bootstrap-complete",
        json={"harness_session_id": "session-other"},
    )
    assert wrong.status_code == 409

    completed = client.post(
        f"/api/v1/integrations/harness/runtime/research/{research_case_id}/bootstrap-complete",
        json={"harness_session_id": "session-a"},
    )
    assert completed.status_code == 200
    assert completed.json()["bootstrap_required"] is False

    same_session = client.post(
        f"/api/v1/integrations/harness/runtime/research/{research_case_id}/session",
        json={"harness_session_id": "session-a"},
    )
    assert same_session.status_code == 200
    assert same_session.json()["bootstrap_required"] is False

    rebound = client.post(
        f"/api/v1/integrations/harness/runtime/research/{research_case_id}/session",
        json={"harness_session_id": "session-b"},
    )
    assert rebound.status_code == 200
    assert rebound.json()["harness_session_id"] == "session-b"
    assert rebound.json()["bootstrap_required"] is True


def test_runtime_binding_rejects_unknown_research_case() -> None:
    response = client.get("/api/v1/integrations/harness/runtime/research/rc_missing")
    assert response.status_code == 404
