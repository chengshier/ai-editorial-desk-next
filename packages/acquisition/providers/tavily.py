"""Tavily Search adapter used as the integrated Search+Fetch Spike candidate."""

from __future__ import annotations

import time
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
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


def _parse_datetime(value: object) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = parsedate_to_datetime(value)
        return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)
    except (TypeError, ValueError):
        pass
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _time_range(recency_days: int | None) -> str | None:
    if recency_days is None:
        return None
    if recency_days <= 1:
        return "day"
    if recency_days <= 7:
        return "week"
    if recency_days <= 31:
        return "month"
    if recency_days <= 366:
        return "year"
    return None


class TavilySearchFetchProvider:
    """Integrated Search+Fetch candidate using Tavily Search raw-content mode."""

    def __init__(
        self,
        client: httpx.AsyncClient,
        *,
        api_key: str | None,
        api_url: str = "https://api.tavily.com/search",
    ) -> None:
        self._client = client
        self._api_key = api_key
        self._api_url = api_url

    @property
    def descriptor(self) -> ProviderDescriptor:
        return ProviderDescriptor(
            provider_id="tavily-search-fetch",
            implementation_version="v1",
            capabilities={ProviderCapability.SEARCH, ProviderCapability.FETCH},
        )

    async def run(self, mission: DiscoveryMission) -> ProviderRunRecord:
        started = datetime.now(UTC)
        tick = time.perf_counter()
        run_id = f"acq_{uuid4().hex}"
        if not self._api_key:
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
                failure_reason="TAVILY_API_KEY is not configured",
            )

        query = mission.query_seeds[0]
        payload: dict[str, object] = {
            "query": query,
            "search_depth": "advanced",
            "max_results": mission.max_results,
            "topic": "news" if mission.lane == DiscoveryLane.MOMENTUM else "general",
            "include_answer": False,
            "include_raw_content": "markdown",
            "include_published_date": True,
            "include_usage": True,
            "safe_search": True,
        }
        requested_time_range = _time_range(mission.recency_days)
        if requested_time_range is not None:
            payload["time_range"] = requested_time_range

        try:
            response = await self._client.post(
                self._api_url,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            body = response.json()
            if not isinstance(body, dict):
                raise TypeError("Tavily response must be an object")
            raw_results = body.get("results", [])
            if not isinstance(raw_results, list):
                raise TypeError("Tavily results must be an array")

            candidates: list[AcquisitionCandidate] = []
            fetched_count = 0
            for rank, raw in enumerate(raw_results[: mission.max_results], start=1):
                if not isinstance(raw, dict):
                    continue
                url = raw.get("url")
                title = raw.get("title")
                if not isinstance(url, str) or not url or not isinstance(title, str) or not title:
                    continue
                raw_content = raw.get("raw_content")
                content = raw_content if isinstance(raw_content, str) and raw_content.strip() else None
                if content is not None:
                    fetched_count += 1
                score = raw.get("score")
                candidate_score = float(score) if isinstance(score, int | float) else None
                result_id = raw.get("id")
                candidates.append(
                    AcquisitionCandidate(
                        provider_result_id=(result_id if isinstance(result_id, str) else url),
                        url=url,
                        canonical_url=url,
                        title=title.strip(),
                        snippet=(raw.get("content") if isinstance(raw.get("content"), str) else None),
                        content=content,
                        published_at=_parse_datetime(raw.get("published_date")),
                        source=urlparse(url).netloc or None,
                        source_roles=[SourceRole.DISCOVERY_SIGNAL],
                        query_variant=query,
                        rank=rank,
                        provider_score=candidate_score,
                        provider_metadata={
                            "raw_content_available": content is not None,
                            "provider_score_semantics": "relevance_only_not_editorial_value",
                        },
                    )
                )

            usage = body.get("usage") if isinstance(body.get("usage"), dict) else {}
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
                fetched_count=fetched_count,
                latency_ms=int((time.perf_counter() - tick) * 1000),
                provider_metadata={
                    "request_id": body.get("request_id"),
                    "credits_used": usage.get("credits"),
                    "query_count": 1,
                    "search_depth": "advanced",
                    "requested_time_range": requested_time_range,
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
                failure_reason=f"Tavily Search unavailable: {type(exc).__name__}",
            )
