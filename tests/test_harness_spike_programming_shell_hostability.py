from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPIKE_ROOT = ROOT / "integrations" / "harness" / "spike-package"
DOC = ROOT / "docs" / "07_DELIVERY" / "HARNESS_PROGRAMMING_SHELL_HOSTABILITY_SPIKE.md"


def test_programming_shell_spike_freezes_exact_pin_and_product_scope() -> None:
    doc = DOC.read_text(encoding="utf-8")

    assert "99f6f02fecdb7dff40c3fbc9470f5907c29f74ca" in doc
    assert "Programming / 编排是一级业务模块" in doc
    assert "conversation.view" in doc
    assert "Session scoped" in doc


def test_programming_shell_spike_records_root_shell_replacement_risk() -> None:
    doc = DOC.read_text(encoding="utf-8")

    assert "sidebar       single / root" in doc
    assert "conversation  single / session-maybe" in doc
    assert "sidebar.workspaces      single / root" in doc
    assert "FAIL WITH ARCHITECTURE FINDING" in doc


def test_spike_does_not_take_over_harness_root_shell() -> None:
    client = (SPIKE_ROOT / "src" / "client" / "index.ts").read_text(encoding="utf-8")

    assert "name: 'root'" not in client
    assert "name: 'sidebar'" not in client
    assert "name: 'conversation'" not in client
    assert "name: 'details'" not in client
    assert "document.querySelector" not in client
    assert "getElementById" not in client


def test_hybrid_architecture_is_the_recorded_decision() -> None:
    doc = DOC.read_text(encoding="utf-8")

    assert "Hybrid Web Shell + Harness-powered Agent / Research Workbench" in doc
    assert "Full Harness Workbench" in doc
    assert "Editorial API / DB" in doc
    assert "Hybrid Shell Contract" in doc
