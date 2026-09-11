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
