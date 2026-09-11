"""Common execution seam for Phase 0.5-B provider adapters."""

from __future__ import annotations

from typing import Protocol

from packages.acquisition.spike import DiscoveryMission, ProviderDescriptor, ProviderRunRecord


class SpikeProvider(Protocol):
    """Provider adapter that can execute one Discovery Mission for benchmarking."""

    @property
    def descriptor(self) -> ProviderDescriptor:
        """Return stable provider identity and declared capabilities."""

    async def run(self, mission: DiscoveryMission) -> ProviderRunRecord:
        """Execute one mission and return an honest, normalized run record."""


def allocate_query_budgets(mission: DiscoveryMission) -> list[tuple[str, int]]:
    """Distribute one Mission result budget across its query variants without exceeding the cap."""

    seeds = [seed.strip() for seed in mission.query_seeds if seed.strip()]
    if not seeds:
        raise ValueError("mission must contain at least one non-empty query seed")
    quotient, remainder = divmod(mission.max_results, len(seeds))
    allocations: list[tuple[str, int]] = []
    for index, seed in enumerate(seeds):
        budget = quotient + (1 if index < remainder else 0)
        if budget > 0:
            allocations.append((seed, budget))
    return allocations
