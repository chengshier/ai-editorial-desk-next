"""Run the Phase 0.5-B key-gated Search/Fetch benchmark without persisting secrets."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path

import httpx

from packages.acquisition.providers import (
    ExaSearchProvider,
    FirecrawlFetchProvider,
    TavilySearchFetchProvider,
)
from packages.acquisition.spike import DiscoveryMission, ProviderRunStatus

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = ROOT / "benchmarks" / "acquisition" / "mission_templates.v1.json"


def load_missions(path: Path) -> list[DiscoveryMission]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    raw_missions = payload.get("missions") if isinstance(payload, dict) else None
    if not isinstance(raw_missions, list):
        raise TypeError("mission manifest must contain a missions array")
    return [DiscoveryMission.model_validate(item) for item in raw_missions]


async def run_benchmark(
    missions: list[DiscoveryMission],
    *,
    fetch_limit: int,
) -> dict[str, object]:
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        exa = ExaSearchProvider(client, api_key=os.getenv("EXA_API_KEY"))
        firecrawl = FirecrawlFetchProvider(client, api_key=os.getenv("FIRECRAWL_API_KEY"))
        tavily = TavilySearchFetchProvider(client, api_key=os.getenv("TAVILY_API_KEY"))

        exa_runs = []
        fetch_probes = []
        tavily_runs = []
        for mission in missions:
            exa_run = await exa.run(mission)
            exa_runs.append(exa_run)
            if exa_run.status in {ProviderRunStatus.SUCCESS, ProviderRunStatus.PARTIAL}:
                urls = [candidate.url for candidate in exa_run.candidates[:fetch_limit]]
                if urls:
                    fetch_probes.append(await firecrawl.fetch(urls))
            tavily_runs.append(await tavily.run(mission))

    return {
        "schema_version": "1",
        "mission_count": len(missions),
        "providers": {
            "semantic_search": exa.descriptor.model_dump(mode="json"),
            "independent_fetch": firecrawl.descriptor.model_dump(mode="json"),
            "integrated_search_fetch": tavily.descriptor.model_dump(mode="json"),
        },
        "runs": {
            "exa_search": [run.model_dump(mode="json") for run in exa_runs],
            "firecrawl_fetch": [probe.model_dump(mode="json") for probe in fetch_probes],
            "tavily_search_fetch": [run.model_dump(mode="json") for run in tavily_runs],
        },
        "secret_policy": "provider keys are read from server-side environment only and are never serialized",
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--mission", action="append", dest="mission_ids")
    parser.add_argument("--fetch-limit", type=int, default=5)
    parser.add_argument("--output", type=Path)
    return parser.parse_args()


async def _async_main() -> int:
    args = _parse_args()
    if args.fetch_limit < 1:
        raise ValueError("--fetch-limit must be >= 1")
    missions = load_missions(args.manifest)
    if args.mission_ids:
        selected = set(args.mission_ids)
        missions = [mission for mission in missions if mission.mission_id in selected]
        missing = selected - {mission.mission_id for mission in missions}
        if missing:
            raise ValueError(f"unknown mission ids: {', '.join(sorted(missing))}")
    result = await run_benchmark(missions, fetch_limit=args.fetch_limit)
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
