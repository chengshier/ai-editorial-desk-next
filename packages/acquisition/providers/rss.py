"""RSS/Atom adapter for the no-key Ambient Sensing baseline."""

from __future__ import annotations

import time
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from urllib.parse import urljoin
from uuid import uuid4
from xml.etree import ElementTree

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


class RssFeedProvider:
    """Read one configured RSS/Atom feed as a stable Ambient baseline."""

    def __init__(
        self,
        client: httpx.AsyncClient,
        *,
        feed_url: str,
        provider_id: str | None = None,
    ) -> None:
        self._client = client
        self._feed_url = feed_url
        self._provider_id = provider_id or f"rss:{feed_url}"

    @property
    def descriptor(self) -> ProviderDescriptor:
        return ProviderDescriptor(
            provider_id=self._provider_id,
            implementation_version="v1",
            capabilities={ProviderCapability.FEED},
        )

    async def run(self, mission: DiscoveryMission) -> ProviderRunRecord:
        started = datetime.now(UTC)
        tick = time.perf_counter()
        run_id = f"acq_{uuid4().hex}"

        if mission.lane != DiscoveryLane.AMBIENT:
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
                failure_reason="RSS feed baseline supports the ambient lane only.",
            )

        try:
            response = await self._client.get(self._feed_url)
            response.raise_for_status()
            candidates = _parse_feed(
                response.text,
                feed_url=str(response.url) if response.url else self._feed_url,
                limit=mission.max_results,
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
                failure_reason=f"RSS feed unavailable: {exc}",
            )
        except ElementTree.ParseError as exc:
            return ProviderRunRecord(
                run_id=run_id,
                mission_id=mission.mission_id,
                mission_version=mission.version,
                lane=mission.lane,
                provider_id=self.descriptor.provider_id,
                provider_version=self.descriptor.implementation_version,
                status=ProviderRunStatus.ERROR,
                started_at=started,
                finished_at=datetime.now(UTC),
                latency_ms=int((time.perf_counter() - tick) * 1000),
                failure_reason=f"RSS/Atom parse failed: {exc}",
            )


def _parse_feed(xml_text: str, *, feed_url: str, limit: int) -> list[AcquisitionCandidate]:
    root = ElementTree.fromstring(xml_text)
    if _local_name(root.tag) == "rss":
        return _parse_rss(root, feed_url=feed_url, limit=limit)
    if _local_name(root.tag) == "feed":
        return _parse_atom(root, feed_url=feed_url, limit=limit)
    raise ElementTree.ParseError(f"unsupported feed root: {_local_name(root.tag)}")


def _parse_rss(
    root: ElementTree.Element,
    *,
    feed_url: str,
    limit: int,
) -> list[AcquisitionCandidate]:
    channel = next((child for child in root if _local_name(child.tag) == "channel"), None)
    if channel is None:
        return []
    items = [child for child in channel if _local_name(child.tag) == "item"]
    candidates: list[AcquisitionCandidate] = []
    for rank, item in enumerate(items[:limit], start=1):
        title = _child_text(item, "title")
        link = _child_text(item, "link") or _child_text(item, "guid")
        if not title or not link:
            continue
        url = urljoin(feed_url, link)
        candidates.append(
            AcquisitionCandidate(
                provider_result_id=_child_text(item, "guid") or url,
                url=url,
                canonical_url=url,
                title=title,
                snippet=_child_text(item, "description"),
                published_at=_parse_datetime(_child_text(item, "pubDate")),
                source=_source_from_url(feed_url),
                source_roles=[SourceRole.DISCOVERY_SIGNAL],
                rank=rank,
                provider_metadata={"feed_format": "rss", "feed_url": feed_url},
            )
        )
    return candidates


def _parse_atom(
    root: ElementTree.Element,
    *,
    feed_url: str,
    limit: int,
) -> list[AcquisitionCandidate]:
    entries = [child for child in root if _local_name(child.tag) == "entry"]
    candidates: list[AcquisitionCandidate] = []
    for rank, entry in enumerate(entries[:limit], start=1):
        title = _child_text(entry, "title")
        link = _atom_link(entry)
        result_id = _child_text(entry, "id") or link
        if not title or not link or not result_id:
            continue
        url = urljoin(feed_url, link)
        candidates.append(
            AcquisitionCandidate(
                provider_result_id=result_id,
                url=url,
                canonical_url=url,
                title=title,
                snippet=_child_text(entry, "summary") or _child_text(entry, "content"),
                published_at=_parse_datetime(
                    _child_text(entry, "published") or _child_text(entry, "updated")
                ),
                source=_source_from_url(feed_url),
                source_roles=[SourceRole.DISCOVERY_SIGNAL],
                rank=rank,
                provider_metadata={"feed_format": "atom", "feed_url": feed_url},
            )
        )
    return candidates


def _atom_link(entry: ElementTree.Element) -> str | None:
    fallback = None
    for child in entry:
        if _local_name(child.tag) != "link":
            continue
        href = child.attrib.get("href")
        if not href:
            continue
        rel = child.attrib.get("rel", "alternate")
        if rel == "alternate":
            return href
        fallback = fallback or href
    return fallback


def _child_text(element: ElementTree.Element, local_name: str) -> str | None:
    for child in element:
        if _local_name(child.tag) == local_name and child.text:
            value = child.text.strip()
            if value:
                return value
    return None


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        return parsed.astimezone(UTC)
    except (TypeError, ValueError):
        try:
            normalized = value.replace("Z", "+00:00")
            parsed = datetime.fromisoformat(normalized)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=UTC)
            return parsed.astimezone(UTC)
        except ValueError:
            return None


def _source_from_url(url: str) -> str:
    try:
        return httpx.URL(url).host or url
    except (TypeError, ValueError):
        return url
