"""Run live no-key Acquisition baselines and emit an auditable benchmark artifact."""

from __future__ import annotations

import argparse
import asyncio
import json
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

import httpx

from benchmarks.acquisition.run_keyed_search_fetch import DEFAULT_MANIFEST, load_missions
from packages.acquisition.providers import HackerNewsProvider, RssFeedProvider
from packages.acquisition.spike import (
    DiscoveryMission,
    ProviderRunRecord,
    assess_run_against_mission,
)


def _parse_feed_spec(value: str) -> tuple[str, str]:
    if "=" in value:
        provider_id, url = value.split("=", 1)
        provider_id = provider_id.strip()
        url = url.strip()
    else:
        url = value.strip()
        host = urlparse(url).netloc.replace(":", "_") or "feed"
        provider_id = f"rss-{host}"
    if not provider_id or not url.startswith(("http://", "https://")):
        raise argparse.ArgumentTypeError("RSS feed must be URL or provider_id=https://feed")
    return provider_id, url


def _select_missions(
    missions: list[DiscoveryMission],
    mission_ids: list[str] | None,
    *,
    max_results: int,
) -> list[DiscoveryMission]:
    if mission_ids:
        selected = set(mission_ids)
        missions = [mission for mission in missions if mission.mission_id in selected]
        missing = selected - {mission.mission_id for mission in missions}
        if missing:
            raise ValueError(f"unknown mission ids: {', '.join(sorted(missing))}")
    return [
        mission.model_copy(update={"max_results": min(mission.max_results, max_results)})
        for mission in missions
    ]


async def run_benchmark(
    missions: list[DiscoveryMission],
    *,
    client: httpx.AsyncClient,
    rss_feeds: list[tuple[str, str]],
    hn_lists: list[str],
) -> dict[str, object]:
    runs: list[ProviderRunRecord] = []
    descriptors: dict[str, object] = {}

    for provider_id, feed_url in rss_feeds:
        provider = RssFeedProvider(client, feed_url=feed_url, provider_id=provider_id)
        descriptors[provider.descriptor.provider_id] = provider.descriptor.model_dump(mode="json")
        for mission in missions:
            runs.append(await provider.run(mission))

    for list_kind in hn_lists:
        provider = HackerNewsProvider(client, list_kind=list_kind)
        descriptors[provider.descriptor.provider_id] = provider.descriptor.model_dump(mode="json")
        for mission in missions:
            runs.append(await provider.run(mission))

    mission_by_key = {(mission.mission_id, mission.version): mission for mission in missions}
    assessments = [
        assess_run_against_mission(
            mission_by_key[(run.mission_id, run.mission_version)],
            run,
        )
        for run in runs
    ]

    return {
        "schema_version": "1",
        "run_kind": "no-key-live-baseline",
        "generated_at": datetime.now(UTC).isoformat(),
        "mission_count": len(missions),
        "providers": descriptors,
        "runs": [run.model_dump(mode="json") for run in runs],
        "assessments": [assessment.model_dump(mode="json") for assessment in assessments],
        "semantics": {
            "provider_success": "transport/provider success only; not editorial acceptance",
            "required_roles_satisfied": (
                "observed candidate source roles cover the mission contract; not factual confirmation"
            ),
            "hn_rank": "snapshot rank only; never interpreted as attention velocity",
        },
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--mission", action="append", dest="mission_ids")
    parser.add_argument(
        "--rss-feed",
        action="append",
        type=_parse_feed_spec,
        default=[],
        help="Repeatable URL or provider_id=https://feed specification.",
    )
    parser.add_argument(
        "--hn-list",
        action="append",
        choices=("topstories", "newstories", "beststories"),
        dest="hn_lists",
        help="Repeat to compare multiple HN ranked snapshots; defaults to topstories.",
    )
    parser.add_argument("--max-results", type=int, default=10)
    parser.add_argument("--output", type=Path)
    return parser.parse_args()


async def _async_main() -> int:
    args = _parse_args()
    if args.max_results < 1 or args.max_results > 100:
        raise ValueError("--max-results must be between 1 and 100")
    missions = _select_missions(
        load_missions(args.manifest),
        args.mission_ids,
        max_results=args.max_results,
    )
    hn_lists = args.hn_lists or ["topstories"]
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        result = await run_benchmark(
            missions,
            client=client,
            rss_feeds=args.rss_feed,
            hn_lists=hn_lists,
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
