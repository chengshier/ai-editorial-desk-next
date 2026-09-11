"""Exa Search adapter for the Phase 0.5-B semantic-search candidate."""

from __future__ import annotations

import time
from datetime import UTC, datetime, timedelta
from urllib.parse import urlparse
from uuid import uuid4

import httpx

from packages.acquisition.providers.base import allocate_query_budgets
from packages.acquisition.spike import (
    AcquisitionCandidate,
    DiscoveryMission,
    ProviderCapability,
    ProviderDescriptor,
    ProviderRunRecord,
    ProviderRunStatus,
    SourceRole,
)


def _parse_iso_datetime(value: object) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


class ExaSearchProvider:
    """Semantic Search candidate using the public Exa Search API contract."""

    def __init__(
        self,
        client: httpx.AsyncClient,
        *,
        api_key: str | None,
        api_url: str = "https://api.exa.ai/search",
    ) -> None:
        self._client = client
        self._api_key = api_key
        self._api_url = api_url

    @property
    def descriptor(self) -> ProviderDescriptor:
        return ProviderDescriptor(
            provider_id="exa-search",
            implementation_version="v1",
            capabilities={ProviderCapability.SEARCH},
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
                failure_reason="EXA_API_KEY is not configured",
            )

        candidates: list[AcquisitionCandidate] = []
        seen_urls: set[str] = set()
        request_ids: list[str] = []
        resolved_search_types: list[str] = []
        total_cost = 0.0
        cost_observed = False
        query_failures = 0
        allocations = allocate_query_budgets(mission)

        for query, result_budget in allocations:
            payload: dict[str, object] = {
                "query": query,
                "numResults": result_budget,
                "type": "auto",
                "contents": {"text": False, "highlights": False},
            }
            if mission.recency_days is not None:
                start = datetime.now(UTC) - timedelta(days=mission.recency_days)
                payload["startPublishedDate"] = start.isoformat()

            try:
                response = await self._client.post(
                    self._api_url,
                    headers={"x-api-key": self._api_key, "Content-Type": "application/json"},
                    json=payload,
                )
                response.raise_for_status()
                body = response.json()
                if not isinstance(body, dict):
                    raise TypeError("Exa response must be an object")
                raw_results = body.get("results", [])
                if not isinstance(raw_results, list):
                    raise TypeError("Exa results must be an array")

                request_id = body.get("requestId")
                if isinstance(request_id, str):
                    request_ids.append(request_id)
                resolved_type = body.get("resolvedSearchType")
                if isinstance(resolved_type, str):
                    resolved_search_types.append(resolved_type)
                cost = body.get("costDollars")
                if isinstance(cost, dict) and isinstance(cost.get("total"), int | float):
                    total_cost += float(cost["total"])
                    cost_observed = True

                for raw in raw_results[:result_budget]:
                    if not isinstance(raw, dict):
                        continue
                    url = raw.get("url")
                    title = raw.get("title")
                    if not isinstance(url, str) or not url or not isinstance(title, str) or not title:
                        continue
                    if url in seen_urls:
                        continue
                    seen_urls.add(url)
                    result_id = raw.get("id")
                    candidates.append(
                        AcquisitionCandidate(
                            provider_result_id=(result_id if isinstance(result_id, str) else url),
                            url=url,
                            canonical_url=url,
                            title=title.strip(),
                            published_at=_parse_iso_datetime(raw.get("publishedDate")),
                            source=urlparse(url).netloc or None,
                            source_roles=[SourceRole.DISCOVERY_SIGNAL],
                            query_variant=query,
                            rank=len(candidates) + 1,
                            provider_metadata={
                                "author": raw.get("author"),
                                "resolved_search_type": resolved_type,
                            },
                        )
                    )
            except (httpx.HTTPError, TypeError, ValueError):
                query_failures += 1

        status = ProviderRunStatus.SUCCESS
        failure_reason = None
        if not candidates:
            status = ProviderRunStatus.UNAVAILABLE
            failure_reason = "all Exa Search query variants failed or returned no normalized results"
        elif query_failures:
            status = ProviderRunStatus.PARTIAL
            failure_reason = f"{query_failures} Exa query variant(s) failed"

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
            duplicate_count=sum(budget for _, budget in allocations) - len(candidates),
            latency_ms=int((time.perf_counter() - tick) * 1000),
            cost_usd=total_cost if cost_observed else None,
            failure_reason=failure_reason,
            provider_metadata={
                "request_ids": request_ids,
                "query_count": len(allocations),
                "query_failures": query_failures,
                "search_only": True,
                "resolved_search_types": resolved_search_types,
            },
            candidates=candidates,
        )
