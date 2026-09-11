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


def test_research_navigation_has_global_hub_and_case_workspace_reference() -> None:
    app = APP.read_text(encoding="utf-8")

    top_nav = (WEB / "components" / "shell" / "TopNav.tsx").read_text(encoding="utf-8")
    sidebar = (WEB / "components" / "shell" / "Sidebar.tsx").read_text(encoding="utf-8")
    assert "['/research', '研究']" in top_nav
    assert "['/research', '正在研究', FolderKanban]" in sidebar
    assert "ResearchIndexPage" in app
    assert "Legacy migration reference only" in app
    assert "正式 Research 产品入口已迁入 Harness-native Product Shell" in app
    assert "DeepSeek Harness Web → AI Editorial Desk Product Shell" in app
    assert "primary-nav__item--disabled" not in app


def test_research_keeps_stable_harness_boundary_without_private_transport() -> None:
    app = APP.read_text(encoding="utf-8")
    harness = HARNESS.read_text(encoding="utf-8")

    assert "HarnessSurfaceHost" in app
    assert "researchCaseId" in app
    assert "HarnessLaunchDescriptor" in harness
    assert "surfaceUrl" in harness
    assert "harnessSessionId" in harness
    assert "<iframe" not in harness
    assert "document.querySelector" not in harness
    assert "127.0.0.1:3080" not in harness


def test_shell_does_not_claim_future_integrations_are_complete() -> None:
    state = CURRENT_STATE.read_text(encoding="utf-8")

    modal = (WEB / "components" / "shell" / "HumanSubmissionModal.tsx").read_text(
        encoding="utf-8"
    )
    top_nav = (WEB / "components" / "shell" / "TopNav.tsx").read_text(encoding="utf-8")
    assert "S5 接入 HumanSubmission API 后才会真正提交" in modal
    assert "S4 接入 Harness Agent" in top_nav
    assert "PHASE_0_5B_ACQUISITION_PROVIDER_SPIKE_IN_PROGRESS" in state
    assert "S4_HARNESS_NATIVE_PRODUCT_SHELL_ENGINEERING_COMPLETE" in state
    assert "S4-N2 Today / Opportunities Migration" in state
    assert "EXTERNAL_WEB_SHELL_IFRAME_HARNESS = SUPERSEDED" in state
    assert "S4-N5 Web Shell Retirement" in state
    assert "Transitional data boundary" in state
