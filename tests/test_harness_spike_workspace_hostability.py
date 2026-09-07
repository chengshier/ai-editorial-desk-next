from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPIKE_ROOT = ROOT / "integrations" / "harness" / "spike-package"


def test_research_workspace_registers_as_additive_conversation_view() -> None:
    client = (SPIKE_ROOT / "src" / "client" / "index.ts").read_text(encoding="utf-8")

    assert "name: 'conversation.view'" in client
    assert "id: 'editorial-research-workspace'" in client
    assert "label: '研究工作台'" in client
    assert "ResearchWorkspaceView" in client


def test_spike_does_not_replace_root_shell_columns() -> None:
    client = (SPIKE_ROOT / "src" / "client" / "index.ts").read_text(encoding="utf-8")

    # M5 validates an additive session view. It must not take over the root
    # sidebar / conversation / details occupants just to make the demo work.
    assert "ctx.slots.register({\n    name: 'sidebar'" not in client
    assert "ctx.slots.register({\n    name: 'conversation'" not in client
    assert "ctx.slots.register({\n    name: 'details'" not in client


def test_research_workspace_contains_three_product_zones() -> None:
    workspace = (
        SPIKE_ROOT / "src" / "client" / "research-workspace.tsx"
    ).read_text(encoding="utf-8")

    assert "研究计划与目标" in workspace
    assert "待解未知项 Unknowns" in workspace
    assert "主张与证据 Claim & Evidence" in workspace
    assert "来源 Sources" in workspace
    assert "可观察的 Agent Activity" in workspace
    assert "条件化结论" in workspace


def test_research_workspace_projects_durable_session_results_without_dom_hacks() -> None:
    workspace = (
        SPIKE_ROOT / "src" / "client" / "research-workspace.tsx"
    ).read_text(encoding="utf-8")

    # The Spike intentionally derives from the current session snapshot / Tool
    # Result metadata. It must not fake cross-view navigation by poking DOM.
    assert "useSession(value => value)" in workspace
    assert "collectWorkspaceProjection(snapshot)" in workspace
    assert "parseResearchResult" in workspace
    assert "document.querySelector" not in workspace
    assert "getElementById" not in workspace
    assert ".click()" not in workspace


def test_hostability_doc_records_exact_pin_navigation_limit() -> None:
    doc = (
        ROOT / "docs" / "07_DELIVERY" / "HARNESS_COMPLEX_WORKBENCH_HOSTABILITY_SPIKE.md"
    ).read_text(encoding="utf-8")

    assert "99f6f02fecdb7dff40c3fbc9470f5907c29f74ca" in doc
    assert "conversation.view" in doc
    assert "Opportunity → Workspace Context Handoff" in doc
    assert "DOM query/click hack" in doc
    assert "Hybrid Web Shell" in doc
