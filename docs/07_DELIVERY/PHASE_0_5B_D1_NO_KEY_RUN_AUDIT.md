# Phase 0.5-B D1 No-key Live Run Audit

## 状态

`D1_HN_LIVE_RUN_AUDITED / RSS_OPTIONAL_BASELINE_NOT_RUN / D2_KEYED_RUN_PENDING`

本文件只记录经过人工审计后的摘要，不提交原始 `.local-benchmark/phase-0.5b-no-key.json`。

## 运行事实

真实运行时间：2026-09-11。

运行配置：

```text
provider: hackernews-official-topstories
mission_count: 17
max_results: 10
```

结果：

```text
17 个 Mission run
7 success
10 unsupported
0 unavailable
0 error
```

其中：

- Ambient：1 个 Mission，Provider transport success，required SourceRole 满足；
- Potential：10 个 Mission，全部显式 `unsupported`，没有把 HN ranked list 冒充 semantic search；
- Momentum：6 个 Mission，Provider transport success，但全部缺 `TREND_SIGNAL`；
- `momentum-emerging-tech-ordinary-relevance` 还同时缺 `EVIDENCE_SOURCE`；
- 因此 17 个 Mission 中只有 `ambient-known-source-updates` 的 required SourceRole coverage 为满足。

## 候选与重复

7 个 success run 共记录 70 个 candidate occurrence，但只有 10 个唯一 HN item / canonical URL；同一 `topstories` snapshot 被多个兼容 Mission 重复观察。

这不算数据错误，但说明：

1. HN topstories 是 mission-agnostic ranked snapshot，不应按 70 条独立 Discovery 计数；
2. 进入 Opportunity conversion / Human Acceptance 前必须跨 Mission 去重；
3. 未来如保留 HN baseline，可优化为一次 snapshot fetch + 多 Mission assessment，避免重复网络抓取与重复计数。

## 能力结论

本次真实运行支持以下判断：

```text
HN official topstories
= 可用 Community/Audience/Ambient discovery baseline
!= semantic Potential search
!= Trend velocity provider
!= Evidence provider
```

HN `score / descendants / rank` 只能保留为当前 snapshot metadata；没有跨时间快照历史时，不得升级为 `TREND_SIGNAL`。

## 内容质量观察

本次唯一候选集合中同时存在：

- 技术/产品发布；
- 工程实践与安全议题；
- 日常解释型内容；
- 科学/历史类素材；
- 质量与可信度明显需要进一步验证的二手内容。

因此 HN 适合做低成本“发现面”和 audience/community signal，但不能独立完成 Potential、Evidence 或 Momentum 的完整 Mission contract。

## D1 判定

```text
D1 runner / artifact structure          PASS
HN live connectivity / provenance       PASS
explicit unsupported semantics          PASS
SourceRole coverage separation          PASS
rank-not-velocity invariant             PASS
D1 HN baseline                          PASS WITH LIMITATIONS
RSS/Atom configured live baseline       NOT_RUN / NON_BLOCKING FOR D2
```

D1 的目标不是证明 HN 足够，而是验证 no-key baseline 能产生真实、可审计、不过度宣称的数据。该目标已经达到。

## 下一 Gate

D2 按最小成本分两步：

```text
D2-A
Exa semantic Search
vs
Tavily integrated Search+Fetch

D2-B
仅当 Exa Search 结果证明值得保留 Search-only seam 后，
再接 Firecrawl independent Fetch 做 Search → Fetch 解耦比较。
```

这样避免一开始同时申请三个 Key，也避免在 Search candidate 本身尚未通过真实数据验证前提前引入独立 Fetch 成本。
