import json
from datetime import UTC, datetime
from pathlib import Path

from packages.acquisition.spike import (
    DiscoveryLane,
    DiscoveryMission,
    ProviderRunRecord,
    ProviderRunStatus,
    SourceRole,
    summarize_provider_runs,
)

ROOT = Path(__file__).resolve().parents[1]
MISSION_MANIFEST = ROOT / "benchmarks" / "acquisition" / "mission_templates.v1.json"


def _run(
    *,
    run_id: str,
    lane: DiscoveryLane,
    retrieved: int,
    opportunities: int,
    status: ProviderRunStatus = ProviderRunStatus.SUCCESS,
    cost_usd: float | None = None,
) -> ProviderRunRecord:
    now = datetime.now(UTC)
    return ProviderRunRecord(
        run_id=run_id,
        mission_id=f"mission-{run_id}",
        mission_version="1",
        lane=lane,
        provider_id="provider-a",
        provider_version="v1",
        status=status,
        started_at=now,
        finished_at=now,
        retrieved_count=retrieved,
        opportunity_count=opportunities,
        human_do_count=opportunities,
        cost_usd=cost_usd,
    )


def test_mission_manifest_covers_potential_momentum_and_community_followup() -> None:
    payload = json.loads(MISSION_MANIFEST.read_text(encoding="utf-8"))
    missions = [DiscoveryMission.model_validate(item) for item in payload["missions"]]

    assert payload["schema_version"] == "1"
    assert 12 <= len(missions) <= 20
    assert any(mission.lane == DiscoveryLane.POTENTIAL for mission in missions)
    assert any(mission.lane == DiscoveryLane.MOMENTUM for mission in missions)

    mission_types = {mission.mission_type for mission in missions}
    for required in (
        "COMMON_BELIEF_CONTRADICTION",
        "WHY_EXPLAINER",
        "PROTECTIVE_VALUE",
        "STORY_BEHIND_THINGS",
        "HUMAN_STORY",
        "CULTURE_DISCOVERY",
        "REDISCOVERY",
        "OPEN_CURIOSITY",
        "ATTENTION_SURGE",
        "COMMUNITY_ACCELERATION",
        "CROSS_PLATFORM_SPREAD",
        "RESURFACING",
        "EMERGING_TECH_RELEVANCE",
        "COMMUNITY_FIRST_EVIDENCE_FOLLOWUP",
    ):
        assert required in mission_types

    community_followup = next(
        mission
        for mission in missions
        if mission.mission_type == "COMMUNITY_FIRST_EVIDENCE_FOLLOWUP"
    )
    assert SourceRole.DISCOVERY_SIGNAL in community_followup.required_source_roles
    assert SourceRole.AUDIENCE_SIGNAL in community_followup.required_source_roles
    assert SourceRole.EVIDENCE_SOURCE in community_followup.required_source_roles


def test_summary_keeps_potential_and_momentum_yields_separate() -> None:
    summary = summarize_provider_runs(
        "provider-a",
        [
            _run(run_id="p1", lane=DiscoveryLane.POTENTIAL, retrieved=20, opportunities=5),
            _run(run_id="m1", lane=DiscoveryLane.MOMENTUM, retrieved=10, opportunities=4),
        ],
    )

    assert summary.retrieved_count == 30
    assert summary.opportunity_count == 9
    assert summary.editorial_discovery_yield == 0.3
    assert summary.potential_discovery_yield == 0.25
    assert summary.momentum_discovery_yield == 0.4


def test_unavailable_and_zero_retrieval_are_not_faked_as_zero_yield() -> None:
    summary = summarize_provider_runs(
        "provider-a",
        [
            _run(
                run_id="u1",
                lane=DiscoveryLane.MOMENTUM,
                retrieved=0,
                opportunities=0,
                status=ProviderRunStatus.UNAVAILABLE,
            )
        ],
    )

    assert summary.unavailable_runs == 1
    assert summary.editorial_discovery_yield is None
    assert summary.momentum_discovery_yield is None


def test_provider_cost_stays_unavailable_when_no_provider_reports_cost() -> None:
    summary = summarize_provider_runs(
        "provider-a",
        [_run(run_id="p1", lane=DiscoveryLane.POTENTIAL, retrieved=3, opportunities=1)],
    )
    assert summary.total_cost_usd is None


def test_reported_costs_are_aggregated_without_inventing_missing_values() -> None:
    summary = summarize_provider_runs(
        "provider-a",
        [
            _run(
                run_id="p1",
                lane=DiscoveryLane.POTENTIAL,
                retrieved=3,
                opportunities=1,
                cost_usd=0.12,
            ),
            _run(
                run_id="m1",
                lane=DiscoveryLane.MOMENTUM,
                retrieved=4,
                opportunities=2,
                cost_usd=0.18,
            ),
        ],
    )
    assert summary.total_cost_usd == 0.3
