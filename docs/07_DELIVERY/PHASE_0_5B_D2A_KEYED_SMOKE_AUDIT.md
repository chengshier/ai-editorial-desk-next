# Phase 0.5-B D2-A Exa vs Tavily Keyed Smoke Audit

## 状态

`SMOKE_COMPLETE / PASS WITH LIMITATIONS`

本审计基于一次真实、单 Mission 的 keyed smoke artifact：

```text
mission: potential-common-belief-contradiction
Exa: configured
Tavily: configured
Firecrawl: intentionally not configured
```

原始 `.local-benchmark/` artifact 不提交 Git；仓库只保留人工审计摘要。

## 1. Transport / Cost / Fetch 结果

```text
Exa
status            success
retrieved         20
fetched           0
latency           2139 ms
cost              $0.017
mode               search-only

Tavily
status            success
retrieved         20
raw content       14 / 20
latency           8250 ms
credits           2
mode               integrated search+fetch

Firecrawl
status            unavailable (expected)
requested         3
fetched           0
reason             FIRECRAWL_API_KEY not configured
```

结论：Exa 和 Tavily 的真实 keyed transport 均可用；Firecrawl 未配置时保持 explicit `UNAVAILABLE`，没有被伪装成空 success。

## 2. Candidate 形态

### Exa

本次结果明显偏研究/论文/知识资料：PMC、ScienceDirect、SAGE、Nature、Springer、DOI 等占比较高。Search-only seam 没有返回正文，因此适合作为高精度发现候选，但后续若保留该 seam，需要独立 Fetch Provider 才能进入正文级 Research。

### Tavily

本次结果范围更宽，同时返回 snippet 与大量 raw content；来源混合了高校/科研、知识站、媒体，也包含 Quora、Chegg、Reddit、Facebook、YouTube 等较弱或社区型来源。它的 integrated Search+Fetch 能减少一次独立抓取步骤，但 candidate quality 更杂，需要 SourceRole / source-quality 分层，不能把 raw content availability 自动升级为 Evidence。

两者 20 条结果只出现少量直接 URL 重合，说明 discovery surface 有明显差异；单个 Provider 的返回数量不能作为最终胜负依据。

## 3. Mission fit

Mission contract 要求：

```text
DISCOVERY_SIGNAL
EVIDENCE_SOURCE
```

当前 Exa/Tavily v1 adapter 都只把 Search 返回标记为 `DISCOVERY_SIGNAL`。因此即使 transport `success`，本次 smoke 仍不能宣称 Mission required SourceRole 已满足；这符合 Contract：Search 命中不等于证据已确认。

## 4. 本次暴露的 benchmark 问题

### 4.1 `--fetch-limit` 不是 Search result limit

本次命令使用 `--fetch-limit 3`，但 Mission manifest 的 `max_results=20`，所以 Exa 与 Tavily 都实际返回 20 条。旧 runner 的 `fetch-limit` 只限制 Exa → Firecrawl 的独立 fetch URL 数量，不能限制 Search Provider result budget。

这会让“低成本 3 条 smoke”产生误导，因此已修：

```text
新增 --max-results
→ 可在不修改 versioned mission manifest 的情况下临时收紧每个 Mission result budget
```

### 4.2 Keyed artifact 缺少 SourceRole assessment

旧 keyed runner 没有像 D1 一样输出 Mission required/observed/missing SourceRole assessment。本轮已补齐 Exa / Tavily assessment，避免 transport success 被误读为 Mission success。

### 4.3 当前只执行第一个 query seed

`potential-common-belief-contradiction` 有两个 query seeds，但 Exa/Tavily v1 adapter 当前只执行第一条：

```text
common belief contradicted by evidence
```

本次结果因此更多集中在“人为何坚持错误信念/信念如何面对证据”这一抽象主题，而不是稳定发现“具体大众常见认知被可靠证据推翻”的可编辑案例。

这说明本次 smoke 足以验证 Provider transport / output shape，但不足以据此决定 Editorial Discovery Quality。Multi-query / query-strategy hardening 必须在全量 D2-A benchmark 前单独收口。

## 5. 阶段结论

当前只允许得出：

```text
Exa keyed Search transport                 PASS
Tavily keyed Search+Fetch transport         PASS
Firecrawl missing-key semantics             PASS
Exa latency/cost observable                 PASS
Tavily credit/raw-content observable        PASS
Provider winner                             NOT DECIDED
Editorial Discovery Yield                   NOT YET MEASURED
Human acceptance                            NOT STARTED
```

## 6. 下一 Gate

```text
D2-A1 runner budget + SourceRole hardening
→ COMPLETE in code, awaiting CI

D2-A2 query-strategy hardening
→ make query variants explicit and comparable

D2-A3 bounded real comparison
→ small curated Mission set
→ same result budget
→ Exa vs Tavily
→ dedupe + provenance + latency/cost

D2-B independent Fetch
→ only if Exa Search seam remains competitive
→ then evaluate Firecrawl
```

在 D2-A3 与 Human Editorial Acceptance 前，不做 Provider 胜负结论。
