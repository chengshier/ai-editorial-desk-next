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
0.5B-E Human Editorial Acceptance                NOT_STARTED
0.5B-F Provider Decision + ADR                   NOT_STARTED
```

0.5B-C exact-head `23a7c6e61c30558f7e2c733c2e6796763cad38b1` 已由 CI #323 验证通过。

### 0.5B-A — Benchmark Contract + Mission Corpus

已建立：

- provider-agnostic `DiscoveryMission` / `ProviderRunRecord` / `ProviderBenchmarkSummary`；
- `ambient / potential / momentum / research` discovery lane；
- SourceRole / ProviderCapability / explicit unsupported-unavailable semantics；
- Editorial Discovery Yield、Potential Discovery Yield、Momentum Discovery Yield 独立统计；
- 17 条 mission corpus 的版本化 manifest；
- community-first → reliable evidence follow-up 的结构要求；
- deterministic mechanical tests。

本批只建立可比较的测量框架，不产出 Provider 胜负结论。

### 0.5B-B — No-key Baselines

已实现：

1. RSS/Atom Ambient baseline；
2. Hacker News official public API community/ranked snapshot baseline。

HN ranked list 只代表某一时点的社区排名快照；在没有跨时间快照历史前，不得伪装成 velocity / Trend feature。

### 0.5B-C — Key-gated Search / Fetch Adapters

已实现统一 Contract 下的候选：

- Exa semantic Search candidate；
- Firecrawl independent Fetch candidate；
- Tavily integrated Search+Fetch candidate。

API key 仅通过 server-side environment 注入，不进入 Product browser state、benchmark fixture 或 Git 历史；缺 key 时显式 `UNAVAILABLE`。单元测试使用 mock transport，不要求 secret。

候选实现只代表进入真实 benchmark 的工程资格，不代表 Provider 已选定。

### 0.5B-D — Real Provider Runs

当前进行中。必须真实执行可比预算的 missions，并保存 run 级记录：

```text
mission/version
lane
provider/version
query variants
source roles
retrieved/fetched/duplicate/failure counts
latency/cost
candidate provenance
Opportunity conversion
human 做 / 可能做 / 不做
```

本批新增两个关键约束：

1. Provider request 成功不等于 Mission 成功；必须把 Mission `required_source_roles` 与候选实际 `source_roles` 分开记录；
2. HN rank snapshot 即使请求成功，也不能自动满足 `TREND_SIGNAL`，除非后续有跨时间历史证明 velocity。

已加入：

- `MissionRunAssessment` / `assess_run_against_mission()`；
- `benchmarks/acquisition/run_no_key_baselines.py`；
- no-key live artifact 中的 source-role coverage 与缺失角色记录；
- `benchmarks/acquisition/run_keyed_search_fetch.py` 作为 keyed candidate runner。

`unsupported / unavailable / insufficient history` 必须原样记录，不能改成 0 分或空成功。

### 0.5B-E — Human Editorial Acceptance

至少抽取：

```text
5 个高 Momentum Discovery
5 个低/无 Momentum 但高 Potential Discovery
5 个 Community/Non-official first Discovery
5 个普通/失败 Discovery 负样本
```

人工验收回答：是否想看、是否会做、推荐去向、为什么，以及 community-first 是否能追到可靠 Evidence。

### 0.5B-F — Provider Decision + ADR

只有真实 benchmark + 人工验收完成后，才允许形成：

- Provider capability matrix；
- V1 provider 组合；
- fallback strategy；
- Legacy MediaCrawler 保留/退役范围；
- Community/Trend 合规边界；
- ADR。

## 当前工程内容

分支已加入：

```text
packages/acquisition/spike.py
packages/acquisition/providers/base.py
packages/acquisition/providers/rss.py
packages/acquisition/providers/hackernews.py
packages/acquisition/providers/exa.py
packages/acquisition/providers/firecrawl.py
packages/acquisition/providers/tavily.py
benchmarks/acquisition/mission_templates.v1.json
benchmarks/acquisition/run_keyed_search_fetch.py
benchmarks/acquisition/run_no_key_baselines.py
tests/test_acquisition_provider_spike.py
tests/test_acquisition_baseline_providers.py
tests/test_acquisition_keyed_providers.py
tests/test_acquisition_benchmark_runner.py
tests/test_acquisition_no_key_real_runner.py
```

这些 adapter / runner 都是 Spike 证据基础，不代表最终 Provider 选择。

## 当前 Real Run Gate

先完成两层真实数据：

```text
D1 no-key live baseline
→ HN ranked community snapshot
→ 配置的 RSS/Atom feeds
→ 保存 run + source-role assessment artifact

D2 keyed Search/Fetch live benchmark
→ Exa Search
→ Exa → Firecrawl independent fetch
→ Tavily Search+Fetch
→ 可比 Mission / result limit / provenance / latency / cost
```

D1 不需要用户 secret；D2 才需要合法 Provider API key。真实 benchmark artifact 产生以后才能进入 0.5B-E 人工编辑验收，不能在此之前根据返回数量宣告胜负。
