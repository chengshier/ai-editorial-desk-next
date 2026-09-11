"""Enrich E5-A platform hot-list signals with Exa Search + Firecrawl context."""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path

import httpx

from packages.acquisition.providers import ExaSearchProvider, FirecrawlFetchProvider
from packages.acquisition.spike import (
    DiscoveryLane,
    DiscoveryMission,
    ProviderRunStatus,
    SourceRole,
)


def load_hotlist(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or payload.get("run_kind") != "platform-hotlist-live-baseline":
        raise ValueError("hotlist artifact must be a platform-hotlist-live-baseline object")
    return payload


def _topic_key(title: str) -> str:
    return " ".join(title.casefold().split())


def select_topics(payload: dict[str, object], *, per_platform: int) -> list[dict[str, object]]:
    if per_platform < 1:
        raise ValueError("per_platform must be >= 1")
    raw_runs = payload.get("runs")
    if not isinstance(raw_runs, list):
        raise TypeError("hotlist artifact runs must be an array")

    all_topics: dict[str, dict[str, object]] = {}
    selected_keys: set[str] = set()
    selected_order: list[str] = []

    for raw_run in raw_runs:
        if not isinstance(raw_run, dict) or raw_run.get("status") != "success":
            continue
        provider_metadata = raw_run.get("provider_metadata")
        platform_id = (
            provider_metadata.get("platform_id")
            if isinstance(provider_metadata, dict)
            else raw_run.get("provider_id")
        )
        candidates = raw_run.get("candidates")
        if not isinstance(candidates, list):
            continue
        for index, candidate in enumerate(candidates):
            if not isinstance(candidate, dict):
                continue
            title = candidate.get("title")
            if not isinstance(title, str) or not title.strip():
                continue
            key = _topic_key(title)
            topic = all_topics.setdefault(
                key,
                {
                    "title": title.strip(),
                    "signals": [],
                },
            )
            metadata = candidate.get("provider_metadata")
            observed_at = metadata.get("observed_at") if isinstance(metadata, dict) else None
            signal = {
                "platform_id": platform_id,
                "rank": candidate.get("rank"),
                "url": candidate.get("url"),
                "provider_result_id": candidate.get("provider_result_id"),
                "observed_at": observed_at,
            }
            extra = metadata.get("extra") if isinstance(metadata, dict) else None
            if isinstance(extra, dict):
                if extra.get("info") is not None:
                    signal["info"] = extra.get("info")
                if extra.get("hover") is not None:
                    signal["hover"] = extra.get("hover")
            signals = topic["signals"]
            assert isinstance(signals, list)
            signals.append(signal)

            if index < per_platform and key not in selected_keys:
                selected_keys.add(key)
                selected_order.append(key)

    # Cross-platform repetition is useful Momentum provenance even when the
    # duplicate is not inside every platform's top-N selection.
    for key, topic in all_topics.items():
        signals = topic["signals"]
        assert isinstance(signals, list)
        platforms = {signal.get("platform_id") for signal in signals if isinstance(signal, dict)}
        if len(platforms) > 1 and key not in selected_keys:
            selected_keys.add(key)
            selected_order.append(key)

    selected: list[dict[str, object]] = []
    for key in selected_order:
        topic = all_topics[key]
        signals = topic["signals"]
        assert isinstance(signals, list)
        topic = dict(topic)
        topic["cross_platform"] = len(
            {signal.get("platform_id") for signal in signals if isinstance(signal, dict)}
        ) > 1
        selected.append(topic)
    return selected


def _context_mission(title: str, *, max_results: int) -> DiscoveryMission:
    digest = hashlib.sha256(title.encode("utf-8")).hexdigest()[:12]
    return DiscoveryMission(
        mission_id=f"hotlist-context-{digest}",
        version="1",
        lane=DiscoveryLane.RESEARCH,
        mission_type="HOTLIST_CONTEXT_ENRICHMENT",
        objective=(
            "为平台热榜线索补充近期公开网页背景、官方回应与可信媒体上下文；"
            "不得把热榜标题本身当作事实结论。"
        ),
        query_seeds=[title, f"{title} 官方 回应 背景"],
        source_preferences=["official", "professional-media", "local-media"],
        required_source_roles=[SourceRole.DISCOVERY_SIGNAL],
        recency_days=14,
        max_results=max_results,
    )


async def run_enrichment(
    topics: list[dict[str, object]],
    *,
    max_results: int,
    fetch_limit: int,
) -> dict[str, object]:
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        exa = ExaSearchProvider(client, api_key=os.getenv("EXA_API_KEY"))
        firecrawl = FirecrawlFetchProvider(client, api_key=os.getenv("FIRECRAWL_API_KEY"))
        enriched: list[dict[str, object]] = []
        for topic in topics:
            title = topic.get("title")
            if not isinstance(title, str):
                continue
            mission = _context_mission(title, max_results=max_results)
            search_run = await exa.run(mission)
            fetch_probe = None
            if search_run.status in {ProviderRunStatus.SUCCESS, ProviderRunStatus.PARTIAL}:
                urls = [candidate.url for candidate in search_run.candidates[:fetch_limit]]
                if urls:
                    fetch_probe = await firecrawl.fetch(urls)
            enriched.append(
                {
                    "topic": topic,
                    "context_mission": mission.model_dump(mode="json"),
                    "exa_search": search_run.model_dump(mode="json"),
                    "firecrawl_fetch": (
                        fetch_probe.model_dump(mode="json") if fetch_probe is not None else None
                    ),
                }
            )

    return {
        "schema_version": "1",
        "run_kind": "platform-hotlist-context-enrichment",
        "topic_count": len(enriched),
        "parameters": {
            "max_results": max_results,
            "fetch_limit": fetch_limit,
            "selection": (
                "top N per successful platform plus any exact-title cross-platform repetitions"
            ),
        },
        "providers": {
            "search": exa.descriptor.model_dump(mode="json"),
            "fetch": firecrawl.descriptor.model_dump(mode="json"),
        },
        "topics": enriched,
        "semantics": {
            "hotlist_signal": "platform attention snapshot only; not editorial value or evidence",
            "cross_platform": "same normalized title observed on more than one platform in one snapshot",
            "search_fetch": "background/context retrieval only; Research still decides evidence status",
            "secret_policy": "provider keys are environment-only and never serialized",
        },
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hotlist", type=Path, required=True)
    parser.add_argument("--per-platform", type=int, default=2)
    parser.add_argument("--max-results", type=int, default=2)
    parser.add_argument("--fetch-limit", type=int, default=2)
    parser.add_argument("--output", type=Path)
    return parser.parse_args()


async def _async_main() -> int:
    args = _parse_args()
    if not 1 <= args.max_results <= 10:
        raise ValueError("--max-results must be between 1 and 10")
    if not 1 <= args.fetch_limit <= args.max_results:
        raise ValueError("--fetch-limit must be between 1 and --max-results")
    payload = load_hotlist(args.hotlist)
    topics = select_topics(payload, per_platform=args.per_platform)
    result = await run_enrichment(
        topics,
        max_results=args.max_results,
        fetch_limit=args.fetch_limit,
    )
    rendered = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered + "\n", encoding="utf-8")
    else:
        print(rendered)
    return 0


def main() -> int:
    return asyncio.run(_async_main())


if __name__ == "__main__":
    raise SystemExit(main())
