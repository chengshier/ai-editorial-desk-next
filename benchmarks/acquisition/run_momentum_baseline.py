"""Run the Phase 0.5-B no-key Momentum baseline against Google Trends RSS."""

from __future__ import annotations

import argparse
import asyncio
import json
from datetime import UTC, datetime
from pathlib import Path

import httpx

from benchmarks.acquisition.run_keyed_search_fetch import DEFAULT_MANIFEST, load_missions
from packages.acquisition.providers import GoogleTrendsRssProvider
from packages.acquisition.spike import DiscoveryLane, DiscoveryMission, assess_run_against_mission


def _select_missions(
    missions: list[DiscoveryMission],
    mission_ids: list[str] | None,
    *,
    max_results: int,
) -> list[DiscoveryMission]:
    missions = [mission for mission in missions if mission.lane == DiscoveryLane.MOMENTUM]
    if mission_ids:
        selected = set(mission_ids)
        missions = [mission for mission in missions if mission.mission_id in selected]
        missing = selected - {mission.mission_id for mission in missions}
        if missing:
            raise ValueError(f"unknown momentum mission ids: {', '.join(sorted(missing))}")
    return [
        mission.model_copy(update={"max_results": min(mission.max_results, max_results)})
        for mission in missions
    ]


async def run_benchmark(
    missions: list[DiscoveryMission],
    *,
    client: httpx.AsyncClient,
    geo: str,
) -> dict[str, object]:
    provider = GoogleTrendsRssProvider(client, geo=geo)
    runs = [await provider.run(mission) for mission in missions]
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
        "run_kind": "momentum-no-key-live-baseline",
        "generated_at": datetime.now(UTC).isoformat(),
        "geo": geo.upper(),
        "mission_count": len(missions),
        "provider": provider.descriptor.model_dump(mode="json"),
        "runs": [run.model_dump(mode="json") for run in runs],
        "assessments": [assessment.model_dump(mode="json") for assessment in assessments],
        "semantics": {
            "trend_signal": (
                "Google Trending Now/RSS inclusion is a provider-reported recent search-interest surge; "
                "it is not editorial value and does not prove cross-platform/community acceleration"
            ),
            "approx_traffic": "rounded provider traffic signal; not sales, demand, or opportunity score",
            "related_news": "supporting discovery refs only; not automatically confirmed evidence",
        },
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--mission", action="append", dest="mission_ids")
    parser.add_argument("--geo", default="US")
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
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        result = await run_benchmark(missions, client=client, geo=args.geo)
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
