from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
HISTORICAL_CONTRACT = DOCS / "04_CONTRACTS" / "HYBRID_SHELL_CONTRACT.md"
ACTIVE_CONTRACT = DOCS / "04_CONTRACTS" / "HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md"
HISTORICAL_ADR = DOCS / "ADR" / "ADR-0009-hybrid-web-shell-harness.md"
ACTIVE_ADR = DOCS / "ADR" / "ADR-0010-harness-native-product-shell.md"
CURRENT_STATE = DOCS / "CURRENT_STATE.md"
DECISIONS = DOCS / "DECISIONS.md"
UI_STRATEGY = DOCS / "03_ARCHITECTURE" / "HARNESS_UI_STRATEGY.md"
INTEGRATION = DOCS / "03_ARCHITECTURE" / "HARNESS_INTEGRATION.md"
TOPOLOGY = DOCS / "03_ARCHITECTURE" / "HARNESS_RUNTIME_TOPOLOGY.md"


def test_harness_native_product_shell_is_active_architecture() -> None:
    adr = ACTIVE_ADR.read_text(encoding="utf-8")
    state = CURRENT_STATE.read_text(encoding="utf-8")
    decisions = DECISIONS.read_text(encoding="utf-8")

    assert "Status\nAccepted" in adr
    assert "Harness-native Product Shell" in adr
    assert "HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL = ACCEPTED" in state
    assert "EXTERNAL_WEB_SHELL_IFRAME_HARNESS = SUPERSEDED" in state
    assert "HARNESS_UPSTREAM_CORE_PATCH = FORBIDDEN_BY_DEFAULT" in state
    assert "ADR-0010" in decisions
    assert "Harness-native AI Editorial Desk Product Shell" in decisions


def test_old_hybrid_architecture_is_preserved_only_as_history() -> None:
    adr = HISTORICAL_ADR.read_text(encoding="utf-8")
    contract = HISTORICAL_CONTRACT.read_text(encoding="utf-8")
    decisions = DECISIONS.read_text(encoding="utf-8")

    assert "Superseded by ADR-0010" in adr
    assert "SUPERSEDED / HISTORICAL" in contract
    assert "Hybrid Web Shell" in contract
    assert "surface_url" in contract
    assert "不得继续作为正式 Product Shell 实现依据" in contract
    assert "ADR-0009" in decisions
    assert "Superseded by ADR-0010" in decisions


def test_active_contract_uses_business_identity_and_public_runtime_seams() -> None:
    contract = ACTIVE_CONTRACT.read_text(encoding="utf-8")

    for business_id in (
        "opportunity_id",
        "research_case_id",
        "candidate_id",
        "draft_id",
        "publication_id",
    ):
        assert business_id in contract

    assert "harness_session_id" in contract
    assert "Runtime metadata" in contract
    assert "Session.prompt()" in contract
    assert "get_editorial_research_result" in contract
    assert "ai-editorial-desk-runtime" in contract
    assert "listDirectory()" in contract
    assert "createDirectory()" in contract
    assert "connectWorkspace()" in contract
    assert "public `IWorkspaces`" in contract


def test_active_architecture_rejects_formal_iframe_launch_host() -> None:
    contract = ACTIVE_CONTRACT.read_text(encoding="utf-8")
    integration = INTEGRATION.read_text(encoding="utf-8")
    topology = TOPOLOGY.read_text(encoding="utf-8")

    assert "iframe embedding as its normal host" in contract
    assert "`surface_url` launch descriptors as the Product UI transport" in contract
    assert "iframe" in integration
    assert "`surface_url`" in integration
    assert "正式 Product Shell" in integration
    assert "apps/web = migration reference + regression baseline" in topology
    assert "Product Shell Plugin" in topology


def test_ui_strategy_and_current_state_close_n3_and_start_n4() -> None:
    strategy = UI_STRATEGY.read_text(encoding="utf-8")
    state = CURRENT_STATE.read_text(encoding="utf-8")

    assert "S4-N3 Research Runtime Adapter           COMPLETE" in strategy
    assert "S4-N4 Scheduler / Headless Orchestration NEXT" in strategy
    assert "S4-N3 Research Runtime Adapter           COMPLETE / CI PASS" in state
    assert "S4-N4 Scheduler / Headless Orchestration IN_PROGRESS" in state
    assert "N4-A exact-pin audit + Contract        COMPLETE" in state
    assert "N4-B Manual Run vertical slice         COMPLETE / CI PASS" in state
    assert "N4-C Durable Task / Run model          NEXT" in state
    assert "ai-editorial-desk-runtime" in state
    assert "IWorkspaces" in state
