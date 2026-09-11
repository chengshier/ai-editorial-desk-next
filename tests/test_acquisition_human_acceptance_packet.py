from __future__ import annotations

import pytest

from benchmarks.acquisition.build_human_acceptance_packet import build_packet


def _candidate(
    name: str,
    *,
    roles: list[str] | None = None,
    rank: int = 1,
    content: str | None = None,
    metadata: dict[str, object] | None = None,
) -> dict[str, object]:
    return {
        "provider_result_id": name,
        "url": f"https://example.com/{name}",
        "canonical_url": f"https://example.com/{name}",
        "title": name,
        "source": "example.com",
        "source_roles": roles or ["DISCOVERY_SIGNAL"],
        "rank": rank,
        "content": content,
        "provider_metadata": metadata or {},
    }


def test_build_human_acceptance_packet_balances_buckets_and_deduplicates() -> None:
    d3 = {
        "runs": [
            {
                "status": "success",
                "lane": "momentum",
                "provider_id": "google-trends-rss-us",
                "mission_id": "momentum-search-attention-surge",
                "candidates": [
                    _candidate("trend-low", metadata={"approx_traffic_value": 100}),
                    _candidate("trend-high", rank=3, metadata={"approx_traffic_value": 5000}),
                    _candidate("trend-mid", rank=2, metadata={"approx_traffic_value": 1000}),
                ],
            }
        ]
    }
    d2b = {
        "runs": {
            "exa_search": [
                {
                    "status": "success",
                    "provider_id": "exa-search",
                    "mission_id": "potential-a",
                    "candidates": [_candidate("exa-a1"), _candidate("exa-a2", rank=2)],
                },
                {
                    "status": "success",
                    "provider_id": "exa-search",
                    "mission_id": "potential-b",
                    "candidates": [_candidate("exa-b1"), _candidate("exa-b2", rank=2)],
                },
            ],
            "tavily_search_fetch": [
                {
                    "status": "success",
                    "provider_id": "tavily-search-fetch",
                    "mission_id": "control-a",
                    "candidates": [
                        _candidate("control-1", rank=3),
                        _candidate("control-2", rank=2, content="# body"),
                        _candidate("control-3", rank=1),
                    ],
                }
            ],
        }
    }
    d1 = {
        "runs": [
            {
                "status": "success",
                "provider_id": "hackernews-official-topstories",
                "mission_id": "ambient-known-source-updates",
                "candidates": [
                    _candidate(
                        "community-1",
                        roles=["DISCOVERY_SIGNAL", "AUDIENCE_SIGNAL"],
                        rank=1,
                    ),
                    _candidate(
                        "community-2",
                        roles=["DISCOVERY_SIGNAL", "AUDIENCE_SIGNAL"],
                        rank=2,
                    ),
                    _candidate(
                        "community-3",
                        roles=["DISCOVERY_SIGNAL", "AUDIENCE_SIGNAL"],
                        rank=3,
                    ),
                ],
            }
        ]
    }

    packet = build_packet(d1, d2b, d3, bucket_size=2)

    assert packet["status"] == "PENDING_HUMAN_REVIEW"
    assert packet["sample_count"] == 8
    samples = packet["samples"]
    assert [sample["bucket"] for sample in samples] == [
        "momentum",
        "momentum",
        "potential",
        "potential",
        "community",
        "community",
        "control",
        "control",
    ]
    assert samples[0]["title"] == "trend-high"
    assert samples[1]["title"] == "trend-mid"
    assert samples[2]["mission_id"] == "potential-a"
    assert samples[3]["mission_id"] == "potential-b"
    assert samples[4]["source_roles"] == ["DISCOVERY_SIGNAL", "AUDIENCE_SIGNAL"]
    urls = [sample["canonical_url"] for sample in samples]
    assert len(urls) == len(set(urls))
    assert all(sample["human_review"]["decision"] is None for sample in samples)
    assert all(sample["human_review"]["rationale"] is None for sample in samples)


def test_build_human_acceptance_packet_rejects_incomplete_bucket() -> None:
    d3 = {"runs": []}
    d2b = {"runs": {"exa_search": [], "tavily_search_fetch": []}}
    d1 = {"runs": []}

    with pytest.raises(ValueError, match="not enough distinct candidates"):
        build_packet(d1, d2b, d3, bucket_size=1)
