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
0.5B-D Real Provider Runs                        COMPLETE / PASS WITH LIMITATIONS
  D1 HN no-key live baseline                     COMPLETE / PASS WITH LIMITATIONS
  D1 RSS/Atom configured live baseline           NOT_RUN / NON-BLOCKING
  D2-A Exa vs Tavily keyed real run              COMPLETE / PASS WITH LIMITATIONS
  D2-B Exa → Firecrawl vs Tavily                 COMPLETE / PASS WITH LIMITATIONS
  D3 Google Trends Momentum baseline             COMPLETE / PASS WITH LIMITATIONS
0.5B-E Human Editorial Acceptance                IN_PROGRESS
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

D2-B 暴露的工程项已进入 adapter hardening：per-URL non-secret failure provenance；Firecrawl usage/cost 未观测到时保持 null，不伪装成 0。

审计摘要见 `PHASE_0_5B_D2B_FIRECRAWL_RUN_AUDIT.md`。

#### D3 — Momentum real baseline

Google Trends public RSS real run 已完成：

```text
provider                   google-trends-rss-us
geo                        US
momentum missions          6
transport success          1
explicit unsupported       5
retrieved                  10
required SourceRole PASS   1 / 6
```

`momentum-search-attention-surge` 真实返回 10 条候选并满足：

```text
TREND_SIGNAL + DISCOVERY_SIGNAL
```

其余 5 个 Momentum mission shape 因单 snapshot 无法证明 community acceleration / cross-platform spread / culture-only breakout / resurfacing history / emerging-tech evidence coverage，保持 explicit `UNSUPPORTED`。

D3 还暴露 `geo=US` 仍可能出现语言/地域噪声，说明 Trend Provider 只能提供 attention feature，仍需要 Human Acceptance 判断真正编辑价值。

同时修复 provenance：Google Trends RSS `pubDate` 是 trend observation time，不再写入 candidate source `published_at`，而是保存在 `provider_metadata.trend_observed_at`。

审计摘要见 `PHASE_0_5B_D3_GOOGLE_TRENDS_RUN_AUDIT.md`。

至此 0.5B-D 最低真实 Gate 完成：Potential、Search/Fetch、Community baseline 与至少一个真实 `TREND_SIGNAL` seam 均已有 artifact。

### 0.5B-E — Human Editorial Acceptance

当前正式进入人工验收。固定抽取：

```text
5 Momentum Discovery
5 low/no-Momentum Potential Discovery
5 Community/Non-official-first Discovery
5 Control / ordinary / lower-precision samples
```

已新增 `benchmarks/acquisition/build_human_acceptance_packet.py`，从 D1 / D2-B / D3 本地 artifact 构建 20 条去重平衡样本。每条必须由人类填写：

```text
DO / MAYBE / DROP
would_read
would_make
placement
rationale
evidence_followup_needed
```

采样信号只用于平衡 packet，不是 Editorial Value。完整协议见 `PHASE_0_5B_E_HUMAN_ACCEPTANCE_PROTOCOL.md`。

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
benchmarks/acquisition/build_human_acceptance_packet.py
docs/07_DELIVERY/PHASE_0_5B_D1_NO_KEY_RUN_AUDIT.md
docs/07_DELIVERY/PHASE_0_5B_D2A_KEYED_SMOKE_AUDIT.md
docs/07_DELIVERY/PHASE_0_5B_D2A_BOUNDED_RUN_AUDIT.md
docs/07_DELIVERY/PHASE_0_5B_D2B_FIRECRAWL_RUN_AUDIT.md
docs/07_DELIVERY/PHASE_0_5B_D3_GOOGLE_TRENDS_RUN_AUDIT.md
docs/07_DELIVERY/PHASE_0_5B_E_HUMAN_ACCEPTANCE_PROTOCOL.md
```

以及对应 contract / runner / adapter tests。

## 当前 Gate

当前 Gate 是 0.5B-E：从三份真实本地 artifact 构建 20 条 Human Editorial Acceptance packet，并完成人工 Do / Maybe / Drop 与理由标注。人工验收完成后，才进入 0.5B-F Provider Decision + ADR。
