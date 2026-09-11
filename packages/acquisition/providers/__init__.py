"""Concrete Acquisition Provider adapters used by the Phase 0.5-B Spike."""

from .douyin import DouyinVideoSearchProvider
from .exa import ExaSearchProvider
from .firecrawl import FirecrawlFetchProvider
from .google_trends import GoogleTrendsRssProvider
from .hackernews import HackerNewsProvider
from .newsnow import NewsNowHotlistProvider
from .rss import RssFeedProvider
from .tavily import TavilySearchFetchProvider

__all__ = [
    "DouyinVideoSearchProvider",
    "ExaSearchProvider",
    "FirecrawlFetchProvider",
    "GoogleTrendsRssProvider",
    "HackerNewsProvider",
    "NewsNowHotlistProvider",
    "RssFeedProvider",
    "TavilySearchFetchProvider",
]
