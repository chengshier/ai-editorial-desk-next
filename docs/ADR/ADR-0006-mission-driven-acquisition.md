# ADR-0006 — Mission-driven Acquisition

## Status
Accepted

## Decision
Next 的 Acquisition Core 采用：

```text
Mission-driven Discovery
+ Search-first
+ Ambient Feed
+ Potential Scouting
+ Momentum Radar
+ Targeted Retrieval
+ Targeted Platform Research
```

固定平台爬虫不再作为系统核心入口；Legacy MediaCrawler 若复用，仅作为 PlatformProvider / Adapter 的一种实现。

**热度不是进入 Discovery 的前置条件。** Acquisition 必须同时支持：

1. `Potential-driven Discovery`：尚未明显升温，但内容本身有趣、有用、反常识、有故事性、保护价值、再解释价值或其他编辑潜力；
2. `Momentum-driven Discovery`：搜索、社区、平台或跨平台注意力正在快速变化。

任何一条 lane 都可以独立形成 Discovery。

## Rationale
旧版 Platform-first 模式容易先限定平台和关键词，再期待高价值内容自然出现；单纯 Momentum-first 又会把“热”误当成“值”。新 Editorial Core 需要同时发现热点、反常识、科普、人物、文化、实用、安全、Rediscovery、开放好奇等不同机会，因此采集策略必须由 Editorial Mission 驱动，并把 Attention 与 Editorial Value 分开。

同时，非官方来源（如 Reddit/论坛/社区）可以是重要的 Discovery / Audience / Trend Signal，但不能因此自动升级为 Confirmed Evidence。发现来源与事实证据来源必须分层。

## Consequences
- 定义 Search/Fetch/Feed/Platform/Trend Provider seam。
- Acquisition run 标记 `ambient / potential / momentum / research` discovery lane。
- RawSignal / AcquisitionResult 保存 source role 与 acquisition provenance。
- 采集验收引入 Editorial Discovery Yield，并分别观察 Potential/Momentum Discovery Yield，而不是只看抓取条数或热点命中。
- `Trend unavailable` 不等于 `Editorial Value low`。
- 具体 Provider 供应商通过 Spike 决定，不在本 ADR 锁定。
