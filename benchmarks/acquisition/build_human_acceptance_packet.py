"""Build the Phase 0.5-B human editorial acceptance packet from real benchmark artifacts."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

BUCKET_SIZE = 5
CONTEXT_EXCERPT_LIMIT = 720


def _load_json(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise TypeError(f"artifact must be a JSON object: {path}")
    return payload


def _canonical(candidate: dict[str, Any]) -> str:
    value = candidate.get("canonical_url") or candidate.get("url")
    if not isinstance(value, str) or not value:
        raise ValueError("candidate must include url/canonical_url")
    return value


def _roles(candidate: dict[str, Any]) -> list[str]:
    raw = candidate.get("source_roles")
    if not isinstance(raw, list):
        return []
    return [str(role) for role in raw]


def _excerpt(value: object, *, limit: int = CONTEXT_EXCERPT_LIMIT) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", value)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[`#>*_~]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def _related_news_context(metadata: dict[str, Any]) -> list[dict[str, str]]:
    raw = metadata.get("related_news")
    if not isinstance(raw, list):
        return []
    result: list[dict[str, str]] = []
    for item in raw[:3]:
        if not isinstance(item, dict):
            continue
        payload = {
            key: value
            for key, value in {
                "title": item.get("title"),
                "source": item.get("source"),
                "url": item.get("url"),
            }.items()
            if isinstance(value, str) and value
        }
        if payload:
            result.append(payload)
    return result


def _review_context(
    candidate: dict[str, Any],
    *,
    fetched_document: dict[str, Any] | None = None,
) -> dict[str, Any]:
    candidate_metadata = candidate.get("provider_metadata")
    candidate_metadata = candidate_metadata if isinstance(candidate_metadata, dict) else {}
    document = fetched_document if isinstance(fetched_document, dict) else None
    document_metadata = document.get("provider_metadata") if document else None
    document_metadata = document_metadata if isinstance(document_metadata, dict) else {}

    description = document_metadata.get("description") or candidate_metadata.get("description")
    summary = _excerpt(description)
    quality = "FETCHED_DESCRIPTION" if summary and document else "PROVIDER_DESCRIPTION" if summary else None

    if summary is None and document is not None:
        summary = _excerpt(document.get("content"))
        if summary:
            quality = "FETCHED_CONTENT_EXCERPT"

    if summary is None:
        summary = _excerpt(candidate.get("content"))
        if summary:
            quality = "INTEGRATED_CONTENT_EXCERPT"

    related_news = _related_news_context(candidate_metadata)
    if summary is None and related_news:
        titles = [item.get("title") for item in related_news if item.get("title")]
        if titles:
            summary = "；".join(str(title) for title in titles)
            quality = "RELATED_NEWS_CONTEXT"

    signals = {
        key: candidate_metadata[key]
        for key in ("approx_traffic", "score", "descendants")
        if key in candidate_metadata
    }
    if summary is None and signals:
        quality = "TITLE_PLUS_SIGNALS"

    return {
        "quality": quality or "TITLE_ONLY",
        "summary": summary,
        "related_news": related_news,
        "signals": signals,
        "source_url": candidate.get("url"),
    }


def _firecrawl_document_map(d2b: dict[str, Any]) -> dict[str, dict[str, Any]]:
    runs_root = d2b.get("runs")
    runs_root = runs_root if isinstance(runs_root, dict) else {}
    probes = runs_root.get("firecrawl_fetch")
    probes = probes if isinstance(probes, list) else []
    result: dict[str, dict[str, Any]] = {}
    for probe in probes:
        if not isinstance(probe, dict):
            continue
        documents = probe.get("documents")
        if not isinstance(documents, list):
            continue
        for document in documents:
            if not isinstance(document, dict):
                continue
            try:
                result.setdefault(_canonical(document), document)
            except ValueError:
                continue
    return result


def _sample(
    *,
    bucket: str,
    provider_id: str,
    mission_id: str,
    candidate: dict[str, Any],
    ordinal: int,
    selection_basis: str,
    review_context: dict[str, Any],
) -> dict[str, Any]:
    metadata = candidate.get("provider_metadata")
    metadata = metadata if isinstance(metadata, dict) else {}
    signals = {
        key: metadata[key]
        for key in (
            "approx_traffic",
            "approx_traffic_value",
            "trend_observed_at",
            "score",
            "descendants",
            "hn_item_id",
        )
        if key in metadata
    }
    return {
        "sample_id": f"{bucket}-{ordinal:02d}",
        "bucket": bucket,
        "selection_basis": selection_basis,
        "provider_id": provider_id,
        "mission_id": mission_id,
        "title": candidate.get("title"),
        "url": candidate.get("url"),
        "canonical_url": candidate.get("canonical_url") or candidate.get("url"),
        "source": candidate.get("source"),
        "source_roles": _roles(candidate),
        "rank": candidate.get("rank"),
        "query_variant": candidate.get("query_variant"),
        "provider_score": candidate.get("provider_score"),
        "content_available": bool(candidate.get("content")),
        "signals": signals,
        "review_context": review_context,
        "human_review": {
            "decision": None,
            "would_read": None,
            "would_make": None,
            "placement": None,
            "rationale": None,
            "evidence_followup_needed": None,
            "context_sufficient": None,
        },
    }


def _append_unique(
    result: list[dict[str, Any]],
    seen_urls: set[str],
    *,
    bucket: str,
    provider_id: str,
    mission_id: str,
    candidate: dict[str, Any],
    selection_basis: str,
    limit: int,
    review_context: dict[str, Any],
) -> None:
    if len(result) >= limit:
        return
    url = _canonical(candidate)
    if url in seen_urls:
        return
    seen_urls.add(url)
    result.append(
        _sample(
            bucket=bucket,
            provider_id=provider_id,
            mission_id=mission_id,
            candidate=candidate,
            ordinal=len(result) + 1,
            selection_basis=selection_basis,
            review_context=review_context,
        )
    )


def _momentum_samples(
    d3: dict[str, Any], seen_urls: set[str], *, limit: int
) -> list[dict[str, Any]]:
    candidates: list[tuple[str, str, dict[str, Any]]] = []
    runs = d3.get("runs")
    if isinstance(runs, list):
        for run in runs:
            if not isinstance(run, dict) or run.get("status") not in {"success", "partial"}:
                continue
            if run.get("lane") != "momentum":
                continue
            provider_id = str(run.get("provider_id") or "unknown")
            mission_id = str(run.get("mission_id") or "unknown")
            raw_candidates = run.get("candidates")
            if not isinstance(raw_candidates, list):
                continue
            for candidate in raw_candidates:
                if isinstance(candidate, dict):
                    candidates.append((provider_id, mission_id, candidate))

    def momentum_sort(item: tuple[str, str, dict[str, Any]]) -> tuple[int, int]:
        candidate = item[2]
        metadata = candidate.get("provider_metadata")
        metadata = metadata if isinstance(metadata, dict) else {}
        traffic = metadata.get("approx_traffic_value")
        traffic_value = traffic if isinstance(traffic, int) else -1
        rank = candidate.get("rank")
        rank_value = rank if isinstance(rank, int) else 10**9
        return (-traffic_value, rank_value)

    result: list[dict[str, Any]] = []
    for provider_id, mission_id, candidate in sorted(candidates, key=momentum_sort):
        _append_unique(
            result,
            seen_urls,
            bucket="momentum",
            provider_id=provider_id,
            mission_id=mission_id,
            candidate=candidate,
            selection_basis=(
                "highest observed provider attention first; traffic/rank are sampling signals only, "
                "never editorial value"
            ),
            limit=limit,
            review_context=_review_context(candidate),
        )
    return result


def _potential_samples(
    d2b: dict[str, Any], seen_urls: set[str], *, limit: int
) -> list[dict[str, Any]]:
    runs_root = d2b.get("runs")
    runs_root = runs_root if isinstance(runs_root, dict) else {}
    runs = runs_root.get("exa_search")
    runs = runs if isinstance(runs, list) else []
    fetched_documents = _firecrawl_document_map(d2b)
    by_mission: list[tuple[str, str, list[dict[str, Any]]]] = []
    for run in runs:
        if not isinstance(run, dict) or run.get("status") not in {"success", "partial"}:
            continue
        raw_candidates = run.get("candidates")
        raw_candidates = raw_candidates if isinstance(raw_candidates, list) else []
        candidates = [candidate for candidate in raw_candidates if isinstance(candidate, dict)]
        candidates.sort(key=lambda candidate: candidate.get("rank") or 10**9)
        by_mission.append(
            (
                str(run.get("provider_id") or "exa-search"),
                str(run.get("mission_id") or "unknown"),
                candidates,
            )
        )

    result: list[dict[str, Any]] = []
    depth = 0
    while len(result) < limit and any(depth < len(items) for _, _, items in by_mission):
        for provider_id, mission_id, candidates in by_mission:
            if depth >= len(candidates):
                continue
            candidate = candidates[depth]
            _append_unique(
                result,
                seen_urls,
                bucket="potential",
                provider_id=provider_id,
                mission_id=mission_id,
                candidate=candidate,
                selection_basis=(
                    "round-robin across real Potential missions to avoid one mission dominating the "
                    "human acceptance sample"
                ),
                limit=limit,
                review_context=_review_context(
                    candidate,
                    fetched_document=fetched_documents.get(_canonical(candidate)),
                ),
            )
        depth += 1
    return result


def _community_samples(
    d1: dict[str, Any], seen_urls: set[str], *, limit: int
) -> list[dict[str, Any]]:
    unique: dict[str, tuple[str, str, dict[str, Any]]] = {}
    runs = d1.get("runs")
    if isinstance(runs, list):
        for run in runs:
            if not isinstance(run, dict) or run.get("status") not in {"success", "partial"}:
                continue
            provider_id = str(run.get("provider_id") or "unknown")
            if "hackernews" not in provider_id:
                continue
            mission_id = str(run.get("mission_id") or "unknown")
            raw_candidates = run.get("candidates")
            if not isinstance(raw_candidates, list):
                continue
            for candidate in raw_candidates:
                if not isinstance(candidate, dict) or "AUDIENCE_SIGNAL" not in _roles(candidate):
                    continue
                unique.setdefault(_canonical(candidate), (provider_id, mission_id, candidate))

    ordered = sorted(
        unique.values(),
        key=lambda item: (
            item[2].get("rank") if isinstance(item[2].get("rank"), int) else 10**9,
            _canonical(item[2]),
        ),
    )
    result: list[dict[str, Any]] = []
    for provider_id, mission_id, candidate in ordered:
        _append_unique(
            result,
            seen_urls,
            bucket="community",
            provider_id=provider_id,
            mission_id=mission_id,
            candidate=candidate,
            selection_basis=(
                "deduplicated HN community-first discovery with AUDIENCE_SIGNAL; HN rank is a snapshot, "
                "not TREND_SIGNAL"
            ),
            limit=limit,
            review_context=_review_context(candidate),
        )
    return result


def _control_samples(
    d2b: dict[str, Any], seen_urls: set[str], *, limit: int
) -> list[dict[str, Any]]:
    runs_root = d2b.get("runs")
    runs_root = runs_root if isinstance(runs_root, dict) else {}
    runs = runs_root.get("tavily_search_fetch")
    runs = runs if isinstance(runs, list) else []
    pool: list[tuple[str, str, dict[str, Any]]] = []
    for run in runs:
        if not isinstance(run, dict) or run.get("status") not in {"success", "partial"}:
            continue
        provider_id = str(run.get("provider_id") or "tavily-search-fetch")
        mission_id = str(run.get("mission_id") or "unknown")
        raw_candidates = run.get("candidates")
        if not isinstance(raw_candidates, list):
            continue
        for candidate in raw_candidates:
            if isinstance(candidate, dict):
                pool.append((provider_id, mission_id, candidate))

    def control_sort(item: tuple[str, str, dict[str, Any]]) -> tuple[int, int, str]:
        candidate = item[2]
        content_missing = 0 if not candidate.get("content") else 1
        rank = candidate.get("rank")
        rank_value = -(rank if isinstance(rank, int) else 0)
        return (content_missing, rank_value, _canonical(candidate))

    result: list[dict[str, Any]] = []
    for provider_id, mission_id, candidate in sorted(pool, key=control_sort):
        _append_unique(
            result,
            seen_urls,
            bucket="control",
            provider_id=provider_id,
            mission_id=mission_id,
            candidate=candidate,
            selection_basis=(
                "control pool intentionally prefers missing raw content / lower-ranked integrated results; "
                "this is not a preassigned DROP label"
            ),
            limit=limit,
            review_context=_review_context(candidate),
        )
    return result


def build_packet(
    d1: dict[str, Any],
    d2b: dict[str, Any],
    d3: dict[str, Any],
    *,
    bucket_size: int = BUCKET_SIZE,
) -> dict[str, Any]:
    if bucket_size < 1:
        raise ValueError("bucket_size must be >= 1")
    seen_urls: set[str] = set()
    buckets = {
        "momentum": _momentum_samples(d3, seen_urls, limit=bucket_size),
        "potential": _potential_samples(d2b, seen_urls, limit=bucket_size),
        "community": _community_samples(d1, seen_urls, limit=bucket_size),
        "control": _control_samples(d2b, seen_urls, limit=bucket_size),
    }
    incomplete = {name: len(samples) for name, samples in buckets.items() if len(samples) < bucket_size}
    if incomplete:
        detail = ", ".join(f"{name}={count}/{bucket_size}" for name, count in incomplete.items())
        raise ValueError(f"not enough distinct candidates for acceptance packet: {detail}")

    samples = [sample for bucket in ("momentum", "potential", "community", "control") for sample in buckets[bucket]]
    return {
        "schema_version": "2",
        "acceptance_kind": "phase-0.5b-human-editorial-acceptance",
        "status": "PENDING_HUMAN_REVIEW",
        "sample_count": len(samples),
        "bucket_size": bucket_size,
        "decision_contract": {
            "decision": ["DO", "MAYBE", "DROP"],
            "would_read": [True, False],
            "would_make": [True, False],
            "placement": ["MAIN", "COLUMN", "LONG_TERM", "RESEARCH_ONLY", "NONE"],
            "evidence_followup_needed": [True, False],
            "context_sufficient": [True, False],
            "rationale": "required free text",
        },
        "semantics": {
            "sampling": "sampling signals choose a balanced packet; they are not editorial scores",
            "trend": "TREND_SIGNAL does not imply DO/MAYBE",
            "community": "AUDIENCE_SIGNAL does not imply factual confirmation",
            "control": "control samples are not pre-labeled negatives; the human decision remains authoritative",
            "review_context": (
                "human review must be based on enough context to understand the candidate; title-only context may be "
                "marked context_sufficient=false and must not be counted as final acceptance"
            ),
        },
        "samples": samples,
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--d1", type=Path, required=True, help="D1 HN no-key artifact")
    parser.add_argument("--d2b", type=Path, required=True, help="D2-B keyed Search/Fetch artifact")
    parser.add_argument("--d3", type=Path, required=True, help="D3 Google Trends artifact")
    parser.add_argument("--bucket-size", type=int, default=BUCKET_SIZE)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    packet = build_packet(
        _load_json(args.d1),
        _load_json(args.d2b),
        _load_json(args.d3),
        bucket_size=args.bucket_size,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(packet, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
