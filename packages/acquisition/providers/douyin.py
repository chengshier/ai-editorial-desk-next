"""Official Douyin video-search adapter for Phase 0.5-B E5-B platform-item probing."""

from __future__ import annotations

import time
from datetime import UTC, datetime
from urllib.parse import urlparse
from uuid import uuid4

import httpx

from packages.acquisition.providers.base import allocate_query_budgets
from packages.acquisition.spike import (
    AcquisitionCandidate,
    DiscoveryLane,
    DiscoveryMission,
    ProviderCapability,
    ProviderDescriptor,
    ProviderRunRecord,
    ProviderRunStatus,
    SourceRole,
)


def _publish_time_filter(recency_days: int | None) -> int:
    if recency_days is None:
        return 0
    if recency_days <= 1:
        return 1
    if recency_days <= 7:
        return 7
    if recency_days <= 180:
        return 180
    return 0


def _timestamp(value: object) -> datetime | None:
    if not isinstance(value, int | float):
        return None
    try:
        return datetime.fromtimestamp(value, tz=UTC)
    except (OverflowError, OSError, ValueError):
        return None


class DouyinVideoSearchProvider:
    """Use Douyin's official video-search API without treating search rank as trend velocity."""

    def __init__(
        self,
        client: httpx.AsyncClient,
        *,
        access_token: str | None,
        device_id: str | int | None,
        api_url: str = "https://open.douyin.com/dy_open_api/v1/search/video/",
    ) -> None:
        self._client = client
        self._access_token = access_token
        self._device_id = str(device_id).strip() if device_id is not None else ""
        self._api_url = api_url

    @property
    def descriptor(self) -> ProviderDescriptor:
        return ProviderDescriptor(
            provider_id="douyin-official-video-search",
            implementation_version="v1",
            capabilities={ProviderCapability.SEARCH, ProviderCapability.PLATFORM},
        )

    async def run(self, mission: DiscoveryMission) -> ProviderRunRecord:
        started = datetime.now(UTC)
        tick = time.perf_counter()
        run_id = f"acq_{uuid4().hex}"

        if mission.lane == DiscoveryLane.AMBIENT:
            return ProviderRunRecord(
                run_id=run_id,
                mission_id=mission.mission_id,
                mission_version=mission.version,
                lane=mission.lane,
                provider_id=self.descriptor.provider_id,
                provider_version=self.descriptor.implementation_version,
                status=ProviderRunStatus.UNSUPPORTED,
                started_at=started,
                finished_at=datetime.now(UTC),
                failure_reason=(
                    "Douyin official video search is query-driven and does not implement ambient feed sensing."
                ),
            )
        if not self._access_token:
            return ProviderRunRecord(
                run_id=run_id,
                mission_id=mission.mission_id,
                mission_version=mission.version,
                lane=mission.lane,
                provider_id=self.descriptor.provider_id,
                provider_version=self.descriptor.implementation_version,
                status=ProviderRunStatus.UNAVAILABLE,
                started_at=started,
                finished_at=datetime.now(UTC),
                failure_reason="DOUYIN_CLIENT_TOKEN is not configured",
            )
        if not self._device_id:
            return ProviderRunRecord(
                run_id=run_id,
                mission_id=mission.mission_id,
                mission_version=mission.version,
                lane=mission.lane,
                provider_id=self.descriptor.provider_id,
                provider_version=self.descriptor.implementation_version,
                status=ProviderRunStatus.UNAVAILABLE,
                started_at=started,
                finished_at=datetime.now(UTC),
                failure_reason="DOUYIN_DEVICE_ID is not configured",
            )

        observed_at = datetime.now(UTC)
        candidates: list[AcquisitionCandidate] = []
        seen_item_ids: set[str] = set()
        query_failures = 0
        duplicate_count = 0
        error_codes: list[int] = []
        log_ids: list[str] = []
        allocations = allocate_query_budgets(mission)

        for query, result_budget in allocations:
            params = {
                "count": min(result_budget, 10),
                "device_id": self._device_id,
                "keyword": query,
                "cursor": 0,
                "publish_time": _publish_time_filter(mission.recency_days),
                "sort_type": 0,
            }
            try:
                response = await self._client.get(
                    self._api_url,
                    headers={
                        "access-token": self._access_token,
                        "content-type": "application/json",
                    },
                    params=params,
                )
                response.raise_for_status()
                payload = response.json()
                if not isinstance(payload, dict):
                    raise TypeError("Douyin response must be an object")
                err_no = payload.get("err_no")
                if isinstance(err_no, int) and err_no != 0:
                    error_codes.append(err_no)
                    query_failures += 1
                    continue
                log_id = payload.get("log_id")
                if isinstance(log_id, str) and log_id:
                    log_ids.append(log_id)
                outer_data = payload.get("data")
                if not isinstance(outer_data, dict):
                    raise TypeError("Douyin response data must be an object")
                inner_data = outer_data.get("data", outer_data)
                if not isinstance(inner_data, dict):
                    raise TypeError("Douyin nested data must be an object")
                raw_videos = inner_data.get("video_list", [])
                if not isinstance(raw_videos, list):
                    raise TypeError("Douyin video_list must be an array")

                for raw in raw_videos[:result_budget]:
                    if not isinstance(raw, dict):
                        continue
                    item_id = raw.get("item_id")
                    title = raw.get("title")
                    url = raw.get("link")
                    if not isinstance(item_id, str) or not item_id:
                        continue
                    if not isinstance(title, str) or not title.strip():
                        continue
                    if not isinstance(url, str) or not url.strip():
                        url = f"https://www.douyin.com/video/{item_id}"
                    if item_id in seen_item_ids:
                        duplicate_count += 1
                        continue
                    seen_item_ids.add(item_id)

                    statistics = raw.get("statistics")
                    digg_count = (
                        statistics.get("digg_count") if isinstance(statistics, dict) else None
                    )
                    high_quality_text = raw.get("high_quality_text")
                    snippet = (
                        high_quality_text.strip()
                        if isinstance(high_quality_text, str) and high_quality_text.strip()
                        else None
                    )
                    metadata: dict[str, object] = {
                        "platform_id": "douyin",
                        "item_id": item_id,
                        "observed_at": observed_at.isoformat(),
                        "metric_semantics": "point_in_time_snapshot_not_velocity",
                        "search_rank_semantics": "query_relevance_not_trend_rank",
                    }
                    for key in ("nickname", "avatar", "cover"):
                        value = raw.get(key)
                        if value is not None:
                            metadata[key] = value
                    if isinstance(digg_count, int | float):
                        metadata["digg_count"] = digg_count

                    candidates.append(
                        AcquisitionCandidate(
                            provider_result_id=item_id,
                            url=url.strip(),
                            canonical_url=url.strip(),
                            title=title.strip(),
                            snippet=snippet,
                            published_at=_timestamp(raw.get("create_time")),
                            source=urlparse(url).netloc or "www.douyin.com",
                            source_roles=[
                                SourceRole.DISCOVERY_SIGNAL,
                                SourceRole.AUDIENCE_SIGNAL,
                                SourceRole.MATERIAL_SOURCE,
                            ],
                            query_variant=query,
                            rank=len(candidates) + 1,
                            provider_metadata=metadata,
                        )
                    )
            except (httpx.HTTPError, TypeError, ValueError):
                query_failures += 1

        status = ProviderRunStatus.SUCCESS
        failure_reason = None
        if not candidates:
            status = ProviderRunStatus.UNAVAILABLE
            failure_reason = (
                "all Douyin official video-search query variants failed or returned no normalized results"
            )
        elif query_failures:
            status = ProviderRunStatus.PARTIAL
            failure_reason = f"{query_failures} Douyin query variant(s) failed"

        return ProviderRunRecord(
            run_id=run_id,
            mission_id=mission.mission_id,
            mission_version=mission.version,
            lane=mission.lane,
            provider_id=self.descriptor.provider_id,
            provider_version=self.descriptor.implementation_version,
            status=status,
            started_at=started,
            finished_at=datetime.now(UTC),
            retrieved_count=len(candidates),
            duplicate_count=duplicate_count,
            latency_ms=int((time.perf_counter() - tick) * 1000),
            failure_reason=failure_reason,
            provider_metadata={
                "platform_id": "douyin",
                "observed_at": observed_at.isoformat(),
                "query_count": len(allocations),
                "query_failures": query_failures,
                "error_codes": error_codes,
                "log_ids": log_ids,
                "metric_semantics": "point_in_time_snapshot_not_velocity",
                "search_rank_semantics": "query_relevance_not_trend_rank",
            },
            candidates=candidates,
        )
