from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "apps" / "web" / "src"
APP = WEB / "App.tsx"
TODAY = WEB / "pages" / "TodayRadarPage.tsx"
EDITORIAL = WEB / "lib" / "editorial.ts"
VITE = ROOT / "apps" / "web" / "vite.config.ts"
SHELL_SPIKE = ROOT / "apps" / "editorial_api" / "shell_spike.py"
CURRENT_STATE = ROOT / "docs" / "CURRENT_STATE.md"


def test_today_uses_editorial_api_and_url_backed_inspector_state() -> None:
    app = APP.read_text(encoding="utf-8")
    today = TODAY.read_text(encoding="utf-8")
    editorial = EDITORIAL.read_text(encoding="utf-8")

    assert "TodayRadarPage" in app
    assert 'path="/today"' in app
    assert "listEditorialOpportunities" in today
    assert "inspectEditorialOpportunity" in today
    assert "useSearchParams" in today
    assert "opportunity" in today
    assert "inspector" in today
    assert "/v1/spike/shell/opportunities" in editorial
    assert "hard-coding browser fixtures" in editorial


def test_today_research_entry_uses_business_research_case_id() -> None:
    today = TODAY.read_text(encoding="utf-8")
    adapter = SHELL_SPIKE.read_text(encoding="utf-8")

    assert "latest_research_case_id" in adapter
    assert "latest_research_case_id" in today
    assert "createEditorialResearchCase" in today
    assert "/research/${encodeURIComponent(researchCaseId)}" in today
    assert "harness_session_id" not in today
    assert "127.0.0.1:3080" not in today


def test_dev_server_proxies_editorial_api_without_browser_cors_hack() -> None:
    vite = VITE.read_text(encoding="utf-8")

    assert "EDITORIAL_API_PROXY_TARGET" in vite
    assert "'/api'" in vite
    assert "http://127.0.0.1:18000" in vite


def test_s2_state_stays_complete_without_claiming_fixture_is_production_truth() -> None:
    state = CURRENT_STATE.read_text(encoding="utf-8")

    assert "S2 Today / Opportunity Inspector       COMPLETE" in state
    assert "S3 Opportunities Library               COMPLETE" in state
    assert "S4_HARNESS_NATIVE_PRODUCT_SHELL_IN_PROGRESS" in state
    assert "Transitional data boundary" in state
    assert "deterministic mock 是 production research result" in state
    assert "真实外部 Acquisition 已完成" in state
