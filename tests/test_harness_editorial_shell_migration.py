from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIENT = ROOT / "integrations" / "harness" / "editorial-shell-package" / "src" / "client"
WORKBENCH = CLIENT / "workbench.tsx"
OPPORTUNITIES = CLIENT / "opportunity-workspace.tsx"
EDITORIAL = CLIENT / "editorial.ts"
STATE = CLIENT / "product-state.ts"


def test_formal_shell_is_native_plugin_not_embedded_web_shell() -> None:
    source = "\n".join(
        path.read_text(encoding="utf-8")
        for path in (WORKBENCH, OPPORTUNITIES, EDITORIAL, STATE)
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


def test_research_entry_uses_canonical_research_case_before_runtime_adapter() -> None:
    workbench = WORKBENCH.read_text(encoding="utf-8")
    opportunities = OPPORTUNITIES.read_text(encoding="utf-8")
    editorial = EDITORIAL.read_text(encoding="utf-8")

    assert "latest_research_case_id" in opportunities
    assert "createEditorialResearchCase" in opportunities
    assert "/api/v1/spike/research-cases" in editorial
    assert "researchCaseId" in workbench
    assert "Research Case 已就绪" in workbench
    assert "N3 未完成前，这里不会伪造“Agent 已开始研究”" in workbench
    assert "Runtime Adapter 主动绑定 Harness Session" in opportunities


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
