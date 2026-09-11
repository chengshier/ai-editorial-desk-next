"""Concrete Acquisition Provider adapters used by the Phase 0.5-B Spike."""

from .hackernews import HackerNewsProvider
from .rss import RssFeedProvider

__all__ = ["HackerNewsProvider", "RssFeedProvider"]
