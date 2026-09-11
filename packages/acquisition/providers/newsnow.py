"""NewsNow hot-list adapter for a no-key Chinese platform trend baseline."""

from __future__ import annotations

import time
from datetime import UTC, datetime
from urllib.parse import urlparse
from uuid import uuid4

import httpx

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


class NewsNowHotlistProvider:
    """Read one public platform hot-list snapshot without claiming velocity or evidence."""

    def __init__(
        self,
        client: httpx.AsyncClient,
        *,
        platform_id: str,
        api_base: str = "http://127.0.0.1:4444/api/s",
    ) -> None:
        platform_id = platform_id.strip()
        if not platform_id:
            raise ValueError("platform_id must not be empty")
        self._client = client
        self._platform_id = platform_id
        self._api_base = api_base.rstrip("?")

    @property
    def descriptor(self) -> ProviderDescriptor:
        return ProviderDescriptor(
            provider_id=f"newsnow-{self._platform_id}",
            implementation_version="v1",
            capabilities={ProviderCapability.PLATFORM, ProviderCapability.TREND},
        )

    async def run(self, mission: DiscoveryMission) -> ProviderRunRecord:
        started = datetime.now(UTC)
        tick = time.perf_counter()
        run_id = f"acq_{uuid4().hex}"

        if mission.lane not in {DiscoveryLane.AMBIENT, DiscoveryLane.MOMENTUM}:
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
                    "NewsNow hot-list baseline supports ambient/momentum snapshots only; "
                    "it is not mission-scoped semantic search."
                ),
            )

        try:
            response = await self._client.get(
                f"{self._api_base}?id={self._platform_id}&latest"
            )
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, dict):
                raise TypeError("NewsNow response must be an object")
            raw_items = payload.get("items")
            if not isinstance(raw_items, list):
                raise TypeError("NewsNow response must contain an items array")

            observed_at = datetime.now(UTC)
            updated_time = payload.get("updatedTime", payload.get("updated_time"))
            if isinstance(updated_time, int | float):
                # NewsNow deployments may expose milliseconds or seconds.
                seconds = updated_time / 1000 if updated_time > 10_000_000_000 else updated_time
                try:
                    observed_at = datetime.fromtimestamp(seconds, tz=UTC)
                except (OverflowError, OSError, ValueError):
                    pass

            candidates: list[AcquisitionCandidate] = []
            for rank, item in enumerate(raw_items[: mission.max_results], start=1):
                if not isinstance(item, dict):
                    continue
                title = item.get("title")
                if not isinstance(title, str) or not title.strip():
                    continue
                url = item.get("url") or item.get("mobileUrl") or item.get("mobile_url")
                if not isinstance(url, str) or not url.strip():
                    continue
                url = url.strip()
                item_id = item.get("id")
                provider_result_id = (
                    str(item_id) if item_id not in {None, ""} else f"{self._platform_id}:{rank}:{url}"
                )
                metadata: dict[str, object] = {
                    "platform_id": self._platform_id,
                    "observed_at": observed_at.isoformat(),
                    "snapshot_semantics": "hotlist_rank_snapshot_not_velocity",
                }
                for key in ("hot", "extra", "desc", "author", "comment_count", "play_count"):
                    if key in item and item[key] is not None:
                        metadata[key] = item[key]

                candidates.append(
                    AcquisitionCandidate(
                        provider_result_id=provider_result_id,
                        url=url,
                        canonical_url=url,
                        title=title.strip(),
                        source=urlparse(url).netloc or self._platform_id,
                        source_roles=[
                            SourceRole.DISCOVERY_SIGNAL,
                            SourceRole.TREND_SIGNAL,
                        ],
                        rank=rank,
                        provider_metadata=metadata,
                    )
                )

            return ProviderRunRecord(
                run_id=run_id,
                mission_id=mission.mission_id,
                mission_version=mission.version,
                lane=mission.lane,
                provider_id=self.descriptor.provider_id,
                provider_version=self.descriptor.implementation_version,
                status=ProviderRunStatus.SUCCESS,
                started_at=started,
                finished_at=datetime.now(UTC),
                retrieved_count=len(candidates),
                fetched_count=len(candidates),
                latency_ms=int((time.perf_counter() - tick) * 1000),
                provider_metadata={
                    "platform_id": self._platform_id,
                    "observed_at": observed_at.isoformat(),
                    "snapshot_semantics": "hotlist_rank_snapshot_not_velocity",
                },
                candidates=candidates,
            )
        except (httpx.HTTPError, TypeError, ValueError) as exc:
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
                latency_ms=int((time.perf_counter() - tick) * 1000),
                failure_reason=f"NewsNow {self._platform_id} unavailable: {exc}",
            )
