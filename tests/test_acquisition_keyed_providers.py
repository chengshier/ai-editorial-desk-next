from __future__ import annotations

import httpx
import pytest

from packages.acquisition.providers import (
    ExaSearchProvider,
    FirecrawlFetchProvider,
    TavilySearchFetchProvider,
)
from packages.acquisition.spike import (
    DiscoveryLane,
    DiscoveryMission,
    ProviderCapability,
    ProviderRunStatus,
    SourceRole,
)


def _mission(lane: DiscoveryLane = DiscoveryLane.POTENTIAL) -> DiscoveryMission:
    return DiscoveryMission(
        mission_id="mission-keyed-provider",
        version="1",
        lane=lane,
        mission_type="TEST",
        objective="test mission",
        query_seeds=["surprising ordinary-life explanation"],
        recency_days=7,
        max_results=2,
    )


@pytest.mark.asyncio
async def test_exa_search_normalizes_results_and_keeps_relevance_separate_from_editorial_value() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-api-key"] == "exa-test"
        payload = request.read().decode()
        assert "startPublishedDate" in payload
        return httpx.Response(
            200,
            json={
                "requestId": "exa-request-1",
                "resolvedSearchType": "neural",
                "costDollars": {"total": 0.007},
                "results": [
                    {
                        "id": "exa-1",
                        "url": "https://example.com/story",
                        "title": "Example story",
                        "publishedDate": "2026-09-10T12:00:00Z",
                        "author": "Reporter",
                    }
                ],
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        run = await ExaSearchProvider(client, api_key="exa-test").run(_mission())

    assert run.status == ProviderRunStatus.SUCCESS
    assert run.cost_usd == pytest.approx(0.007)
    assert run.candidates[0].source_roles == [SourceRole.DISCOVERY_SIGNAL]
    assert run.candidates[0].provider_score is None
    assert run.provider_metadata["request_id"] == "exa-request-1"


@pytest.mark.asyncio
async def test_tavily_integrated_search_fetch_tracks_raw_content_without_promoting_it_to_evidence() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["Authorization"] == "Bearer tavily-test"
        return httpx.Response(
            200,
            json={
                "request_id": "tavily-request-1",
                "usage": {"credits": 2},
                "results": [
                    {
                        "id": "tv-1",
                        "url": "https://example.org/article",
                        "title": "Article",
                        "content": "Relevant snippet",
                        "raw_content": "# Article\nFull body",
                        "published_date": "Wed, 10 Sep 2026 10:00:00 GMT",
                        "score": 0.91,
                    }
                ],
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = TavilySearchFetchProvider(client, api_key="tavily-test")
        run = await provider.run(_mission(DiscoveryLane.MOMENTUM))

    assert provider.descriptor.capabilities == {ProviderCapability.SEARCH, ProviderCapability.FETCH}
    assert run.status == ProviderRunStatus.SUCCESS
    assert run.fetched_count == 1
    assert run.candidates[0].content == "# Article\nFull body"
    assert run.candidates[0].provider_score == pytest.approx(0.91)
    assert run.candidates[0].source_roles == [SourceRole.DISCOVERY_SIGNAL]
    assert run.provider_metadata["credits_used"] == 2


@pytest.mark.asyncio
async def test_firecrawl_independent_fetch_normalizes_markdown() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["Authorization"] == "Bearer firecrawl-test"
        return httpx.Response(
            200,
            json={
                "success": True,
                "data": {
                    "markdown": "# Fetched\nBody",
                    "metadata": {
                        "title": "Fetched page",
                        "sourceURL": "https://example.net/page",
                        "statusCode": 200,
                    },
                },
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        probe = await FirecrawlFetchProvider(client, api_key="firecrawl-test").fetch(
            ["https://example.net/page"]
        )

    assert probe.status == ProviderRunStatus.SUCCESS
    assert probe.fetched_count == 1
    assert probe.documents[0].content == "# Fetched\nBody"
    assert probe.documents[0].source_roles == [SourceRole.DISCOVERY_SIGNAL]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("provider_factory", "call_kind"),
    [
        (lambda client: ExaSearchProvider(client, api_key=None), "run"),
        (lambda client: TavilySearchFetchProvider(client, api_key=None), "run"),
        (lambda client: FirecrawlFetchProvider(client, api_key=None), "fetch"),
    ],
)
async def test_missing_provider_keys_are_explicitly_unavailable_without_network_call(
    provider_factory,
    call_kind: str,
) -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        raise AssertionError("network must not be called without a configured provider key")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = provider_factory(client)
        if call_kind == "run":
            result = await provider.run(_mission())
        else:
            result = await provider.fetch(["https://example.com/page"])

    assert result.status == ProviderRunStatus.UNAVAILABLE
    dumped = result.model_dump_json()
    assert "exa-test" not in dumped
    assert "tavily-test" not in dumped
    assert "firecrawl-test" not in dumped
