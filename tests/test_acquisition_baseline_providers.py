from __future__ import annotations

import json

import httpx
import pytest

from packages.acquisition.providers import HackerNewsProvider, RssFeedProvider
from packages.acquisition.spike import (
    DiscoveryLane,
    DiscoveryMission,
    ProviderRunStatus,
    SourceRole,
)


def _mission(lane: DiscoveryLane, *, max_results: int = 3) -> DiscoveryMission:
    return DiscoveryMission(
        mission_id=f"mission-{lane.value}",
        version="1",
        lane=lane,
        mission_type="TEST",
        objective="test mission",
        query_seeds=["test"],
        max_results=max_results,
    )


@pytest.mark.asyncio
async def test_hackernews_normalizes_ranked_snapshot_without_claiming_velocity() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/topstories.json"):
            return httpx.Response(200, json=[101, 102])
        story_id = int(request.url.path.rsplit("/", 1)[-1].removesuffix(".json"))
        return httpx.Response(
            200,
            json={
                "id": story_id,
                "type": "story",
                "title": f"Story {story_id}",
                "url": f"https://example.com/{story_id}",
                "time": 1_700_000_000,
                "score": 100 - story_id,
                "descendants": 10,
                "by": "author",
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = HackerNewsProvider(client)
        run = await provider.run(_mission(DiscoveryLane.MOMENTUM, max_results=2))

    assert run.status == ProviderRunStatus.SUCCESS
    assert run.retrieved_count == 2
    assert [candidate.rank for candidate in run.candidates] == [1, 2]
    assert SourceRole.DISCOVERY_SIGNAL in run.candidates[0].source_roles
    assert SourceRole.AUDIENCE_SIGNAL in run.candidates[0].source_roles
    assert SourceRole.TREND_SIGNAL not in run.candidates[0].source_roles
    assert run.candidates[0].provider_metadata["snapshot_semantics"] == "rank_only_not_velocity"


@pytest.mark.asyncio
async def test_hackernews_rejects_potential_lane_instead_of_faking_query_match() -> None:
    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda _: httpx.Response(500))) as client:
        provider = HackerNewsProvider(client)
        run = await provider.run(_mission(DiscoveryLane.POTENTIAL))

    assert run.status == ProviderRunStatus.UNSUPPORTED
    assert run.retrieved_count == 0
    assert "semantic search" in (run.failure_reason or "")


@pytest.mark.asyncio
async def test_hackernews_http_failure_is_explicitly_unavailable() -> None:
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"error": "down"})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = HackerNewsProvider(client)
        run = await provider.run(_mission(DiscoveryLane.MOMENTUM))

    assert run.status == ProviderRunStatus.UNAVAILABLE
    assert run.retrieved_count == 0
    assert run.failure_reason is not None


@pytest.mark.asyncio
async def test_rss_provider_normalizes_rss_items_for_ambient_lane() -> None:
    rss = """<?xml version="1.0"?>
    <rss version="2.0"><channel><title>Example</title>
      <item>
        <guid>item-1</guid><title>First story</title>
        <link>https://example.com/first</link>
        <description>Summary</description>
        <pubDate>Wed, 10 Sep 2026 10:00:00 GMT</pubDate>
      </item>
    </channel></rss>"""

    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text=rss)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = RssFeedProvider(client, feed_url="https://example.com/feed.xml")
        run = await provider.run(_mission(DiscoveryLane.AMBIENT))

    assert run.status == ProviderRunStatus.SUCCESS
    assert run.retrieved_count == 1
    assert run.candidates[0].provider_result_id == "item-1"
    assert run.candidates[0].canonical_url == "https://example.com/first"
    assert run.candidates[0].source_roles == [SourceRole.DISCOVERY_SIGNAL]


@pytest.mark.asyncio
async def test_rss_provider_normalizes_atom_and_relative_links() -> None:
    atom = """<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Example</title>
      <entry>
        <id>tag:example.com,2026:1</id>
        <title>Atom story</title>
        <link rel="alternate" href="/atom-story" />
        <updated>2026-09-10T10:00:00Z</updated>
        <summary>Atom summary</summary>
      </entry>
    </feed>"""

    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text=atom, request=httpx.Request("GET", "https://example.com/feed"))

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = RssFeedProvider(client, feed_url="https://example.com/feed")
        run = await provider.run(_mission(DiscoveryLane.AMBIENT))

    assert run.status == ProviderRunStatus.SUCCESS
    assert run.candidates[0].canonical_url == "https://example.com/atom-story"
    assert run.candidates[0].published_at is not None


@pytest.mark.asyncio
async def test_rss_non_ambient_lane_is_unsupported() -> None:
    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda _: httpx.Response(500))) as client:
        provider = RssFeedProvider(client, feed_url="https://example.com/feed")
        run = await provider.run(_mission(DiscoveryLane.MOMENTUM))

    assert run.status == ProviderRunStatus.UNSUPPORTED
    assert run.retrieved_count == 0
