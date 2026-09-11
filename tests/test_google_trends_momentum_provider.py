from __future__ import annotations

import httpx
import pytest

from packages.acquisition.providers import GoogleTrendsRssProvider
from packages.acquisition.spike import (
    DiscoveryLane,
    DiscoveryMission,
    ProviderCapability,
    ProviderRunStatus,
    SourceRole,
)


def _mission(mission_type: str = "ATTENTION_SURGE") -> DiscoveryMission:
    return DiscoveryMission(
        mission_id="momentum-test",
        version="1",
        lane=DiscoveryLane.MOMENTUM,
        mission_type=mission_type,
        objective="test momentum",
        query_seeds=["recent search attention surge"],
        required_source_roles=[SourceRole.TREND_SIGNAL, SourceRole.DISCOVERY_SIGNAL],
        recency_days=7,
        max_results=2,
    )


@pytest.mark.asyncio
async def test_google_trends_rss_normalizes_search_surge_without_claiming_editorial_value() -> None:
    rss = """<?xml version="1.0" encoding="UTF-8"?>
    <rss xmlns:ht="https://trends.google.com/trends/trendingsearches/daily" version="2.0">
      <channel>
        <title>Daily Search Trends</title>
        <item>
          <title>Example breakout topic</title>
          <ht:approx_traffic>200,000+</ht:approx_traffic>
          <description>example topic, related query</description>
          <link>https://trends.google.com/trending?geo=US</link>
          <pubDate>Thu, 10 Sep 2026 12:00:00 GMT</pubDate>
          <ht:news_item>
            <ht:news_item_title>Example news</ht:news_item_title>
            <ht:news_item_snippet>Context</ht:news_item_snippet>
            <ht:news_item_url>https://example.com/news</ht:news_item_url>
            <ht:news_item_source>Example News</ht:news_item_source>
          </ht:news_item>
        </item>
      </channel>
    </rss>"""

    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["geo"] == "US"
        return httpx.Response(200, text=rss)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = GoogleTrendsRssProvider(client, geo="US")
        run = await provider.run(_mission())

    assert provider.descriptor.capabilities == {ProviderCapability.TREND, ProviderCapability.FEED}
    assert run.status == ProviderRunStatus.SUCCESS
    assert run.retrieved_count == 1
    candidate = run.candidates[0]
    assert candidate.url == "https://example.com/news"
    assert candidate.source_roles == [SourceRole.TREND_SIGNAL, SourceRole.DISCOVERY_SIGNAL]
    assert candidate.provider_score is None
    assert candidate.provider_metadata["approx_traffic"] == "200,000+"
    assert candidate.provider_metadata["approx_traffic_value"] == 200000
    assert candidate.provider_metadata["related_news"][0]["source"] == "Example News"
    assert "editorial value" in candidate.provider_metadata["trend_semantics"]


@pytest.mark.asyncio
async def test_google_trends_rss_rejects_mission_shapes_it_cannot_prove() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        raise AssertionError("unsupported mission must not call Google Trends")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = GoogleTrendsRssProvider(client)
        run = await provider.run(_mission("COMMUNITY_ACCELERATION"))

    assert run.status == ProviderRunStatus.UNSUPPORTED
    assert run.retrieved_count == 0
    assert "does not prove" in (run.failure_reason or "")


@pytest.mark.asyncio
async def test_google_trends_rss_http_failure_is_explicitly_unavailable() -> None:
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(503, text="unavailable")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = GoogleTrendsRssProvider(client)
        run = await provider.run(_mission())

    assert run.status == ProviderRunStatus.UNAVAILABLE
    assert run.retrieved_count == 0
    assert run.failure_reason is not None
