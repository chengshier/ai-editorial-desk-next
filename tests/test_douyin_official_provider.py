from __future__ import annotations

import httpx
import pytest

from packages.acquisition.providers import DouyinVideoSearchProvider
from packages.acquisition.spike import (
    DiscoveryLane,
    DiscoveryMission,
    ProviderCapability,
    ProviderRunStatus,
    SourceRole,
)


def _mission(*, lane: DiscoveryLane = DiscoveryLane.POTENTIAL) -> DiscoveryMission:
    return DiscoveryMission(
        mission_id="douyin-platform-probe",
        version="1",
        lane=lane,
        mission_type="PLATFORM_PROBE",
        objective="find platform-native material",
        query_seeds=["家长群 诈骗", "普通人 暖心"],
        recency_days=7,
        max_results=3,
        required_source_roles=[SourceRole.DISCOVERY_SIGNAL],
    )


@pytest.mark.asyncio
async def test_douyin_official_search_normalizes_platform_item_and_metric_snapshot() -> None:
    calls: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        assert request.headers["access-token"] == "clt.test-token"
        assert request.url.params["device_id"] == "123456"
        assert request.url.params["publish_time"] == "7"
        query = request.url.params["keyword"]
        item_id = "1001" if query == "家长群 诈骗" else "1002"
        return httpx.Response(
            200,
            json={
                "err_no": 0,
                "err_msg": "success",
                "log_id": f"log-{item_id}",
                "data": {
                    "data": {
                        "cursor": 0,
                        "has_more": False,
                        "video_list": [
                            {
                                "item_id": item_id,
                                "title": f"video {query}",
                                "cover": f"https://example.com/{item_id}.jpg",
                                "create_time": 1_788_940_800,
                                "avatar": "https://example.com/avatar.jpg",
                                "nickname": "creator",
                                "statistics": {"digg_count": 321},
                                "link": f"https://www.douyin.com/video/{item_id}",
                                "high_quality_text": f"platform text for {query}",
                            }
                        ],
                    }
                },
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = DouyinVideoSearchProvider(
            client,
            access_token="clt.test-token",
            device_id="123456",
        )
        run = await provider.run(_mission())

    assert provider.descriptor.capabilities == {
        ProviderCapability.SEARCH,
        ProviderCapability.PLATFORM,
    }
    assert run.status == ProviderRunStatus.SUCCESS
    assert run.retrieved_count == 2
    assert len(calls) == 2
    first = run.candidates[0]
    assert first.source == "www.douyin.com"
    assert first.published_at is not None
    assert first.snippet == "platform text for 家长群 诈骗"
    assert first.query_variant == "家长群 诈骗"
    assert first.source_roles == [
        SourceRole.DISCOVERY_SIGNAL,
        SourceRole.AUDIENCE_SIGNAL,
        SourceRole.MATERIAL_SOURCE,
    ]
    assert first.provider_metadata["nickname"] == "creator"
    assert first.provider_metadata["digg_count"] == 321
    assert first.provider_metadata["metric_semantics"] == "point_in_time_snapshot_not_velocity"
    assert first.provider_score is None
    assert "clt.test-token" not in run.model_dump_json()
    assert "123456" not in run.model_dump_json()


@pytest.mark.asyncio
async def test_douyin_missing_credentials_are_explicitly_unavailable_without_network() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        raise AssertionError("network must not be called without credentials")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        missing_token = await DouyinVideoSearchProvider(
            client,
            access_token=None,
            device_id="123456",
        ).run(_mission())
        missing_device = await DouyinVideoSearchProvider(
            client,
            access_token="clt.test-token",
            device_id=None,
        ).run(_mission())

    assert missing_token.status == ProviderRunStatus.UNAVAILABLE
    assert missing_token.failure_reason == "DOUYIN_CLIENT_TOKEN is not configured"
    assert missing_device.status == ProviderRunStatus.UNAVAILABLE
    assert missing_device.failure_reason == "DOUYIN_DEVICE_ID is not configured"


@pytest.mark.asyncio
async def test_douyin_api_error_stays_unavailable_and_does_not_become_evidence() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "err_no": 28001018,
                "err_msg": "应用未获得该能力",
                "log_id": "log-denied",
                "data": {},
            },
        )

    mission = _mission().model_copy(update={"query_seeds": ["test"], "max_results": 1})
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        run = await DouyinVideoSearchProvider(
            client,
            access_token="clt.test-token",
            device_id="123456",
        ).run(mission)

    assert run.status == ProviderRunStatus.UNAVAILABLE
    assert run.retrieved_count == 0
    assert run.provider_metadata["error_codes"] == [28001018]


@pytest.mark.asyncio
async def test_douyin_ambient_lane_is_explicitly_unsupported() -> None:
    async with httpx.AsyncClient() as client:
        run = await DouyinVideoSearchProvider(
            client,
            access_token="clt.test-token",
            device_id="123456",
        ).run(_mission(lane=DiscoveryLane.AMBIENT))

    assert run.status == ProviderRunStatus.UNSUPPORTED
    assert "ambient feed" in (run.failure_reason or "")
