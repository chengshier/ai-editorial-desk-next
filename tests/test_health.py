from fastapi.testclient import TestClient

from apps.editorial_api.main import app


def test_healthz_reports_architecture_baseline() -> None:
    response = TestClient(app).get("/healthz")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "phase": "architecture-baseline-v1",
    }
