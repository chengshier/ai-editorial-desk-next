"""Run the E5-B Douyin official platform-item / metrics probe without serializing secrets."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path

import httpx

from benchmarks.acquisition.run_keyed_search_fetch import load_missions, select_missions
from packages.acquisition.providers import DouyinVideoSearchProvider
from packages.acquisition.spike import assess_run_against_mission

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = ROOT / "benchmarks" / "acquisition" / "mission_templates.multichannel.zh-CN.v1.json"


async def run_benchmark(missions, *, access_token: str | None, device_id: str | None) -> dict[str, object]:
    async with httpx.AsyncClient(timeout=45.0, follow_redirects=True) as client:
        provider = DouyinVideoSearchProvider(
            client,
            access_token=access_token,
            device_id=device_id,
        )
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
        "run_kind": "douyin-official-platform-item-probe",
        "mission_count": len(missions),
        "provider": provider.descriptor.model_dump(mode="json"),
        "runs": [run.model_dump(mode="json") for run in runs],
        "assessments": [assessment.model_dump(mode="json") for assessment in assessments],
        "semantics": {
            "search_rank": "query relevance only; never interpreted as hot-list rank or trend velocity",
            "audience_metric": "observed platform metric snapshot only; not editorial value or velocity",
            "platform_item": (
                "official Douyin item metadata may be used as platform provenance/material, "
                "but claims inside a video are not automatically confirmed evidence"
            ),
            "secret_policy": (
                "DOUYIN_CLIENT_TOKEN and DOUYIN_DEVICE_ID are read from environment only "
                "and are never serialized"
            ),
        },
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--mission", action="append", dest="mission_ids")
    parser.add_argument("--max-results", type=int, default=3)
    parser.add_argument("--output", type=Path)
    return parser.parse_args()


async def _async_main() -> int:
    args = _parse_args()
    if not 1 <= args.max_results <= 10:
        raise ValueError("--max-results must be between 1 and 10 for the E5-B probe")
    missions = select_missions(
        load_missions(args.manifest),
        args.mission_ids,
        max_results=args.max_results,
    )
    result = await run_benchmark(
        missions,
        access_token=os.getenv("DOUYIN_CLIENT_TOKEN"),
        device_id=os.getenv("DOUYIN_DEVICE_ID"),
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
