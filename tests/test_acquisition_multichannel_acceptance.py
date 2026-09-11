from benchmarks.acquisition.build_multichannel_acceptance_packet import build_packet


def _candidate(name: str, *, content: str | None = None) -> dict[str, object]:
    return {
        "provider_result_id": name,
        "url": f"https://example.com/{name}",
        "canonical_url": f"https://example.com/{name}",
        "title": name,
        "source": "example.com",
        "source_roles": ["DISCOVERY_SIGNAL"],
        "rank": 1,
        "content": content,
        "provider_metadata": {},
    }


def _run(provider_id: str, mission_id: str, candidate: dict[str, object]) -> dict[str, object]:
    return {
        "status": "success",
        "provider_id": provider_id,
        "mission_id": mission_id,
        "candidates": [candidate],
    }


def test_multichannel_packet_pairs_providers_and_keeps_review_provider_blind() -> None:
    manifest = {
        "acceptance_profile": {"profile_id": "test"},
        "mission_meta": {
            "m1": {
                "editorial_modes": ["FAST_INFO_GAP"],
                "series_hints": ["每日信息差"],
            },
            "m2": {
                "editorial_modes": ["HUMAN_STORY"],
                "series_hints": ["人物与文化"],
            },
        },
        "missions": [{"mission_id": "m1"}, {"mission_id": "m2"}],
    }
    artifact = {
        "runs": {
            "exa_search": [
                _run("exa-search", "m1", _candidate("exa-m1")),
                _run("exa-search", "m2", _candidate("exa-m2")),
            ],
            "firecrawl_fetch": [
                {
                    "documents": [
                        {
                            **_candidate("exa-m1"),
                            "content": "# fetched m1 body with enough context",
                            "provider_metadata": {"description": "fetched m1 summary"},
                        },
                        {
                            **_candidate("exa-m2"),
                            "content": "# fetched m2 body with enough context",
                            "provider_metadata": {"description": "fetched m2 summary"},
                        },
                    ]
                }
            ],
            "tavily_search_fetch": [
                _run(
                    "tavily-search-fetch",
                    "m1",
                    _candidate("tavily-m1", content="integrated m1 body"),
                ),
                _run(
                    "tavily-search-fetch",
                    "m2",
                    _candidate("tavily-m2", content="integrated m2 body"),
                ),
            ],
        }
    }

    packet = build_packet(artifact, manifest)

    assert packet["schema_version"] == "multichannel-acceptance-v1"
    assert packet["mission_count"] == 2
    assert packet["sample_count"] == 4
    assert packet["review_policy"]["provider_blind_until_decision"] is True

    samples = packet["samples"]
    assert [sample["blind_review_label"] for sample in samples] == [
        "M1-A",
        "M1-B",
        "M2-A",
        "M2-B",
    ]
    assert samples[0]["review_context"]["quality"] == "FETCHED_DESCRIPTION"
    assert samples[1]["review_context"]["quality"] == "INTEGRATED_CONTENT_EXCERPT"
    assert samples[0]["editorial_modes"] == ["FAST_INFO_GAP"]
    assert samples[2]["series_hints"] == ["人物与文化"]
    assert all(sample["human_review"]["investment_priority"] is None for sample in samples)
    assert all(sample["human_review"]["production_depth"] is None for sample in samples)


def test_multichannel_packet_rejects_missing_provider_pair() -> None:
    manifest = {"missions": [{"mission_id": "m1"}]}
    artifact = {
        "runs": {
            "exa_search": [_run("exa-search", "m1", _candidate("exa-m1"))],
            "tavily_search_fetch": [],
        }
    }

    try:
        build_packet(artifact, manifest)
    except ValueError as exc:
        assert "m1" in str(exc)
    else:
        raise AssertionError("expected missing provider pair to fail")
