from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "apps" / "web" / "src"
APP = WEB / "App.tsx"
LIBRARY = WEB / "pages" / "OpportunitiesLibraryPage.tsx"
SIDEBAR = WEB / "components" / "shell" / "Sidebar.tsx"
STATE = ROOT / "docs" / "CURRENT_STATE.md"


def test_opportunities_route_is_no_longer_placeholder() -> None:
    app = APP.read_text(encoding="utf-8")

    assert "OpportunitiesLibraryPage" in app
    assert 'path="/opportunities" element={<OpportunitiesLibraryPage/>}' in app
    assert 'title="机会库" description="长期浏览、筛选与管理完整 Opportunity corpus。"' not in app


def test_library_uses_api_url_state_and_shared_inspector() -> None:
    library = LIBRARY.read_text(encoding="utf-8")

    assert "listEditorialOpportunities" in library
    assert "inspectEditorialOpportunity" in library
    assert "createEditorialResearchCase" in library
    assert "useSearchParams" in library
    assert "OpportunityInspector" in library
    assert "OpportunityCard" in library
    for parameter in ["q", "recommendation", "research", "readiness", "sort", "layout", "opportunity", "inspector"]:
        assert parameter in library
    assert "/research/${encodeURIComponent(researchCaseId)}" in library
    assert "harness_session_id" not in library
    assert "127.0.0.1:3080" not in library


def test_sidebar_counts_refresh_when_product_route_changes() -> None:
    sidebar = SIDEBAR.read_text(encoding="utf-8")

    assert "listEditorialOpportunities" in sidebar
    assert "[location.pathname]" in sidebar
    assert "research: items.filter((item) => item.research_status === 'running').length" in sidebar


def test_library_does_not_fake_missing_canonical_capabilities() -> None:
    library = LIBRARY.read_text(encoding="utf-8")

    assert "保存视图、批量 Watch / Archive" in library
    assert "本批不伪造这些行为" in library
    assert "Series Fit" in library
    assert "Integrity" in library
    assert "Attention" in library


def test_current_state_marks_s3_complete_before_s4() -> None:
    state = STATE.read_text(encoding="utf-8")

    assert "OPPORTUNITIES_LIBRARY = COMPLETE" in state
    assert "TODAY_OPPORTUNITY_INSPECTOR = COMPLETE" in state
    assert "HARNESS_RESEARCH_INTEGRATION_IN_PROGRESS" in state
    assert "当前 Gate：S4 Harness Research Integration" in state
    assert "不代表生产全量 corpus" in state
