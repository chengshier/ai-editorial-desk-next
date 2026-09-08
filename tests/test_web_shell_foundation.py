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

    assert "['/research', '研究']" in app
    assert "['/research', '正在研究', FolderKanban]" in app
    assert "ResearchIndexPage" in app
    assert "Research Hub → Research Case → Harness Workspace" in app
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
    app = APP.read_text(encoding="utf-8")
    state = CURRENT_STATE.read_text(encoding="utf-8")

    assert "S5 接入 HumanSubmission API 后才会真正提交" in app
    assert "S4 接入 Harness Agent" in app
    assert "TODAY_OPPORTUNITY_INSPECTOR_IN_PROGRESS" in state
    assert "不得把 Spike fixture 表述为真实外部发现结果" in state
