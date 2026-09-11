"""Hacker News official API adapter for a no-key community baseline."""

from __future__ import annotations

import time
from datetime import UTC, datetime
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


class HackerNewsProvider:
    """Read ranked public HN story snapshots without pretending they are velocity data."""

    def __init__(
        self,
        client: httpx.AsyncClient,
        *,
        list_kind: str = "topstories",
        api_base: str = "https://hacker-news.firebaseio.com/v0",
    ) -> None:
        if list_kind not in {"topstories", "newstories", "beststories"}:
            raise ValueError(f"unsupported Hacker News list_kind: {list_kind}")
        self._client = client
        self._list_kind = list_kind
        self._api_base = api_base.rstrip("/")

    @property
    def descriptor(self) -> ProviderDescriptor:
        return ProviderDescriptor(
            provider_id=f"hackernews-official-{self._list_kind}",
            implementation_version="v1",
            capabilities={ProviderCapability.PLATFORM},
        )

    async def run(self, mission: DiscoveryMission) -> ProviderRunRecord:
        started = datetime.now(UTC)
        tick = time.perf_counter()
        run_id = f"acq_{uuid4().hex}"

        # The official HN list endpoints expose ranked community snapshots, not
        # semantic query search or longitudinal trend velocity. Keep potential
        # and research missions explicitly unsupported instead of manufacturing
        # a query match or a fake Trend signal.
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
                    "HN ranked-list baseline supports ambient/momentum snapshots only; "
                    "it does not provide mission-scoped semantic search."
                ),
            )

        try:
            response = await self._client.get(f"{self._api_base}/{self._list_kind}.json")
            response.raise_for_status()
            raw_ids = response.json()
            if not isinstance(raw_ids, list):
                raise ValueError("Hacker News list response must be an array")

            candidates: list[AcquisitionCandidate] = []
            fetch_failures = 0
            for rank, story_id in enumerate(raw_ids[: mission.max_results], start=1):
                try:
                    item_response = await self._client.get(
                        f"{self._api_base}/item/{int(story_id)}.json"
                    )
                    item_response.raise_for_status()
                    item = item_response.json()
                    if not isinstance(item, dict) or item.get("type") != "story":
                        continue
                    title = item.get("title")
                    if not isinstance(title, str) or not title.strip():
                        continue
                    external_url = item.get("url")
                    url = (
                        external_url
                        if isinstance(external_url, str) and external_url
                        else f"https://news.ycombinator.com/item?id={int(story_id)}"
                    )
                    published_at = None
                    timestamp = item.get("time")
                    if isinstance(timestamp, int | float):
                        published_at = datetime.fromtimestamp(timestamp, tz=UTC)
                    candidates.append(
                        AcquisitionCandidate(
                            provider_result_id=str(story_id),
                            url=url,
                            canonical_url=url,
                            title=title.strip(),
                            published_at=published_at,
                            source="news.ycombinator.com",
                            source_roles=[
                                SourceRole.DISCOVERY_SIGNAL,
                                SourceRole.AUDIENCE_SIGNAL,
                            ],
                            rank=rank,
                            provider_metadata={
                                "hn_list": self._list_kind,
                                "hn_item_id": int(story_id),
                                "by": item.get("by"),
                                "score": item.get("score"),
                                "descendants": item.get("descendants"),
                                "snapshot_semantics": "rank_only_not_velocity",
                            },
                        )
                    )
                except (httpx.HTTPError, TypeError, ValueError):
                    fetch_failures += 1

            return ProviderRunRecord(
                run_id=run_id,
                mission_id=mission.mission_id,
                mission_version=mission.version,
                lane=mission.lane,
                provider_id=self.descriptor.provider_id,
                provider_version=self.descriptor.implementation_version,
                status=(
                    ProviderRunStatus.PARTIAL
                    if fetch_failures > 0
                    else ProviderRunStatus.SUCCESS
                ),
                started_at=started,
                finished_at=datetime.now(UTC),
                retrieved_count=len(candidates),
                fetched_count=len(candidates),
                fetch_failures=fetch_failures,
                latency_ms=int((time.perf_counter() - tick) * 1000),
                candidates=candidates,
            )
        except httpx.HTTPError as exc:
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
                failure_reason=f"Hacker News API unavailable: {exc}",
            )
