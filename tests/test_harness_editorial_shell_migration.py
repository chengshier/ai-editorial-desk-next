from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "integrations" / "harness" / "editorial-shell-package" / "src"
CLIENT = PACKAGE / "client"
WORKBENCH = CLIENT / "workbench.tsx"
OPPORTUNITIES = CLIENT / "opportunity-workspace.tsx"
EDITORIAL = CLIENT / "editorial.ts"
STATE = CLIENT / "product-state.ts"
RUNTIME = CLIENT / "runtime-adapter.ts"
HOST_TOOL = PACKAGE / "research-tool.ts"
CURRENT_STATE = ROOT / "docs" / "CURRENT_STATE.md"


def test_formal_shell_is_native_plugin_not_embedded_web_shell() -> None:
    source = "\n".join(
        path.read_text(encoding="utf-8")
        for path in (WORKBENCH, OPPORTUNITIES, EDITORIAL, STATE, RUNTIME)
    )

    assert "react-router-dom" not in source
    assert "<iframe" not in source
    assert "surface_url" not in source
    assert "editorial_embed" not in source
    assert "editorial_launch" not in source
    assert "http://127.0.0.1:18000" in source


def test_n2_migrates_today_opportunities_and_five_tab_inspector() -> None:
    workbench = WORKBENCH.read_text(encoding="utf-8")
    opportunities = OPPORTUNITIES.read_text(encoding="utf-8")
    editorial = EDITORIAL.read_text(encoding="utf-8")

    assert 'kind="today"' in workbench
    assert 'kind="library"' in workbench
    assert "Opportunity Inspector" in opportunities
    for label in ("概览", "证据", "研究", "时间线", "历史"):
        assert label in opportunities
    assert "/api/v1/spike/shell/opportunities" in editorial
    assert "保存视图、批量 Watch / Archive" in opportunities
    assert "本批不伪造" in opportunities


def test_n3_research_runtime_uses_canonical_case_and_public_harness_outward_api() -> None:
    workbench = WORKBENCH.read_text(encoding="utf-8")
    opportunities = OPPORTUNITIES.read_text(encoding="utf-8")
    editorial = EDITORIAL.read_text(encoding="utf-8")
    runtime = RUNTIME.read_text(encoding="utf-8")
    host_tool = HOST_TOOL.read_text(encoding="utf-8")

    assert "latest_research_case_id" in opportunities
    assert "createEditorialResearchCase" in opportunities
    assert "/api/v1/spike/research-cases" in editorial
    assert "Research Case 已就绪" in workbench
    assert "harness_session_id · runtime metadata" in workbench

    assert "ISessions" in runtime
    assert "IWorkspaces" in runtime
    assert "sessionService.open" in runtime
    assert "sessionService.binding" in runtime
    assert "workspaceService.connectWorkspace" in runtime
    assert "workspaceService.listDirectory" in runtime
    assert "workspaceService.createDirectory" in runtime
    assert "workspaceService.create({ path: runtimePath })" in runtime
    assert "ai-editorial-desk-runtime" in runtime
    assert "Register or open a Workspace before running Research" not in runtime
    assert ".session.prompt(" in runtime
    assert "/api/v1/integrations/harness/runtime/research/" in runtime
    assert "research_case_id" in runtime
    assert "harness_session_id" in runtime
    assert "document.querySelector" not in runtime
    assert "session-" not in workbench

    assert "get_editorial_research_result" in host_tool
    assert "Never creates a new Research Case" in host_tool
    assert "start_editorial_research" not in host_tool


def test_product_query_state_is_namespaced_and_refresh_safe() -> None:
    state = STATE.read_text(encoding="utf-8")
    opportunities = OPPORTUNITIES.read_text(encoding="utf-8")

    assert "ed_section" in state
    assert "window.history.replaceState" in state
    assert "library_q" in opportunities
    assert "library_recommendation" in opportunities
    assert "library_research" in opportunities
    assert "library_readiness" in opportunities
    assert "library_sort" in opportunities
    assert "library_layout" in opportunities
    assert "opportunity" in opportunities
    assert "inspector" in opportunities


def test_s4_engineering_status_is_closed_before_local_smoke() -> None:
    current = CURRENT_STATE.read_text(encoding="utf-8")
    assert "S4_HARNESS_NATIVE_PRODUCT_SHELL_ENGINEERING_COMPLETE" in current
    assert "S4-N5 Web Shell Retirement               COMPLETE / CI PASS" in current
    assert "Windows final local smoke                PENDING" in current
