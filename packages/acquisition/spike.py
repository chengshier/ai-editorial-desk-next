"""Provider-agnostic contracts for the Phase 0.5-B Acquisition Provider Spike."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class DiscoveryLane(StrEnum):
    AMBIENT = "ambient"
    POTENTIAL = "potential"
    MOMENTUM = "momentum"
    RESEARCH = "research"


class SourceRole(StrEnum):
    DISCOVERY_SIGNAL = "DISCOVERY_SIGNAL"
    TREND_SIGNAL = "TREND_SIGNAL"
    AUDIENCE_SIGNAL = "AUDIENCE_SIGNAL"
    PRIMARY_SOURCE = "PRIMARY_SOURCE"
    EVIDENCE_SOURCE = "EVIDENCE_SOURCE"
    CONTRADICTION_SOURCE = "CONTRADICTION_SOURCE"
    MATERIAL_SOURCE = "MATERIAL_SOURCE"


class ProviderCapability(StrEnum):
    SEARCH = "search"
    FETCH = "fetch"
    FEED = "feed"
    PLATFORM = "platform"
    TREND = "trend"


class ProviderRunStatus(StrEnum):
    SUCCESS = "success"
    PARTIAL = "partial"
    UNSUPPORTED = "unsupported"
    UNAVAILABLE = "unavailable"
    ERROR = "error"


class DiscoveryMission(BaseModel):
    mission_id: str
    version: str
    lane: DiscoveryLane
    mission_type: str
    objective: str
    query_seeds: list[str] = Field(min_length=1)
    source_preferences: list[str] = Field(default_factory=list)
    required_source_roles: list[SourceRole] = Field(default_factory=list)
    recency_days: int | None = Field(default=None, ge=1)
    max_results: int = Field(default=20, ge=1, le=100)
    budget_usd: float | None = Field(default=None, ge=0)


class ProviderDescriptor(BaseModel):
    provider_id: str
    implementation_version: str
    capabilities: set[ProviderCapability]


class AcquisitionCandidate(BaseModel):
    provider_result_id: str
    url: str
    canonical_url: str | None = None
    title: str
    snippet: str | None = None
    content: str | None = None
    published_at: datetime | None = None
    source: str | None = None
    source_roles: list[SourceRole] = Field(default_factory=list)
    query_variant: str | None = None
    rank: int | None = Field(default=None, ge=1)
    provider_score: float | None = None
    provider_metadata: dict[str, object] = Field(default_factory=dict)


class ProviderRunRecord(BaseModel):
    run_id: str
    mission_id: str
    mission_version: str
    lane: DiscoveryLane
    provider_id: str
    provider_version: str
    status: ProviderRunStatus
    started_at: datetime
    finished_at: datetime
    retrieved_count: int = Field(default=0, ge=0)
    fetched_count: int = Field(default=0, ge=0)
    duplicate_count: int = Field(default=0, ge=0)
    fetch_failures: int = Field(default=0, ge=0)
    opportunity_count: int = Field(default=0, ge=0)
    human_do_count: int = Field(default=0, ge=0)
    human_maybe_count: int = Field(default=0, ge=0)
    latency_ms: int | None = Field(default=None, ge=0)
    cost_usd: float | None = Field(default=None, ge=0)
    failure_reason: str | None = None
    provider_metadata: dict[str, object] = Field(default_factory=dict)
    candidates: list[AcquisitionCandidate] = Field(default_factory=list)


class FetchedDocument(BaseModel):
    provider_result_id: str
    url: str
    canonical_url: str | None = None
    title: str | None = None
    content: str
    source: str | None = None
    source_roles: list[SourceRole] = Field(default_factory=list)
    provider_metadata: dict[str, object] = Field(default_factory=dict)


class FetchProbeRecord(BaseModel):
    probe_id: str
    provider_id: str
    provider_version: str
    status: ProviderRunStatus
    started_at: datetime
    finished_at: datetime
    requested_count: int = Field(ge=1)
    fetched_count: int = Field(default=0, ge=0)
    failure_count: int = Field(default=0, ge=0)
    latency_ms: int | None = Field(default=None, ge=0)
    cost_usd: float | None = Field(default=None, ge=0)
    failure_reason: str | None = None
    provider_metadata: dict[str, object] = Field(default_factory=dict)
    documents: list[FetchedDocument] = Field(default_factory=list)


class ProviderBenchmarkSummary(BaseModel):
    provider_id: str
    total_runs: int
    successful_runs: int
    unsupported_runs: int
    unavailable_runs: int
    retrieved_count: int
    opportunity_count: int
    editorial_discovery_yield: float | None
    potential_retrieved_count: int
    potential_opportunity_count: int
    potential_discovery_yield: float | None
    momentum_retrieved_count: int
    momentum_opportunity_count: int
    momentum_discovery_yield: float | None
    human_do_count: int
    human_maybe_count: int
    total_cost_usd: float | None


def _yield(opportunities: int, retrieved: int) -> float | None:
    if retrieved == 0:
        return None
    return opportunities / retrieved


def summarize_provider_runs(
    provider_id: str,
    runs: list[ProviderRunRecord],
) -> ProviderBenchmarkSummary:
    """Aggregate observed Spike runs without inventing unavailable values."""

    scoped = [run for run in runs if run.provider_id == provider_id]
    retrieved = sum(run.retrieved_count for run in scoped)
    opportunities = sum(run.opportunity_count for run in scoped)
    potential = [run for run in scoped if run.lane == DiscoveryLane.POTENTIAL]
    momentum = [run for run in scoped if run.lane == DiscoveryLane.MOMENTUM]
    potential_retrieved = sum(run.retrieved_count for run in potential)
    potential_opportunities = sum(run.opportunity_count for run in potential)
    momentum_retrieved = sum(run.retrieved_count for run in momentum)
    momentum_opportunities = sum(run.opportunity_count for run in momentum)
    costs = [run.cost_usd for run in scoped if run.cost_usd is not None]

    return ProviderBenchmarkSummary(
        provider_id=provider_id,
        total_runs=len(scoped),
        successful_runs=sum(
            run.status in {ProviderRunStatus.SUCCESS, ProviderRunStatus.PARTIAL} for run in scoped
        ),
        unsupported_runs=sum(run.status == ProviderRunStatus.UNSUPPORTED for run in scoped),
        unavailable_runs=sum(run.status == ProviderRunStatus.UNAVAILABLE for run in scoped),
        retrieved_count=retrieved,
        opportunity_count=opportunities,
        editorial_discovery_yield=_yield(opportunities, retrieved),
        potential_retrieved_count=potential_retrieved,
        potential_opportunity_count=potential_opportunities,
        potential_discovery_yield=_yield(potential_opportunities, potential_retrieved),
        momentum_retrieved_count=momentum_retrieved,
        momentum_opportunity_count=momentum_opportunities,
        momentum_discovery_yield=_yield(momentum_opportunities, momentum_retrieved),
        human_do_count=sum(run.human_do_count for run in scoped),
        human_maybe_count=sum(run.human_maybe_count for run in scoped),
        total_cost_usd=sum(costs) if costs else None,
    )
