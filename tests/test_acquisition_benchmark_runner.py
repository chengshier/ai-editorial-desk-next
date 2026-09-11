from __future__ import annotations

import json

import pytest

from benchmarks.acquisition.run_keyed_search_fetch import (
    DEFAULT_MANIFEST,
    load_missions,
    run_benchmark,
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
    rendered = json.dumps(result)
    assert "EXA_API_KEY" in rendered
    assert "FIRECRAWL_API_KEY" not in rendered
    assert "TAVILY_API_KEY" in rendered
    assert "Bearer" not in rendered
