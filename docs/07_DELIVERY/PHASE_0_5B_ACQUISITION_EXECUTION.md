# Phase 0.5-B Acquisition Provider Spike — Execution

## 状态

`IN_PROGRESS`

起点：PR #16 已以 merge commit `609d0bbc1bef0992d61b9f7e2e02871755f6e223` 合并到 `main`。本阶段从该 exact main head 新建：

```text
spike/phase-0.5b-acquisition-providers
```

本阶段不是继续扩充 Harness/S4，也不是直接实现最终 Acquisition Network；目标是用真实 Discovery Missions 选出 V1 Provider 组合，并建立可重复的 benchmark 证据。

## 不变 Contract

依据：

- `../03_ARCHITECTURE/ACQUISITION_ARCHITECTURE.md`
- `../04_CONTRACTS/ACQUISITION_PROVIDER_CONTRACT.md`
- `../ADR/ADR-0006-mission-driven-acquisition.md`
- `ACQUISITION_PROVIDER_SPIKE.md`

必须保持：

```text
Mission-driven Discovery
+ Ambient Feed Sensing
+ Potential Scouting
+ Momentum Radar
+ Search-first Acquisition
+ Targeted Retrieval
+ Targeted Platform Research
```

热度不是进入 Discovery 的硬门槛；Provider score / rank / trend score 不能直接等于 Editorial Value。HumanSubmission 是产品自身的一等 ingress，不参加外部 Provider 胜负比较。

## 执行批次

```text
0.5B-A Benchmark Contract + Mission Corpus       COMPLETE / CI PASS
0.5B-B No-key Baselines                          COMPLETE / CI PASS
0.5B-C Key-gated Search / Fetch Adapters         COMPLETE / CI PASS
0.5B-D Real Provider Runs                        IN_PROGRESS
  D1 HN no-key live baseline                     COMPLETE / PASS WITH LIMITATIONS
  D1 RSS/Atom configured live baseline           NOT_RUN / NON-BLOCKING
  D2-A Exa vs Tavily keyed real run              COMPLETE / PASS WITH LIMITATIONS
  D2-B Exa → Firecrawl vs Tavily                 COMPLETE / PASS WITH LIMITATIONS
  D3 Google Trends Momentum baseline             IN_PROGRESS
0.5B-E Human Editorial Acceptance                NOT_STARTED
0.5B-F Provider Decision + ADR                   NOT_STARTED
```

0.5B-C exact-head `23a7c6e61c30558f7e2c733c2e6796763cad38b1` 已由 CI #323 验证通过；D1 runner / SourceRole coverage 已由 CI #341 验证通过；D2-A multi-query / bounded runner hardening 已由 CI #357 验证通过；D2-A/D2-B 文档收口前一轮 CI #362 已通过。

### 0.5B-A — Benchmark Contract + Mission Corpus

已建立 provider-agnostic `DiscoveryMission` / `ProviderRunRecord` / `ProviderBenchmarkSummary`、`ambient / potential / momentum / research` lane、SourceRole / ProviderCapability、explicit unsupported-unavailable semantics、Editorial/Potential/Momentum Discovery Yield、17 条版本化 mission corpus，以及 community-first → reliable evidence follow-up 结构要求。

### 0.5B-B — No-key Baselines

已实现 RSS/Atom Ambient baseline 与 Hacker News official public API ranked community snapshot baseline。HN ranked list 只代表某一时点的社区排名快照；没有跨时间快照历史时不得伪装成 velocity / Trend feature。

### 0.5B-C — Key-gated Search / Fetch Adapters

已实现：

- Exa semantic Search candidate；
- Firecrawl independent Fetch candidate；
- Tavily integrated Search+Fetch candidate。

API key 仅通过 server-side environment 注入；缺 key 时显式 `UNAVAILABLE`。工程完成不代表 Provider 已选定。

### 0.5B-D — Real Provider Runs

#### D1 — HN baseline

真实 HN D1 artifact 已完成审计，摘要见 `PHASE_0_5B_D1_NO_KEY_RUN_AUDIT.md`。

```text
17 Mission runs
7 transport success
10 explicit unsupported
1/17 required SourceRole coverage satisfied
70 candidate occurrences
10 unique HN items
```

结论：HN 适合作为 Community/Audience/Ambient discovery baseline，但不能独立承担 semantic Potential search、Trend velocity 或 Evidence provider。

#### D2-A — Exa vs Tavily

已完成单 Mission smoke 与 4 Mission bounded run。Bounded run 每 Mission `max_results=3`，执行全部 query seeds 并保留 `query_variant` provenance。

```text
Exa
4 / 4 success
12 / 12 retrieved
avg latency ~2889 ms
observed cost $0.056
search-only

Tavily
4 / 4 success
12 / 12 retrieved
9 / 12 raw content available
avg latency ~5287 ms
16 credits
integrated search+fetch
```

人工审计显示：在 everyday-why、protective-scam、open-curiosity 三类 Mission 上，Exa 的候选更具体、更接近后续 Research / Editorial Opportunity；因此 Exa Search-only seam 值得保留进入 D2-B。审计摘要见：

- `PHASE_0_5B_D2A_KEYED_SMOKE_AUDIT.md`
- `PHASE_0_5B_D2A_BOUNDED_RUN_AUDIT.md`

#### D2-B — Exa → Firecrawl vs Tavily

真实 bounded run 已完成：

```text
Exa Search
4 / 4 success
12 / 12 retrieved
avg latency ~3642 ms
observed cost $0.056

Firecrawl Fetch
4 probes
3 success + 1 partial
12 requested
10 fetched
2 failed
fetch coverage 83.3%
avg probe latency ~10028 ms

Tavily integrated
4 / 4 success
12 / 12 retrieved
8 / 12 raw content available
avg latency ~2321 ms
16 credits
```

Firecrawl 成功覆盖研究论文/PMC、大学站点、安全厂商、媒体与 Substack；open-curiosity 一组仅 1/3 成功，证明 independent Fetch 有真实可用性，也有必须保留的失败边界。

结论：

```text
Exa → Firecrawl chain    PASS WITH LIMITATIONS
Tavily integrated seam   RETAIN AS COMPARATOR/FALLBACK
final provider winner    NOT DECIDED
```

D2-B 还暴露两个工程项：

- Firecrawl v1 旧 artifact 只有 `failure_count`，没有每 URL 失败原因；adapter 已开始硬化为保存 non-secret `url/error_kind/http_status`；
- Firecrawl usage/cost 本轮为 unavailable，必须保持 null，不能当 0。

审计摘要见 `PHASE_0_5B_D2B_FIRECRAWL_RUN_AUDIT.md`。

#### D3 — Momentum real baseline

原始 Spike Gate 明确要求同时验证“正在快速获得注意力”与“低/无 Momentum 但高 Potential”。D1 已证明 HN rank 不是 velocity，因此 D2-B 完成后仍不能直接结束 0.5B-D。

下一步增加 no-key Google Trends public RSS/Trending Now baseline：

```text
Google Trends recent search surge
→ TREND_SIGNAL + DISCOVERY_SIGNAL
→ generic ATTENTION_SURGE only
→ other momentum mission shapes explicit UNSUPPORTED
```

已新增 `GoogleTrendsRssProvider` 与 `run_momentum_baseline.py`。该 Provider 只把 Google 报告的近期搜索 surge 作为 trend feature；approx traffic、rank 与 related news 都不等于 Editorial Value / Confirmed Evidence。

### 0.5B-E — Human Editorial Acceptance

至少抽取：

```text
5 个高 Momentum Discovery
5 个低/无 Momentum 但高 Potential Discovery
5 个 Community/Non-official first Discovery
5 个普通/失败 Discovery 负样本
```

人工验收回答：是否想看、是否会做、推荐去向、为什么，以及 community-first 是否能追到可靠 Evidence。

D2 的 Potential 候选已经足够进入 acceptance input；完整 E 仍需等待 D3 产生真实 Momentum 样本。

### 0.5B-F — Provider Decision + ADR

只有真实 benchmark + 人工验收完成后，才允许形成 Provider capability matrix、V1 provider 组合、fallback strategy、Legacy MediaCrawler 保留/退役范围、Community/Trend 合规边界与 ADR。

## 当前工程内容

当前分支已包含：

```text
packages/acquisition/spike.py
packages/acquisition/providers/rss.py
packages/acquisition/providers/hackernews.py
packages/acquisition/providers/google_trends.py
packages/acquisition/providers/exa.py
packages/acquisition/providers/firecrawl.py
packages/acquisition/providers/tavily.py
benchmarks/acquisition/mission_templates.v1.json
benchmarks/acquisition/run_keyed_search_fetch.py
benchmarks/acquisition/run_no_key_baselines.py
benchmarks/acquisition/run_momentum_baseline.py
docs/07_DELIVERY/PHASE_0_5B_D1_NO_KEY_RUN_AUDIT.md
docs/07_DELIVERY/PHASE_0_5B_D2A_KEYED_SMOKE_AUDIT.md
docs/07_DELIVERY/PHASE_0_5B_D2A_BOUNDED_RUN_AUDIT.md
docs/07_DELIVERY/PHASE_0_5B_D2B_FIRECRAWL_RUN_AUDIT.md
```

以及对应 contract / runner / adapter tests。

## 当前 Real Run Gate

下一 Gate 是 D3：先让 Google Trends public RSS baseline 在 `momentum-search-attention-surge` 上产生真实、可审计的 `TREND_SIGNAL` artifact；其他它不能证明的 Momentum Mission 必须明确 `UNSUPPORTED`。D3 通过后才进入完整 0.5B-E Human Editorial Acceptance。
