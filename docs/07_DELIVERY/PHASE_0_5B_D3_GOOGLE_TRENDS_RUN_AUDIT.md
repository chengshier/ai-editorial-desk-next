# Phase 0.5-B D3 Google Trends Momentum Audit

## 状态

`COMPLETE / PASS WITH LIMITATIONS`

本审计基于真实 no-key artifact：

```text
provider                   google-trends-rss-us
geo                        US
momentum missions          6
transport success          1
explicit unsupported       5
retrieved                  10
required SourceRole PASS   1 / 6
```

原始 `.local-benchmark/` artifact 不提交 Git；仓库只保留审计摘要。

## 1. 真正跑通的 Momentum seam

`momentum-search-attention-surge` 真实返回 10 个 Google Trending Now / RSS topic，候选同时声明：

```text
TREND_SIGNAL
DISCOVERY_SIGNAL
```

该 Mission 的 required SourceRole 已完整满足。

真实候选包含天气/灾害、影视人物、政治事件、网络故障、疫苗、电视媒介、剧集、园艺等不同主题，说明该 surface 确实能够提供“当前正在快速获得搜索注意力”的跨主题发现面，而不是固定科技榜单。

Google 返回的 `approx_traffic` 只作为近似 attention feature；rank、traffic 与 RSS inclusion 都不等于 Editorial Value。

## 2. UNSUPPORTED 边界是正确结果

以下 5 个 Momentum Mission 全部显式 `UNSUPPORTED`：

```text
momentum-rising-culture-object
momentum-community-acceleration
momentum-cross-platform-spread
momentum-resurfacing-old-content
momentum-emerging-tech-ordinary-relevance
```

原因不是网络失败，而是单个 Google Trends RSS snapshot 无法证明：

- community discussion acceleration；
- cross-platform spread；
- culture-only breakout；
- old-content resurfacing history；
- emerging-tech 的 Evidence coverage。

因此 D3 没有把“Google 搜索正在升温”伪装成它没有观测到的 velocity/history/community/evidence 能力。

## 3. 真实数据暴露的质量边界

D3 也暴露了 Human Acceptance 必须验证的噪声问题：

- 高 traffic 不代表适合本编辑部；
- 同一 snapshot 同时包含强公共信息、娱乐、日常消费和低编辑价值主题；
- `geo=US` 仍可能出现语言/地域不一致的 topic，例如韩文天气条目；
- related-news URL 是 Google 给出的 supporting discovery refs，不自动成为 Confirmed Evidence；
- Google feed 的 `pubDate` 表示 trend item / feed observation time，不是相关外部文章的可靠 source publication time。

最后一点已触发 adapter hardening：`AcquisitionCandidate.published_at` 不再错误承载 Google Trends feed `pubDate`；该时间改存为 `provider_metadata.trend_observed_at`。

## 4. 对 Phase 0.5-B Gate 的意义

原始 Spike 要同时验证：

```text
Potential discovery
+ Momentum discovery
```

当前已经有：

```text
Potential
→ Exa semantic Search
→ Firecrawl independent Fetch
→ Tavily integrated comparator

Momentum
→ Google Trends real TREND_SIGNAL baseline

Community / Ambient
→ HN official ranked snapshot baseline
```

因此 0.5B-D 的最低真实 Provider Gate 已满足，可以结束 Real Provider Runs，并进入 0.5B-E Human Editorial Acceptance。

注意：这不代表所有 Momentum 子类型都已被生产级覆盖。Google Trends v1 只是 generic search-attention baseline；community acceleration、cross-platform spread、resurfacing 等 capability 仍是后续 Provider/Platform Research 的明确缺口。

## 5. 当前允许的结论

```text
Google Trends no-key transport             PASS
Generic search-attention TREND_SIGNAL      PASS
Required SourceRole for ATTENTION_SURGE    PASS
Other Momentum mission shapes              EXPLICIT UNSUPPORTED
Trend != Editorial Value boundary          PASS
Potential lane real evidence               SUFFICIENT
Momentum lane real evidence                SUFFICIENT FOR HUMAN ACCEPTANCE INPUT
0.5B-D overall                             COMPLETE / PASS WITH LIMITATIONS
Final Provider winner                      NOT DECIDED
```

## 6. 下一 Gate

进入 `0.5B-E Human Editorial Acceptance`：

```text
5 Momentum Discovery
5 low/no-Momentum Potential Discovery
5 Community/Non-official-first Discovery
5 control / ordinary / low-precision samples
→ human Do / Maybe / Drop
→ would-read / would-make
→ placement
→ rationale
→ Evidence follow-up need
```

只有 Human Acceptance 完成后，才允许进入 0.5B-F Provider Decision + ADR。
