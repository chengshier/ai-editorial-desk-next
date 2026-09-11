"""Google Trends public RSS adapter for the Phase 0.5-B momentum baseline."""

from __future__ import annotations

import time
import xml.etree.ElementTree as ET
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from urllib.parse import urlencode, urlparse
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


class GoogleTrendsRssProvider:
    """Public Google Trends RSS baseline for current search-attention surges.

    This adapter intentionally supports only the generic ATTENTION_SURGE mission.
    RSS inclusion is treated as a provider trend signal, not as editorial value or
    cross-platform/community acceleration evidence.
    """

    def __init__(
        self,
        client: httpx.AsyncClient,
        *,
        geo: str = "US",
        feed_url: str = "https://trends.google.com/trending/rss",
    ) -> None:
        self._client = client
        self._geo = geo.upper()
        self._feed_url = feed_url
        self._cached_xml: str | None = None

    @property
    def descriptor(self) -> ProviderDescriptor:
        return ProviderDescriptor(
            provider_id=f"google-trends-rss-{self._geo.lower()}",
            implementation_version="v1",
            capabilities={ProviderCapability.TREND, ProviderCapability.FEED},
        )

    async def run(self, mission: DiscoveryMission) -> ProviderRunRecord:
        started = datetime.now(UTC)
        tick = time.perf_counter()
        run_id = f"acq_{uuid4().hex}"

        if mission.lane != DiscoveryLane.MOMENTUM or mission.mission_type != "ATTENTION_SURGE":
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
                    "Google Trends RSS v1 only represents generic recent search-attention surges; "
                    "it does not prove community acceleration, cross-platform spread, culture-only "
                    "breakout, resurfacing history, or evidence coverage"
                ),
            )

        try:
            if self._cached_xml is None:
                response = await self._client.get(
                    self._feed_url,
                    params={"geo": self._geo},
                    headers={"User-Agent": "ai-editorial-desk-next/phase-0.5b"},
                )
                response.raise_for_status()
                self._cached_xml = response.text
            candidates = self._parse(self._cached_xml, max_results=mission.max_results)
        except (httpx.HTTPError, ET.ParseError, TypeError, ValueError):
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
                failure_reason="Google Trends RSS snapshot unavailable or invalid",
            )

        return ProviderRunRecord(
            run_id=run_id,
            mission_id=mission.mission_id,
            mission_version=mission.version,
            lane=mission.lane,
            provider_id=self.descriptor.provider_id,
            provider_version=self.descriptor.implementation_version,
            status=ProviderRunStatus.SUCCESS if candidates else ProviderRunStatus.UNAVAILABLE,
            started_at=started,
            finished_at=datetime.now(UTC),
            retrieved_count=len(candidates),
            latency_ms=int((time.perf_counter() - tick) * 1000),
            failure_reason=None if candidates else "Google Trends RSS returned no trend items",
            provider_metadata={
                "geo": self._geo,
                "snapshot_semantics": "provider-reported recent search-attention surge; not velocity magnitude or editorial value",
                "feed_url": f"{self._feed_url}?{urlencode({'geo': self._geo})}",
            },
            candidates=candidates,
        )

    def _parse(self, xml_text: str, *, max_results: int) -> list[AcquisitionCandidate]:
        root = ET.fromstring(xml_text)
        items = root.findall("./channel/item")
        candidates: list[AcquisitionCandidate] = []
        for rank, item in enumerate(items[:max_results], start=1):
            title = (item.findtext("title") or "").strip()
            if not title:
                continue
            item_link = (item.findtext("link") or "").strip()
            description = (item.findtext("description") or "").strip() or None
            published_at = _parse_datetime(item.findtext("pubDate"))
            approx_traffic = _find_text_wildcard(item, "approx_traffic")
            related_news = _parse_news_items(item)
            primary_news_url = next(
                (news["url"] for news in related_news if isinstance(news.get("url"), str)),
                None,
            )
            url = primary_news_url or item_link
            if not url:
                url = f"https://trends.google.com/trending?geo={self._geo}"
            candidates.append(
                AcquisitionCandidate(
                    provider_result_id=f"{self._geo}:{title}",
                    url=url,
                    canonical_url=url,
                    title=title,
                    snippet=description,
                    published_at=published_at,
                    source=urlparse(url).netloc or "trends.google.com",
                    source_roles=[SourceRole.TREND_SIGNAL, SourceRole.DISCOVERY_SIGNAL],
                    rank=rank,
                    provider_metadata={
                        "geo": self._geo,
                        "approx_traffic": approx_traffic,
                        "approx_traffic_value": _parse_traffic(approx_traffic),
                        "related_news": related_news,
                        "trend_semantics": (
                            "Google Trending Now/RSS inclusion indicates a recent search-interest surge; "
                            "traffic is approximate and neither field is editorial value"
                        ),
                    },
                )
            )
        return candidates


def _find_text_wildcard(element: ET.Element, local_name: str) -> str | None:
    found = element.find(f"{{*}}{local_name}")
    if found is None or found.text is None:
        return None
    value = found.text.strip()
    return value or None


def _parse_news_items(item: ET.Element) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    for news in item.findall("{*}news_item"):
        title = _find_text_wildcard(news, "news_item_title")
        url = _find_text_wildcard(news, "news_item_url")
        source = _find_text_wildcard(news, "news_item_source")
        snippet = _find_text_wildcard(news, "news_item_snippet")
        payload = {
            key: value
            for key, value in {
                "title": title,
                "url": url,
                "source": source,
                "snippet": snippet,
            }.items()
            if value is not None
        }
        if payload:
            result.append(payload)
    return result


def _parse_traffic(value: str | None) -> int | None:
    if not value:
        return None
    digits = "".join(character for character in value if character.isdigit())
    return int(digits) if digits else None


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)
