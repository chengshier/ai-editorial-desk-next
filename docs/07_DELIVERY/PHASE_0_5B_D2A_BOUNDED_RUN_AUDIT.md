# Phase 0.5-B D2-A Bounded Exa vs Tavily Audit

## 状态

`COMPLETE / PASS WITH LIMITATIONS`

本审计基于真实 keyed bounded artifact：

```text
missions                  4
max results / mission     3
query seeds / mission     2
Exa                       configured
Tavily                    configured
Firecrawl                 intentionally not configured
```

原始 `.local-benchmark/` artifact 不提交 Git；仓库只保留审计摘要。

## 1. Transport / Budget

```text
Exa
runs                       4 / 4 success
retrieved                  12 / 12
average latency            2889 ms
total observed cost        $0.056
mode                       search-only

Tavily
runs                       4 / 4 success
retrieved                  12 / 12
raw content available      9 / 12
average latency            5287 ms
total credits              16
mode                       integrated search+fetch

Firecrawl
status                     UNAVAILABLE by design
reason                     key not configured
```

`--max-results 3` 已正确限制 Search budget；两个 Provider 均对 Mission 的两个 `query_seeds` 执行请求，并保留 `query_variant` provenance。

## 2. Mission-level editorial observations

### potential-common-belief-contradiction

Exa 结果偏研究/知识来源，包含 PMC、Decision Lab 与具体 health-myth 研究；Tavily 同样能覆盖“信念面对反证”主题，并返回正文，但前两条仍偏抽象认知机制而非可直接形成选题的具体“常见认知反转”。

结论：multi-query 已增加具体 myth 方向，但 Mission query strategy 仍需要进一步面向“具体 claim / concrete case”收紧。

### potential-everyday-why

Exa 返回 `Why is water wet?`、日常现象解释集合等较直接的 explainer 候选，第三条 Substack 有一定偏题；Tavily 返回日常科学解释、教学内容和 YouTube 哲理内容，整体 editorial precision 较弱。

结论：本 Mission 上 Exa discovery quality 更好，但 Search-only 仍缺正文读取。

### potential-protective-scam

Exa 返回近期且具体的 AI-assisted executive impersonation / invoice fraud、Apple Pay text scam、AI shopping scam，时间性与保护价值都较强；其中 Microsoft Security Blog 具有较高后续 Primary/Evidence follow-up 价值。

Tavily 返回 vendor best-practice、PayPal press release、较宽泛的 post-pandemic fraud study，具备资料价值，但对“近期高保护价值 scam pattern”的直接命中弱于 Exa。

结论：本 Mission 上 Exa 明显更适合作为 discovery seam。

### potential-open-curiosity

Exa 返回围绕全球低频 `Hum` 的具体、近期、可追问候选，主题聚焦且可形成解释型内容；Tavily 结果更多是 generic YouTube listicle 与 Reddit question。

结论：本 Mission 上 Exa 的具体性、可研究性与编辑可塑性明显更强。

## 3. Search vs Fetch seam 观察

D2-A 已证明 Exa Search-only seam 值得保留进入下一 Gate：

- 4 个 bounded Mission 中，Exa 在 everyday-why、protective-scam、open-curiosity 三类任务上显示出更强的具体候选发现能力；
- Exa 平均 latency 更低，并且成本可直接观测；
- Exa 不返回正文，因此如果作为 V1 Search candidate，必须配独立 Fetch；
- Tavily integrated Search+Fetch 能减少一次独立抓取步骤，9/12 candidate 有 raw content，但 discovery precision 更杂；
- integrated raw content availability 不能自动等于 fetch correctness / Evidence。至少一条 Tavily 结果的 snippet/title 与实际 raw page 状态存在明显不一致（目标页已 moved/removed），因此仍需要正文可用性/来源质量校验。

因此 D2-B 条件成立：正式进入 `Exa Search → Firecrawl Fetch` 与 `Tavily Search+Fetch` 的比较。

## 4. SourceRole coverage

两个 Provider 当前 adapter 都只将搜索结果声明为 `DISCOVERY_SIGNAL`。

4 个 Mission 中：

```text
potential-common-belief-contradiction   missing EVIDENCE_SOURCE
potential-everyday-why                  missing EVIDENCE_SOURCE
potential-protective-scam               missing PRIMARY_SOURCE
potential-open-curiosity                required roles satisfied
```

这不是 Provider transport 失败，而是刻意保持 Contract：Search 命中、raw content 或 provider rank 都不能自动升级成 Confirmed Evidence / Primary Source。

D2-B Fetch 仍只验证正文获取 seam，不负责把来源自动升级为 Evidence。正式 SourceRole promotion 必须留到 Research / Verification 规则。

## 5. 当前允许的结论

```text
Exa bounded Search transport             PASS
Tavily bounded Search+Fetch transport     PASS
Multi-query provenance                   PASS
Search budget cap                        PASS
Exa Search-only seam worth retaining     YES / enter D2-B
Tavily integrated seam                   RETAIN AS COMPARATOR
Final Provider winner                    NOT DECIDED
Editorial Discovery Yield                NOT YET MEASURED
Human Editorial Acceptance               NOT STARTED
```

## 6. 下一 Gate

```text
D2-B
Exa Search → Firecrawl independent Fetch
vs
Tavily integrated Search+Fetch

then
0.5B-E Human Editorial Acceptance
→ 对真实候选做 Do / Maybe / Drop + rationale
→ 验证 Evidence follow-up 与 Editorial Advantage

then
0.5B-F Provider Decision + ADR
```

在 D2-B 与 Human Editorial Acceptance 前，不形成最终 Provider 选型。