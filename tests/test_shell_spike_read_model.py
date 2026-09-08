from fastapi.testclient import TestClient

from apps.editorial_api.main import app

client = TestClient(app)


def test_shell_read_model_exposes_latest_research_case_without_changing_harness_contract() -> None:
    before = client.get("/api/v1/spike/shell/opportunities/opp_job_scam_yes")
    assert before.status_code == 200
    assert before.json()["latest_research_case_id"] is None

    created = client.post(
        "/api/v1/spike/research-cases",
        json={"opportunity_id": "opp_job_scam_yes"},
    )
    assert created.status_code == 201
    research_case_id = created.json()["research_case_id"]

    shell_detail = client.get("/api/v1/spike/shell/opportunities/opp_job_scam_yes")
    assert shell_detail.status_code == 200
    assert shell_detail.json()["latest_research_case_id"] == research_case_id

    harness_detail = client.get("/api/v1/spike/opportunities/opp_job_scam_yes")
    assert harness_detail.status_code == 200
    assert "latest_research_case_id" not in harness_detail.json()


def test_shell_list_uses_effective_opportunity_state() -> None:
    response = client.get("/api/v1/spike/shell/opportunities")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 3
    assert all("latest_research_case_id" in item for item in body["items"])
