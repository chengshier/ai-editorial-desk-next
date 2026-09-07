from fastapi.testclient import TestClient

from apps.editorial_api.main import app

client = TestClient(app)


def test_list_and_inspect_mock_opportunities() -> None:
    response = client.get("/api/v1/spike/opportunities")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 3
    assert body["items"][0]["opportunity_id"] == "opp_dishwasher_water"
    assert body["items"][0]["angle"]
    assert body["items"][0]["theme"]
    assert body["items"][0]["audience_promise"]

    detail = client.get("/api/v1/spike/opportunities/opp_job_scam_yes")
    assert detail.status_code == 200
    assert detail.json()["recommendation"] == "today_main"


def test_missing_opportunity_is_not_found() -> None:
    response = client.get("/api/v1/spike/opportunities/opp_missing")
    assert response.status_code == 404


def test_research_case_progresses_to_consumable_result_and_updates_effective_opportunity() -> None:
    created = client.post(
        "/api/v1/spike/research-cases",
        json={
            "opportunity_id": "opp_dishwasher_water",
            "goal": "验证洗碗机与手洗的条件化用水差异",
        },
    )
    assert created.status_code == 201
    case = created.json()
    assert case["status"] == "queued"
    assert case["research_case_id"].startswith("rc_")

    premature_result = client.get(
        f"/api/v1/spike/research-cases/{case['research_case_id']}/result"
    )
    assert premature_result.status_code == 409

    snapshots = []
    for _ in range(6):
        response = client.get(case["progress_url"])
        assert response.status_code == 200
        snapshots.append(response.json())

    assert snapshots[0]["status"] == "queued"
    assert snapshots[-1]["status"] == "completed"
    assert snapshots[-1]["progress"] == 100
    assert snapshots[-1]["new_evidence_count"] == 4
    assert snapshots[-1]["open_unknown_count"] == 1

    result_response = client.get(
        f"/api/v1/spike/research-cases/{case['research_case_id']}/result"
    )
    assert result_response.status_code == 200
    result = result_response.json()
    assert result["research_case_id"] == case["research_case_id"]
    assert result["opportunity_id"] == "opp_dishwasher_water"
    assert result["result_kind"] == "deterministic_spike_mock"
    assert result["evidence_count"] == 4
    assert len(result["evidence"]) == 4
    assert {item["stance"] for item in result["evidence"]} >= {"supporting", "contradicting"}
    assert result["open_unknown_count"] == 1
    assert len(result["unknowns"]) == 1
    assert "Spike 模拟结论" in result["conclusion"]

    effective = client.get("/api/v1/spike/opportunities/opp_dishwasher_water")
    assert effective.status_code == 200
    opportunity = effective.json()
    assert opportunity["research_status"] == "completed"
    assert opportunity["evidence_state"]["open_unknown_count"] == 1
    assert opportunity["production_readiness"] == "high"


def test_research_case_rejects_unknown_opportunity() -> None:
    response = client.post(
        "/api/v1/spike/research-cases",
        json={"opportunity_id": "opp_missing"},
    )
    assert response.status_code == 404
