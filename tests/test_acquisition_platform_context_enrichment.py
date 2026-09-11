from __future__ import annotations

import json

import httpx
import pytest

from benchmarks.acquisition.run_platform_context_enrichment import (
    load_hotlist,
    run_enrichment,
    select_topics,
)


def _artifact() -> dict[str, object]:
    return {
        "run_kind": "platform-hotlist-live-baseline",
        "runs": [
            {
                "status": "success",
                "provider_metadata": {"platform_id": "douyin"},
                "candidates": [
                    {
                        "title": "共同热点",
                        "rank": 1,
                        "url": "https://www.douyin.com/hot/1",
                        "provider_result_id": "1",
                        "provider_metadata": {"observed_at": "2026-09-11T10:00:00Z"},
                    },
                    {
                        "title": "抖音第二条",
                        "rank": 2,
                        "url": "https://www.douyin.com/hot/2",
                        "provider_result_id": "2",
                        "provider_metadata": {"observed_at": "2026-09-11T10:00:00Z"},
                    },
                ],
            },
            {
                "status": "success",
                "provider_metadata": {"platform_id": "bilibili-hot-search"},
                "candidates": [
                    {
                        "title": "B站第一条",
                        "rank": 1,
                        "url": "https://search.bilibili.com/all?keyword=first",
                        "provider_result_id": "first",
                        "provider_metadata": {"observed_at": "2026-09-11T10:00:01Z"},
                    },
                    {
                        "title": "共同热点",
                        "rank": 5,
                        "url": "https://search.bilibili.com/all?keyword=shared",
                        "provider_result_id": "shared",
                        "provider_metadata": {"observed_at": "2026-09-11T10:00:01Z"},
                    },
                ],
            },
        ],
    }


def test_select_topics_keeps_top_n_and_cross_platform_provenance() -> None:
    topics = select_topics(_artifact(), per_platform=1)

    assert [topic["title"] for topic in topics] == ["共同热点", "B站第一条"]
    shared = topics[0]
    assert shared["cross_platform"] is True
    assert [signal["platform_id"] for signal in shared["signals"]] == [
        "douyin",
        "bilibili-hot-search",
    ]


def test_load_hotlist_rejects_wrong_artifact_kind(tmp_path) -> None:
    path = tmp_path / "bad.json"
    path.write_text(json.dumps({"run_kind": "other"}), encoding="utf-8")

    with pytest.raises(ValueError, match="platform-hotlist-live-baseline"):
        load_hotlist(path)


@pytest.mark.asyncio
async def test_run_enrichment_preserves_hotlist_signal_and_adds_search_fetch_context(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("EXA_API_KEY", "exa-test")
    monkeypatch.setenv("FIRECRAWL_API_KEY", "firecrawl-test")

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "api.exa.ai":
            payload = json.loads(request.read().decode())
            query = payload["query"]
            return httpx.Response(
                200,
                json={
                    "requestId": f"req-{query}",
                    "resolvedSearchType": "neural",
                    "costDollars": {"total": 0.001},
                    "results": [
                        {
                            "id": f"exa-{query}",
                            "url": "https://example.com/context",
                            "title": "Context story",
                        }
                    ],
                },
            )
        if request.url.host == "api.firecrawl.dev":
            payload = json.loads(request.read().decode())
            return httpx.Response(
                200,
                json={
                    "success": True,
                    "data": {
                        "markdown": "# Context\nVerified background",
                        "metadata": {
                            "title": "Context story",
                            "sourceURL": payload["url"],
                            "statusCode": 200,
                        },
                    },
                },
            )
        raise AssertionError(f"unexpected URL {request.url}")

    topic = select_topics(_artifact(), per_platform=1)[0]
    transport = httpx.MockTransport(handler)
    original_async_client = httpx.AsyncClient

    def client_factory(*args, **kwargs):
        kwargs["transport"] = transport
        return original_async_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", client_factory)
    result = await run_enrichment([topic], max_results=2, fetch_limit=1)

    assert result["run_kind"] == "platform-hotlist-context-enrichment"
    assert result["topic_count"] == 1
    enriched = result["topics"][0]
    assert enriched["topic"]["cross_platform"] is True
    assert enriched["exa_search"]["status"] == "success"
    assert enriched["firecrawl_fetch"]["status"] == "success"
    dumped = json.dumps(result, ensure_ascii=False)
    assert "exa-test" not in dumped
    assert "firecrawl-test" not in dumped
