# ADR-0006 — Mission-driven Acquisition

## Status
Accepted

## Decision
Next 的 Acquisition Core 采用 `Mission-driven Discovery + Search-first + Ambient Feed + Targeted Retrieval + Targeted Platform Research`。

固定平台爬虫不再作为系统核心入口；Legacy MediaCrawler 若复用，仅作为 PlatformProvider / Adapter 的一种实现。

## Rationale
旧版 Platform-first 模式容易先限定平台和关键词，再期待高价值内容自然出现；新 Editorial Core 需要发现热点、反常识、科普、人物、文化、实用、安全、Rediscovery 等不同机会，因此采集策略必须由 Editorial Mission 驱动。

## Consequences
- 定义 Search/Fetch/Feed/Platform Provider seam。
- RawSignal 必须保存 acquisition provenance。
- 采集验收引入 Editorial Discovery Yield，而不是只看抓取条数。
- 具体 Provider 供应商通过 Spike 决定，不在本 ADR 锁定。