from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / "docs" / "CURRENT_STATE.md"
CLIENT = ROOT / "integrations" / "harness" / "editorial-shell-package" / "src" / "client"
OPPORTUNITIES = CLIENT / "opportunity-workspace.tsx"


def test_opportunities_library_exposes_filters_sort_and_layout() -> None:
    library = OPPORTUNITIES.read_text(encoding="utf-8")

    assert "搜索机会" in library
    assert "recommendation" in library
    assert "research" in library
    assert "readiness" in library
    assert "sort" in library
    assert "card" in library
    assert "compact" in library
    assert "全部机会" in library


def test_opportunities_library_preserves_canonical_business_ids() -> None:
    library = OPPORTUNITIES.read_text(encoding="utf-8")

    assert "opportunity_id" in library
    assert "researchCaseId" in library
    assert "harness_session_id" not in library
    assert "session-" not in library


def test_opportunities_library_does_not_fake_unavailable_actions() -> None:
    library = OPPORTUNITIES.read_text(encoding="utf-8")

    assert "保存视图、批量 Watch / Archive" in library
    assert "本批不伪造这些行为" in library
    assert "Series Fit" in library
    assert "Integrity" in library
    assert "Attention" in library


def test_current_state_records_s3_complete_and_s4_native_migration() -> None:
    state = STATE.read_text(encoding="utf-8")

    assert "S2 Today / Opportunity Inspector       COMPLETE" in state
    assert "S3 Opportunities Library               COMPLETE" in state
    assert "S4_HARNESS_NATIVE_PRODUCT_SHELL_IN_PROGRESS" in state
    assert "S4-N1 Product Shell Foundation           COMPLETE / CI PASS" in state
    assert "S4-N2 Today / Opportunities Migration    COMPLETE / CI PASS" in state
    assert "S4-N3 Research Runtime Adapter           IN_PROGRESS" in state
    assert "Transitional data boundary" in state
    assert "deterministic / in-memory Spike fixture" in state
