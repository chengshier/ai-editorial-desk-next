"""Build a provider-blind multi-channel human acceptance packet from a real D4 run."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from benchmarks.acquisition.build_human_acceptance_packet import (
    _canonical,
    _excerpt,
    _firecrawl_document_map,
    _review_context,
    _sample,
)

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = (
    ROOT / "benchmarks" / "acquisition" / "mission_templates.multichannel.zh-CN.v1.json"
)
CONTENT_EXCERPT_LIMIT = 1200
SNIPPET_EXCERPT_LIMIT = 900


def _load_json(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise TypeError(f"artifact must be a JSON object: {path}")
    return payload


def _mission_order(manifest: dict[str, Any]) -> list[str]:
    raw = manifest.get("missions")
    if not isinstance(raw, list):
        raise TypeError("manifest must contain a missions array")
    result: list[str] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        mission_id = item.get("mission_id")
        if isinstance(mission_id, str) and mission_id:
            result.append(mission_id)
    if not result:
        raise ValueError("manifest contains no mission ids")
    return result


def _mission_meta(manifest: dict[str, Any], mission_id: str) -> dict[str, Any]:
    raw = manifest.get("mission_meta")
    if not isinstance(raw, dict):
        return {}
    value = raw.get(mission_id)
    return value if isinstance(value, dict) else {}


def _runs_by_mission(
    artifact: dict[str, Any],
    run_key: str,
) -> dict[str, dict[str, Any]]:
    runs_root = artifact.get("runs")
    runs_root = runs_root if isinstance(runs_root, dict) else {}
    runs = runs_root.get(run_key)
    runs = runs if isinstance(runs, list) else []
    result: dict[str, dict[str, Any]] = {}
    for run in runs:
        if not isinstance(run, dict) or run.get("status") not in {"success", "partial"}:
            continue
        mission_id = run.get("mission_id")
        if isinstance(mission_id, str):
            result[mission_id] = run
    return result


def _pick_candidate(
    run: dict[str, Any],
    *,
    seen_urls: set[str],
) -> dict[str, Any]:
    raw = run.get("candidates")
    candidates = [item for item in raw if isinstance(item, dict)] if isinstance(raw, list) else []
    candidates.sort(
        key=lambda item: item.get("rank") if isinstance(item.get("rank"), int) else 10**9
    )
    for candidate in candidates:
        url = _canonical(candidate)
        if url not in seen_urls:
            seen_urls.add(url)
            return candidate
    raise ValueError(f"no distinct candidate available for mission {run.get('mission_id')}")


def _article_excerpt(
    value: object,
    *,
    title: object,
    limit: int = CONTENT_EXCERPT_LIMIT,
) -> str | None:
    """Prefer article-body context over site chrome when the title is present in fetched markdown."""
    if not isinstance(value, str) or not value.strip():
        return None
    raw = value
    if isinstance(title, str) and title.strip():
        normalized_title = title.strip()
        markers = [normalized_title, normalized_title.split("|")[0].strip()]
        for marker in markers:
            if marker and marker in raw:
                raw = raw.split(marker, 1)[1]
                break
    return _excerpt(raw, limit=limit)


def _multichannel_review_context(
    candidate: dict[str, Any],
    *,
    fetched_document: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build enough factual context for human review without pretending it is verified evidence."""
    context = _review_context(candidate, fetched_document=fetched_document)
    source_content = (
        fetched_document.get("content")
        if isinstance(fetched_document, dict)
        else candidate.get("content")
    )
    body_excerpt = _article_excerpt(source_content, title=candidate.get("title"))
    provider_snippet = _excerpt(candidate.get("snippet"), limit=SNIPPET_EXCERPT_LIMIT)

    summary = context.get("summary")
    summary_text = summary if isinstance(summary, str) else None
    if provider_snippet and (summary_text is None or len(summary_text) < 160):
        context["summary"] = provider_snippet
        context["quality"] = "PROVIDER_SNIPPET"
        summary_text = provider_snippet
    if body_excerpt and (summary_text is None or len(summary_text) < 240):
        context["summary"] = body_excerpt
        context["quality"] = (
            "FETCHED_CONTENT_EXCERPT"
            if isinstance(fetched_document, dict)
            else "INTEGRATED_CONTENT_EXCERPT"
        )
        summary_text = body_excerpt

    context["provider_snippet"] = provider_snippet
    context["content_excerpt"] = body_excerpt
    context["context_sufficient_hint"] = bool(
        (summary_text and len(summary_text) >= 160)
        or (body_excerpt and len(body_excerpt) >= 240)
        or (provider_snippet and len(provider_snippet) >= 180)
    )
    context["verification_note"] = (
        "This is discovery/retrieval context only; claims and event timing still require evidence review."
    )
    return context


def _decorate_sample(
    sample: dict[str, Any],
    *,
    mission_id: str,
    provider_slot: str,
    meta: dict[str, Any],
    candidate: dict[str, Any],
) -> dict[str, Any]:
    # Human-facing packet must not expose the provider before the editorial decision.
    sample.pop("provider_id", None)
    sample["comparison_pair"] = mission_id
    sample["blind_review_label"] = provider_slot
    sample["published_at"] = candidate.get("published_at")
    sample["temporal_note"] = (
        "published_at is provider/page metadata and does not independently prove event time or recency"
    )
    sample["editorial_modes"] = list(meta.get("editorial_modes") or [])
    sample["series_hints"] = list(meta.get("series_hints") or [])
    human_review = sample.get("human_review")
    if isinstance(human_review, dict):
        human_review.update(
            {
                "investment_priority": None,
                "production_depth": None,
                "series_fit": None,
                "editorial_mode_fit": None,
            }
        )
    return sample


def build_packet(
    artifact: dict[str, Any],
    manifest: dict[str, Any],
) -> dict[str, Any]:
    mission_ids = _mission_order(manifest)
    exa_runs = _runs_by_mission(artifact, "exa_search")
    tavily_runs = _runs_by_mission(artifact, "tavily_search_fetch")
    fetched_documents = _firecrawl_document_map(artifact)

    missing = [
        mission_id
        for mission_id in mission_ids
        if mission_id not in exa_runs or mission_id not in tavily_runs
    ]
    if missing:
        raise ValueError(
            "real D4 artifact is missing successful Exa/Tavily runs for: " + ", ".join(missing)
        )

    seen_urls: set[str] = set()
    samples: list[dict[str, Any]] = []
    for pair_index, mission_id in enumerate(mission_ids, start=1):
        meta = _mission_meta(manifest, mission_id)

        exa_candidate = _pick_candidate(exa_runs[mission_id], seen_urls=seen_urls)
        exa_sample = _sample(
            bucket="multichannel",
            provider_id=str(exa_runs[mission_id].get("provider_id") or "exa-search"),
            mission_id=mission_id,
            candidate=exa_candidate,
            ordinal=len(samples) + 1,
            selection_basis=(
                "top-ranked distinct candidate for this mission; rank is sampling only, not value"
            ),
            review_context=_multichannel_review_context(
                exa_candidate,
                fetched_document=fetched_documents.get(_canonical(exa_candidate)),
            ),
        )
        samples.append(
            _decorate_sample(
                exa_sample,
                mission_id=mission_id,
                provider_slot=f"M{pair_index}-A",
                meta=meta,
                candidate=exa_candidate,
            )
        )

        tavily_candidate = _pick_candidate(tavily_runs[mission_id], seen_urls=seen_urls)
        tavily_sample = _sample(
            bucket="multichannel",
            provider_id=str(
                tavily_runs[mission_id].get("provider_id") or "tavily-search-fetch"
            ),
            mission_id=mission_id,
            candidate=tavily_candidate,
            ordinal=len(samples) + 1,
            selection_basis=(
                "top-ranked distinct candidate for the same mission; rank is sampling only, not value"
            ),
            review_context=_multichannel_review_context(tavily_candidate),
        )
        samples.append(
            _decorate_sample(
                tavily_sample,
                mission_id=mission_id,
                provider_slot=f"M{pair_index}-B",
                meta=meta,
                candidate=tavily_candidate,
            )
        )

    return {
        "schema_version": "multichannel-acceptance-v2",
        "status": "PENDING_HUMAN_REVIEW",
        "profile": manifest.get("acceptance_profile") or {},
        "mission_count": len(mission_ids),
        "sample_count": len(samples),
        "review_policy": {
            "provider_blind_until_decision": True,
            "provider_identifiers_removed_from_human_packet": True,
            "provider_rank_is_not_editorial_value": True,
            "published_at_is_not_event_time": True,
            "context_sufficient_hint_is_not_human_decision": True,
            "required_human_fields": [
                "decision",
                "would_read",
                "would_make",
                "investment_priority",
                "production_depth",
                "series_fit",
                "editorial_mode_fit",
                "rationale",
                "evidence_followup_needed",
                "context_sufficient",
            ],
        },
        "samples": samples,
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--d4", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    packet = build_packet(_load_json(args.d4), _load_json(args.manifest))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(packet, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
