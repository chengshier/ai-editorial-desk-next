from fastapi.testclient import TestClient

from apps.editorial_api.main import app

client = TestClient(app)


def _create_research_case() -> dict[str, str]:
    response = client.post(
        "/api/v1/spike/research-cases",
        json={"opportunity_id": "opp_dishwasher_water"},
    )
    assert response.status_code == 201
    return response.json()


def test_research_launch_resolves_business_context_and_returns_opaque_surface() -> None:
    case = _create_research_case()

    response = client.post(
        "/api/v1/integrations/harness/launches",
        json={
            "intent": "research",
            "research_case_id": case["research_case_id"],
            "return_path": f"/research/{case['research_case_id']}",
        },
    )

    assert response.status_code == 201
    launch = response.json()
    assert launch["launch_id"].startswith("hl_")
    assert launch["intent"] == "research"
    assert launch["opportunity_id"] == "opp_dishwasher_water"
    assert launch["research_case_id"] == case["research_case_id"]
    assert launch["harness_session_id"] is None
    assert launch["transport"] == "embedded"
    assert "editorial_launch=" in launch["surface_url"]
    assert case["research_case_id"] not in launch["surface_url"]
    assert launch["return_url"] == f"/research/{case['research_case_id']}"


def test_session_binding_is_reused_and_bootstrap_completion_is_idempotent() -> None:
    case = _create_research_case()
    created = client.post(
        "/api/v1/integrations/harness/launches",
        json={
            "intent": "research",
            "research_case_id": case["research_case_id"],
            "return_path": "/opportunities?opportunity=opp_dishwasher_water&inspector=research",
        },
    ).json()

    bound = client.post(
        f"/api/v1/integrations/harness/launches/{created['launch_id']}/session",
        json={"harness_session_id": "session-s4-test"},
    )
    assert bound.status_code == 200
    assert bound.json()["harness_session_id"] == "session-s4-test"
    assert bound.json()["bootstrap_required"] is True

    completed = client.post(
        f"/api/v1/integrations/harness/launches/{created['launch_id']}/bootstrap-complete",
        json={"harness_session_id": "session-s4-test"},
    )
    assert completed.status_code == 200
    assert completed.json()["bootstrap_required"] is False

    resumed = client.post(
        "/api/v1/integrations/harness/launches",
        json={
            "intent": "research",
            "research_case_id": case["research_case_id"],
            "return_path": f"/research/{case['research_case_id']}",
        },
    )
    assert resumed.status_code == 201
    assert resumed.json()["harness_session_id"] == "session-s4-test"
    assert resumed.json()["bootstrap_required"] is False


def test_stale_session_rebind_requires_rehydration_again() -> None:
    case = _create_research_case()
    launch = client.post(
        "/api/v1/integrations/harness/launches",
        json={
            "intent": "research",
            "research_case_id": case["research_case_id"],
            "return_path": f"/research/{case['research_case_id']}",
        },
    ).json()

    first = client.post(
        f"/api/v1/integrations/harness/launches/{launch['launch_id']}/session",
        json={"harness_session_id": "session-old"},
    ).json()
    assert first["bootstrap_required"] is True
    client.post(
        f"/api/v1/integrations/harness/launches/{launch['launch_id']}/bootstrap-complete",
        json={"harness_session_id": "session-old"},
    )

    rebound = client.post(
        f"/api/v1/integrations/harness/launches/{launch['launch_id']}/session",
        json={"harness_session_id": "session-new"},
    )
    assert rebound.status_code == 200
    assert rebound.json()["harness_session_id"] == "session-new"
    assert rebound.json()["bootstrap_required"] is True


def test_launch_rejects_missing_case_mismatched_opportunity_and_external_return_url() -> None:
    missing_case = client.post(
        "/api/v1/integrations/harness/launches",
        json={"intent": "research", "return_path": "/research"},
    )
    assert missing_case.status_code == 422

    case = _create_research_case()
    mismatch = client.post(
        "/api/v1/integrations/harness/launches",
        json={
            "intent": "research",
            "research_case_id": case["research_case_id"],
            "opportunity_id": "opp_job_scam_yes",
            "return_path": "/research",
        },
    )
    assert mismatch.status_code == 409

    external = client.post(
        "/api/v1/integrations/harness/launches",
        json={
            "intent": "research",
            "research_case_id": case["research_case_id"],
            "return_path": "https://example.com/escape",
        },
    )
    assert external.status_code == 400
