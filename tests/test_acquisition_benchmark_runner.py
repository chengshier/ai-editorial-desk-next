from __future__ import annotations

import json

import pytest

from benchmarks.acquisition.run_keyed_search_fetch import (
    DEFAULT_MANIFEST,
    load_missions,
    run_benchmark,
    select_missions,
)


@pytest.mark.asyncio
async def test_keyed_benchmark_runner_is_safe_without_provider_keys(monkeypatch) -> None:
    for name in ("EXA_API_KEY", "FIRECRAWL_API_KEY", "TAVILY_API_KEY"):
        monkeypatch.delenv(name, raising=False)

    missions = load_missions(DEFAULT_MANIFEST)[:1]
    result = await run_benchmark(missions, fetch_limit=2)

    assert result["mission_count"] == 1
    exa_runs = result["runs"]["exa_search"]
    tavily_runs = result["runs"]["tavily_search_fetch"]
    firecrawl_runs = result["runs"]["firecrawl_fetch"]
    assert exa_runs[0]["status"] == "unavailable"
    assert tavily_runs[0]["status"] == "unavailable"
    assert firecrawl_runs == []
    assert result["assessments"]["exa_search"][0]["required_roles_satisfied"] is False
    assert result["assessments"]["tavily_search_fetch"][0]["required_roles_satisfied"] is False
    rendered = json.dumps(result)
    assert "EXA_API_KEY" in rendered
    assert "FIRECRAWL_API_KEY" not in rendered
    assert "TAVILY_API_KEY" in rendered
    assert "Bearer" not in rendered


def test_keyed_benchmark_can_cap_selected_mission_result_budget() -> None:
    missions = load_missions(DEFAULT_MANIFEST)
    selected = select_missions(
        missions,
        ["potential-common-belief-contradiction"],
        max_results=3,
    )

    assert len(selected) == 1
    assert selected[0].mission_id == "potential-common-belief-contradiction"
    assert selected[0].max_results == 3
    assert len(selected[0].query_seeds) == 2
