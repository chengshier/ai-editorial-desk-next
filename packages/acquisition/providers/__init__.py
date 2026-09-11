"""Concrete Acquisition Provider adapters used by the Phase 0.5-B Spike."""

from .exa import ExaSearchProvider
from .firecrawl import FirecrawlFetchProvider
from .google_trends import GoogleTrendsRssProvider
from .hackernews import HackerNewsProvider
from .rss import RssFeedProvider
from .tavily import TavilySearchFetchProvider

__all__ = [
    "ExaSearchProvider",
    "FirecrawlFetchProvider",
    "GoogleTrendsRssProvider",
    "HackerNewsProvider",
    "RssFeedProvider",
    "TavilySearchFetchProvider",
]
