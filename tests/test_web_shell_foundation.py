from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "apps" / "web" / "src"
APP = WEB / "App.tsx"
HARNESS = WEB / "integrations" / "harness.tsx"
CURRENT_STATE = ROOT / "docs" / "CURRENT_STATE.md"


def test_web_shell_owns_frozen_product_routes() -> None:
    app = APP.read_text(encoding="utf-8")

    for route in (
        "/today",
        "/opportunities",
        "/research",
        "/research/:researchCaseId",
        "/programming",
        "/creation",
        "/publication",
        "/performance",
        "/knowledge",
        "/manage/acquisition",
        "/manage/configuration",
        "/manage/system",
    ):
        assert route in app


def test_research_navigation_has_global_hub_and_case_workspace() -> None:
    app = APP.read_text(encoding="utf-8")

    top_nav = (WEB / "components" / "shell" / "TopNav.tsx").read_text(encoding="utf-8")
    sidebar = (WEB / "components" / "shell" / "Sidebar.tsx").read_text(encoding="utf-8")
    assert "['/research', '研究']" in top_nav
    assert "['/research', '正在研究', FolderKanban]" in sidebar
    assert "ResearchIndexPage" in app
    assert "Harness-powered Workspace" in app
    assert "primary-nav__item--disabled" not in app


def test_research_uses_launch_descriptor_and_keeps_surface_url_opaque() -> None:
    app = APP.read_text(encoding="utf-8")
    harness = HARNESS.read_text(encoding="utf-8")

    assert "HarnessSurfaceHost" in app
    assert "researchCaseId" in app
    assert "HarnessLaunchDescriptor" in harness
    assert "'/v1/integrations/harness/launches'" in harness
    assert "surfaceUrl" in harness
    assert "harnessSessionId" in harness
    assert "<iframe" in harness
    assert "src={launch.surfaceUrl}" in harness
    assert "document.querySelector" not in harness
    assert "127.0.0.1:3080" not in harness
    assert "session-" not in harness


def test_shell_does_not_claim_future_integrations_are_complete() -> None:
    state = CURRENT_STATE.read_text(encoding="utf-8")

    modal = (WEB / "components" / "shell" / "HumanSubmissionModal.tsx").read_text(
        encoding="utf-8"
    )
    top_nav = (WEB / "components" / "shell" / "TopNav.tsx").read_text(encoding="utf-8")
    assert "S5 接入 HumanSubmission API 后才会真正提交" in modal
    assert "Research 已接入 Harness；通用 Agent 入口后续开放" in top_nav
    assert "HARNESS_RESEARCH_INTEGRATION_IN_PROGRESS" in state
    assert "OPPORTUNITIES_LIBRARY = COMPLETE" in state
    assert "TODAY_OPPORTUNITY_INSPECTOR = COMPLETE" in state
    assert "不代表生产全量 corpus" in state
