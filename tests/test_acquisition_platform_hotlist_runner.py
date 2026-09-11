from __future__ import annotations

import httpx
import pytest

from benchmarks.acquisition.run_platform_hotlist_baseline import run_benchmark
from packages.acquisition.spike import DiscoveryLane, DiscoveryMission


def _mission() -> DiscoveryMission:
    return DiscoveryMission(
        mission_id="momentum-test",
        version="1",
        lane=DiscoveryLane.MOMENTUM,
        mission_type="ATTENTION_SURGE",
        objective="test",
        query_seeds=["test"],
        required_source_roles=["TREND_SIGNAL", "DISCOVERY_SIGNAL"],
        max_results=2,
    )


@pytest.mark.asyncio
async def test_platform_hotlist_runner_emits_provider_and_role_assessment() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        platform_id = request.url.params.get("id")
        return httpx.Response(
            200,
            json={
                "status": "success",
                "id": platform_id,
                "items": [
                    {
                        "id": f"{platform_id}-1",
                        "title": f"{platform_id} topic",
                        "url": f"https://example.com/{platform_id}/1",
                    }
                ],
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        artifact = await run_benchmark(
            [_mission()],
            client=client,
            platform_ids=["weibo", "douyin"],
            api_base="https://example.test/api/s",
        )

    assert artifact["run_kind"] == "platform-hotlist-live-baseline"
    assert artifact["platform_count"] == 2
    assert len(artifact["runs"]) == 2
    assert all(run["status"] == "success" for run in artifact["runs"])
    assert all(item["required_roles_satisfied"] is True for item in artifact["assessments"])
    assert artifact["semantics"]["hotlist_rank"].startswith("one observed platform hot-list")
