"""Firecrawl Scrape adapter for the Phase 0.5-B independent Fetch candidate."""

from __future__ import annotations

import time
from datetime import UTC, datetime
from urllib.parse import urlparse
from uuid import uuid4

import httpx

from packages.acquisition.spike import (
    FetchedDocument,
    FetchProbeRecord,
    ProviderCapability,
    ProviderDescriptor,
    ProviderRunStatus,
    SourceRole,
)


class FirecrawlFetchProvider:
    """Independent Fetch candidate backed by Firecrawl v2 scrape."""

    def __init__(
        self,
        client: httpx.AsyncClient,
        *,
        api_key: str | None,
        api_url: str = "https://api.firecrawl.dev/v2/scrape",
    ) -> None:
        self._client = client
        self._api_key = api_key
        self._api_url = api_url

    @property
    def descriptor(self) -> ProviderDescriptor:
        return ProviderDescriptor(
            provider_id="firecrawl-fetch",
            implementation_version="v1",
            capabilities={ProviderCapability.FETCH},
        )

    async def fetch(self, urls: list[str]) -> FetchProbeRecord:
        if not urls:
            raise ValueError("at least one URL is required")
        started = datetime.now(UTC)
        tick = time.perf_counter()
        probe_id = f"fetch_{uuid4().hex}"
        if not self._api_key:
            return FetchProbeRecord(
                probe_id=probe_id,
                provider_id=self.descriptor.provider_id,
                provider_version=self.descriptor.implementation_version,
                status=ProviderRunStatus.UNAVAILABLE,
                started_at=started,
                finished_at=datetime.now(UTC),
                requested_count=len(urls),
                failure_count=len(urls),
                failure_reason="FIRECRAWL_API_KEY is not configured",
            )

        documents: list[FetchedDocument] = []
        failure_count = 0
        credits_used = 0
        for url in urls:
            try:
                response = await self._client.post(
                    self._api_url,
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                    },
                    json={"url": url, "formats": ["markdown"], "onlyMainContent": True},
                )
                response.raise_for_status()
                body = response.json()
                if not isinstance(body, dict) or body.get("success") is not True:
                    raise TypeError("Firecrawl response must be a successful object")
                data = body.get("data")
                if not isinstance(data, dict):
                    raise TypeError("Firecrawl data must be an object")
                markdown = data.get("markdown")
                if not isinstance(markdown, str) or not markdown.strip():
                    raise ValueError("Firecrawl returned no markdown content")
                metadata = data.get("metadata") if isinstance(data.get("metadata"), dict) else {}
                canonical_url = metadata.get("sourceURL") or metadata.get("url") or url
                if not isinstance(canonical_url, str):
                    canonical_url = url
                title = metadata.get("title")
                documents.append(
                    FetchedDocument(
                        provider_result_id=canonical_url,
                        url=url,
                        canonical_url=canonical_url,
                        title=title if isinstance(title, str) else None,
                        content=markdown,
                        source=urlparse(canonical_url).netloc or None,
                        source_roles=[SourceRole.DISCOVERY_SIGNAL],
                        provider_metadata={
                            "status_code": metadata.get("statusCode"),
                            "description": metadata.get("description"),
                        },
                    )
                )
                raw_credits = body.get("creditsUsed")
                if isinstance(raw_credits, int):
                    credits_used += raw_credits
            except (httpx.HTTPError, TypeError, ValueError):
                failure_count += 1

        status = ProviderRunStatus.SUCCESS
        if not documents:
            status = ProviderRunStatus.UNAVAILABLE
        elif failure_count:
            status = ProviderRunStatus.PARTIAL
        return FetchProbeRecord(
            probe_id=probe_id,
            provider_id=self.descriptor.provider_id,
            provider_version=self.descriptor.implementation_version,
            status=status,
            started_at=started,
            finished_at=datetime.now(UTC),
            requested_count=len(urls),
            fetched_count=len(documents),
            failure_count=failure_count,
            latency_ms=int((time.perf_counter() - tick) * 1000),
            failure_reason=("all Firecrawl fetches failed" if not documents else None),
            provider_metadata={"credits_used": credits_used or None},
            documents=documents,
        )
