# Phase 0.5-B D2-B Exa → Firecrawl vs Tavily Audit

## 状态

`COMPLETE / PASS WITH LIMITATIONS`

本审计基于真实 keyed D2-B artifact：

```text
missions                  4
max results / mission     3
query seeds / mission     2
Exa                       configured
Firecrawl                 configured
Tavily                    configured
```

原始 `.local-benchmark/` artifact 不提交 Git；仓库只保留审计摘要。

## 1. Transport / Fetch 结果

```text
Exa Search
runs                       4 / 4 success
retrieved                  12 / 12
average latency            ~3642 ms
total observed cost        $0.056
mode                       search-only

Firecrawl independent Fetch
probes                     4
success probes             3
partial probes             1
requested URLs             12
fetched documents          10
failed URLs                2
fetch coverage             83.3%
average probe latency      ~10028 ms
total probe latency        ~40113 ms
observed credits/cost      unavailable in v1 artifact

Exa + Firecrawl
approx average mission e2e ~13670 ms
search quality             inherited from Exa bounded run
fetch body availability    10 / 12

Tavily integrated Search+Fetch
runs                       4 / 4 success
retrieved                  12 / 12
raw content available      8 / 12
average latency            ~2321 ms
total credits              16
```

这里必须区分：Tavily 的 `fetched_count/raw_content` 与 Firecrawl 的独立 URL fetch 不是完全同义指标；它们用于工程 seam 对照，不能直接当成 Evidence 成功率。

## 2. Firecrawl 正文获取质量

Firecrawl 已证明独立 Fetch seam 在真实候选上可工作：

- common-belief-contradiction：3/3，成功读取 DOI/SAGE 与两条 PMC 长正文；
- everyday-why：3/3，成功读取 Science Sparks、UTA 与 Substack；
- protective-scam：3/3，成功读取 Microsoft Security、CyberInk 与 ACI Worldwide；
- open-curiosity：1/3，仅 ScienceAlert 成功；另外两条 URL 失败。

成功文档均返回非空 Markdown；其中 DOI 可跟随到实际期刊页面，证明 canonical/redirect fetch 基本成立。

因此 `Exa Search → Firecrawl Fetch` 不是概念链路，而是已经用真实 URL 跑通。

## 3. 发现质量与工程成本

D2-A 已证明 Exa 在 everyday-why、protective-scam、open-curiosity 三类 Mission 上的候选更具体、更接近后续 Research 输入；D2-B 进一步证明这些候选大多数能够由 Firecrawl 读取正文。

优势：

- Search / Fetch 解耦，可独立替换；
- Exa 的 discovery precision 得以保留；
- 12 个真实候选中 10 个得到正文；
- 对研究论文、大学页面、安全厂商与一般媒体均能工作。

成本/风险：

- 端到端 latency 明显高于 Tavily integrated seam；
- 当前 Firecrawl v1 artifact 未拿到 credits/cost；
- open-curiosity 出现 2/3 URL fetch failure；
- v1 adapter 只累计 `failure_count`，没有保留每个失败 URL 的原因，观测性不足。

因此 Firecrawl 可以进入 V1 候选，但必须保留 Tavily 作为低复杂度 comparator/fallback，最终取舍留到 Human Acceptance 后。

## 4. Fetch ≠ Evidence

D2-B 只证明正文 acquisition seam：

```text
Search candidate
→ target URL
→ Fetch body
```

它不负责把 `DISCOVERY_SIGNAL` 自动提升为：

```text
EVIDENCE_SOURCE
PRIMARY_SOURCE
CONFIRMED FACT
```

是否成为 Evidence/Primary Source 必须由后续 Research / Verification 根据来源身份、原始性、时间、交叉验证等规则判断。

## 5. D2-B 暴露的工程硬化项

### 5.1 Per-URL failure provenance

当前 `FirecrawlFetchProvider` 捕获 HTTP / response / empty-markdown 错误后只累计 `failure_count`。本轮 open-curiosity 的 2 个失败无法从 artifact 判断具体原因。

后续 adapter 应在 `provider_metadata` 中记录不含 secret 的失败摘要：

```text
url
error_kind
http_status（若有）
```

不得记录 API key、Authorization header 或第三方敏感响应体。

### 5.2 Cost / credit observability

本轮 `credits_used` 为 unavailable。Provider decision 前需要保持“未知就是未知”，不能把 null 当 0 成本；若 Firecrawl response/账户侧可稳定提供 usage，再接入 benchmark。

## 6. Spike 完整性检查：Momentum 仍未闭环

D2-B 完成后，Potential/Search/Fetch seam 已有真实证据，但 Phase 0.5-B 原始 Gate 明确要求同时验证：

1. 正在快速获得注意力的内容；
2. 尚未明显升温但有编辑潜力的内容。

D1 已证明 Hacker News ranked snapshot 不能提供真实 velocity / `TREND_SIGNAL`。因此不能直接把整个 0.5B-D 标记 COMPLETE，也不能直接进入最终 Provider Decision。

下一 Gate 新增为：

```text
D3 Momentum real baseline
→ Google Trends Trending Now / RSS public trend signal
→ explicit TREND_SIGNAL semantics
→ unsupported missions remain explicit
→ real run + audit
```

Google Trends 只提供 attention/trend feature，不提供 Editorial Value；RSS/Trending rank、search volume、related news 均不得直接升级为 Opportunity。

## 7. 当前允许的结论

```text
Exa Search quality                         PASS WITH LIMITATIONS
Firecrawl independent Fetch seam           PASS WITH LIMITATIONS
Exa → Firecrawl real chain                 PASS
Tavily integrated comparator               RETAIN
Firecrawl final selection                  NOT DECIDED
Tavily final selection                     NOT DECIDED
Potential lane real evidence               SUFFICIENT FOR HUMAN ACCEPTANCE INPUT
Momentum lane real evidence                NOT YET SUFFICIENT
0.5B-D overall                             IN_PROGRESS
```

## 8. 下一 Gate

```text
D3 Momentum real baseline
→ then 0.5B-E Human Editorial Acceptance
→ then 0.5B-F Provider Decision + ADR
```

在 Momentum lane 与 Human Acceptance 完成前，不形成最终 V1 Provider 组合。
