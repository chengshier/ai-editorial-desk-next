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
mode              search-only

Tavily
status            success
retrieved         20
raw content       14 / 20
latency           8250 ms
credits           2
mode              integrated search+fetch

Firecrawl
status            unavailable (expected)
requested         3
fetched           0
reason            FIRECRAWL_API_KEY not configured
```

结论：Exa 和 Tavily 的真实 keyed transport 均可用；Firecrawl 未配置时保持 explicit `UNAVAILABLE`，没有被伪装成空 success。

## 2. Candidate 形态

### Exa

本次结果明显偏研究/论文/知识资料：PMC、ScienceDirect、SAGE、Nature、Springer、DOI 等占比较高。Search-only seam 没有返回正文，因此适合作为高精度发现候选，但后续若保留该 seam，需要独立 Fetch Provider 才能进入正文级 Research。

### Tavily

本次结果范围更宽，同时返回 snippet 与大量 raw content；来源混合了高校/科研、知识站、媒体，也包含 Quora、Chegg、Reddit、Facebook、YouTube 等较弱或社区型来源。它的 integrated Search+Fetch 能减少一次独立抓取步骤，但 candidate quality 更杂，需要 SourceRole / source-quality 分层，不能把 raw content availability 自动升级为 Evidence。

## 3. Mission fit

Mission contract 要求：

```text
DISCOVERY_SIGNAL
EVIDENCE_SOURCE
```

当前 Exa/Tavily v1 adapter 都只把 Search 返回标记为 `DISCOVERY_SIGNAL`。因此即使 transport `success`，本次 smoke 仍不能宣称 Mission required SourceRole 已满足；这符合 Contract：Search 命中不等于证据已确认。

## 4. 本次暴露并已修复的 benchmark 问题

### 4.1 `--fetch-limit` 不是 Search result limit

本次命令使用 `--fetch-limit 3`，但 Mission manifest 的 `max_results=20`，所以 Exa 与 Tavily 都实际返回 20 条。旧 runner 的 `fetch-limit` 只限制 Exa → Firecrawl 的独立 fetch URL 数量，不能限制 Search Provider result budget。

已修：新增 `--max-results`，可在不修改 versioned Mission manifest 的情况下临时收紧 Search budget。

### 4.2 Keyed artifact 缺少 SourceRole assessment

旧 keyed runner 没有像 D1 一样输出 Mission required/observed/missing SourceRole assessment。现已补齐 Exa / Tavily assessment，避免 transport success 被误读为 Mission success。

### 4.3 旧 smoke 只执行第一个 query seed

旧 smoke 生成时只执行第一条 query seed。现已改成：

```text
Mission max_results
→ 在所有 query_seeds 间分配预算
→ candidate 保留 query_variant provenance
→ 跨 query URL 去重
→ 总结果预算不超过 Mission cap
```

## 5. 后续 bounded run

本 smoke 后已完成 D2-A3 4 Mission bounded comparison，正式审计见：

`PHASE_0_5B_D2A_BOUNDED_RUN_AUDIT.md`

Bounded run 已证明 Exa Search-only seam 值得保留进入 D2-B，因此本 smoke 不再承担 Provider 方向决策。

## 6. 当前结论

```text
Exa keyed Search transport                 PASS
Tavily keyed Search+Fetch transport        PASS
Firecrawl missing-key semantics            PASS
Exa latency/cost observable                PASS
Tavily credit/raw-content observable       PASS
D2-A bounded comparison                    COMPLETE / PASS WITH LIMITATIONS
D2-B independent Fetch                     NEXT
Provider winner                            NOT DECIDED
Editorial Discovery Yield                  NOT YET MEASURED
Human acceptance                           NOT STARTED
```
