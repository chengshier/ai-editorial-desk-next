from __future__ import annotations

import httpx
import pytest

from benchmarks.acquisition.run_no_key_baselines import run_benchmark
from packages.acquisition.spike import DiscoveryMission


@pytest.mark.asyncio
async def test_no_key_runner_records_role_coverage_without_fake_trend() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        if url == "https://feeds.test/news.xml":
            return httpx.Response(
                200,
                text=(
                    "<rss version='2.0'><channel><title>Feed</title>"
                    "<item><guid>feed-1</guid><title>Feed story</title>"
                    "<link>https://example.test/feed-story</link></item>"
                    "</channel></rss>"
                ),
                request=request,
            )
        if url.endswith("/topstories.json"):
            return httpx.Response(200, json=[101], request=request)
        if url.endswith("/item/101.json"):
            return httpx.Response(
                200,
                json={
                    "id": 101,
                    "type": "story",
                    "title": "Community story",
                    "url": "https://example.test/community-story",
                    "score": 42,
                    "descendants": 12,
                    "time": 1_725_000_000,
                },
                request=request,
            )
        raise AssertionError(f"unexpected request: {url}")

    missions = [
        DiscoveryMission(
            mission_id="ambient",
            version="1",
            lane="ambient",
            mission_type="AMBIENT",
            objective="ambient coverage",
            query_seeds=["ambient"],
            required_source_roles=["DISCOVERY_SIGNAL"],
            max_results=1,
        ),
        DiscoveryMission(
            mission_id="momentum",
            version="1",
            lane="momentum",
            mission_type="MOMENTUM",
            objective="attention movement",
            query_seeds=["momentum"],
            required_source_roles=["TREND_SIGNAL", "AUDIENCE_SIGNAL"],
            max_results=1,
        ),
    ]
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        result = await run_benchmark(
            missions,
            client=client,
            rss_feeds=[("rss-test", "https://feeds.test/news.xml")],
            hn_lists=["topstories"],
        )

    assert result["run_kind"] == "no-key-live-baseline"
    assert len(result["runs"]) == 4
    assessments = result["assessments"]
    rss_ambient = next(
        item
        for item in assessments
        if item["provider_id"] == "rss-test" and item["mission_id"] == "ambient"
    )
    assert rss_ambient["required_roles_satisfied"] is True

    hn_momentum = next(
        item
        for item in assessments
        if item["provider_id"] == "hackernews-official-topstories"
        and item["mission_id"] == "momentum"
    )
    assert hn_momentum["run_status"] == "success"
    assert hn_momentum["required_roles_satisfied"] is False
    assert hn_momentum["missing_required_source_roles"] == ["TREND_SIGNAL"]
    assert "snapshot rank only" in result["semantics"]["hn_rank"]
