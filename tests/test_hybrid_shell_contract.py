from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
CONTRACT = DOCS / "04_CONTRACTS" / "HYBRID_SHELL_CONTRACT.md"
ADR = DOCS / "ADR" / "ADR-0009-hybrid-web-shell-harness.md"
CURRENT_STATE = DOCS / "CURRENT_STATE.md"
DECISIONS = DOCS / "DECISIONS.md"
UI_STRATEGY = DOCS / "03_ARCHITECTURE" / "HARNESS_UI_STRATEGY.md"


def test_harness_native_architecture_supersedes_hybrid_host_after_spike() -> None:
    adr = ADR.read_text(encoding="utf-8")
    state = CURRENT_STATE.read_text(encoding="utf-8")
    decisions = DECISIONS.read_text(encoding="utf-8")

    # ADR/DECISIONS preserve the historical Hybrid gate that led to the spike.
    assert "HYBRID_WEB_HARNESS" in adr
    assert "HYBRID_WEB_HARNESS = ACCEPTED" in decisions
    assert "HARNESS_FULL_WORKBENCH = REJECTED_FOR_V1" in decisions

    # PR #15 replaced the external Web Shell + iframe host direction without
    # changing the canonical business/runtime ownership rules.
    assert "HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL = ACCEPTED" in state
    assert "EXTERNAL_WEB_SHELL_IFRAME_HARNESS = SUPERSEDED" in state
    assert "HARNESS_UPSTREAM_CORE_PATCH = FORBIDDEN_BY_DEFAULT" in state


def test_product_routes_use_business_scope_not_harness_session_scope() -> None:
    contract = CONTRACT.read_text(encoding="utf-8")

    assert "P01  /today" in contract
    assert "P02  /opportunities" in contract
    assert "P03  /research/:research_case_id" in contract
    assert "P04  /programming" in contract
    assert "harness_session_id" in contract
    assert "does **not** use Harness Session ID as the canonical route key" in contract


def test_shell_harness_launch_is_behind_stable_integration_contract() -> None:
    contract = CONTRACT.read_text(encoding="utf-8")

    assert "POST /api/v1/integrations/harness/launches" in contract
    assert "`surface_url` is opaque to the Shell" in contract
    assert "return_url" in contract
    assert "document.querySelector" in contract
    assert "private Harness stores" in contract


def test_ui_strategy_keeps_research_in_harness_but_global_modules_in_shell() -> None:
    strategy = UI_STRATEGY.read_text(encoding="utf-8")

    assert "Research Workspace" in strategy
    assert "Programming / Creation / Publication" in strategy
    assert "conversation.view" in strategy
    assert "scope 是 Session" in strategy
    assert "因为这些对象必须跨 Session 长期存在" in strategy
    assert "Full Harness Workbench 不再作为 V1 目标" in strategy
