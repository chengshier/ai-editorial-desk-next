"""Run a no-key Chinese platform hot-list baseline through NewsNow."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from datetime import UTC, datetime
from pathlib import Path

import httpx

from benchmarks.acquisition.run_keyed_search_fetch import DEFAULT_MANIFEST, load_missions
from packages.acquisition.providers import NewsNowHotlistProvider
from packages.acquisition.spike import (
    DiscoveryLane,
    DiscoveryMission,
    ProviderRunRecord,
    assess_run_against_mission,
)

DEFAULT_PLATFORMS = ("weibo", "douyin", "zhihu", "bilibili-hot-search")
DEFAULT_API_BASE = "http://127.0.0.1:4444/api/s"


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
    else:
        missions = [mission for mission in missions if mission.lane == DiscoveryLane.MOMENTUM]
    return [
        mission.model_copy(update={"max_results": min(mission.max_results, max_results)})
        for mission in missions
    ]


async def run_benchmark(
    missions: list[DiscoveryMission],
    *,
    client: httpx.AsyncClient,
    platform_ids: list[str],
    api_base: str,
) -> dict[str, object]:
    runs: list[ProviderRunRecord] = []
    descriptors: dict[str, object] = {}

    for platform_id in platform_ids:
        provider = NewsNowHotlistProvider(client, platform_id=platform_id, api_base=api_base)
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
        "run_kind": "platform-hotlist-live-baseline",
        "generated_at": datetime.now(UTC).isoformat(),
        "mission_count": len(missions),
        "platform_count": len(platform_ids),
        "platforms": platform_ids,
        "providers": descriptors,
        "runs": [run.model_dump(mode="json") for run in runs],
        "assessments": [assessment.model_dump(mode="json") for assessment in assessments],
        "semantics": {
            "hotlist_rank": (
                "one observed platform hot-list snapshot; valid TREND_SIGNAL/DISCOVERY_SIGNAL, "
                "not longitudinal velocity"
            ),
            "provider_success": "transport/provider success only; not editorial acceptance",
            "required_roles_satisfied": (
                "source-role coverage only; hot-list output is never promoted to Evidence"
            ),
            "evidence": "all candidates remain discovery/trend signals until Research confirms them",
            "newsnow_instance": (
                "the default endpoint is a local/self-hosted NewsNow instance; public demo instances "
                "must be selected explicitly and are not production dependencies"
            ),
        },
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--mission", action="append", dest="mission_ids")
    parser.add_argument(
        "--platform",
        action="append",
        dest="platform_ids",
        help="Repeatable NewsNow source id; defaults to weibo/douyin/zhihu/bilibili-hot-search.",
    )
    parser.add_argument(
        "--api-base",
        default=os.getenv("NEWSNOW_API_BASE", DEFAULT_API_BASE),
        help=(
            "NewsNow /api/s endpoint. Defaults to local http://127.0.0.1:4444/api/s; "
            "NEWSNOW_API_BASE or --api-base may point to another controlled deployment."
        ),
    )
    parser.add_argument("--max-results", type=int, default=10)
    parser.add_argument("--output", type=Path)
    return parser.parse_args()


async def _async_main() -> int:
    args = _parse_args()
    if args.max_results < 1 or args.max_results > 100:
        raise ValueError("--max-results must be between 1 and 100")
    platform_ids = args.platform_ids or list(DEFAULT_PLATFORMS)
    missions = _select_missions(
        load_missions(args.manifest),
        args.mission_ids,
        max_results=args.max_results,
    )
    if not missions:
        raise ValueError("no missions selected for platform hot-list baseline")

    async with httpx.AsyncClient(timeout=45.0, follow_redirects=True) as client:
        result = await run_benchmark(
            missions,
            client=client,
            platform_ids=platform_ids,
            api_base=args.api_base,
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
