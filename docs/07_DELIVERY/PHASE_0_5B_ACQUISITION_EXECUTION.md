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
0.5B-A Benchmark Contract + Mission Corpus       IN_PROGRESS
0.5B-B No-key Baselines                           IN_PROGRESS
0.5B-C Key-gated Search / Fetch Adapters          NOT_STARTED
0.5B-D Real Provider Runs                         NOT_STARTED
0.5B-E Human Editorial Acceptance                 NOT_STARTED
0.5B-F Provider Decision + ADR                    NOT_STARTED
```

### 0.5B-A — Benchmark Contract + Mission Corpus

当前已建立：

- provider-agnostic `DiscoveryMission` / `ProviderRunRecord` / `ProviderBenchmarkSummary`；
- `ambient / potential / momentum / research` discovery lane；
- SourceRole / ProviderCapability / explicit unsupported-unavailable semantics；
- Editorial Discovery Yield、Potential Discovery Yield、Momentum Discovery Yield 独立统计；
- 12–20 条 mission corpus 的版本化 manifest；
- community-first → reliable evidence follow-up 的结构要求；
- deterministic mechanical tests。

本批只建立可比较的测量框架，不产出 Provider 胜负结论。

### 0.5B-B — No-key Baselines

优先实现无需用户提供 secret 的基线：

1. RSS/Atom Ambient baseline；
2. Hacker News official public API community/ranked snapshot baseline；
3. Legacy Platform-first controlled baseline（只读/受控样本，若可复用）。

HN ranked list 只代表某一时点的社区排名快照；在没有跨时间快照历史前，不得伪装成 velocity / Trend feature。

### 0.5B-C — Key-gated Search / Fetch Adapters

计划按统一 Contract 增加：

- semantic Search candidate；
- independent Fetch candidate；
- Search+Fetch integrated candidate。

API key 仅通过 server-side environment 注入，不能进入 Product browser state、benchmark fixture 或 Git 历史。单元测试使用 mock transport，不要求 secret。

真实 Provider 候选与价格/访问条件是时效信息，必须在进入真实 benchmark 前重新核对官方资料；候选实现不是冻结选型。

### 0.5B-D — Real Provider Runs

必须真实执行可比预算的 missions，并保存 run 级记录：

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

## 当前已完成工程内容

分支已加入：

```text
packages/acquisition/spike.py
packages/acquisition/providers/base.py
packages/acquisition/providers/rss.py
packages/acquisition/providers/hackernews.py
benchmarks/acquisition/mission_templates.v1.json
tests/test_acquisition_provider_spike.py
tests/test_acquisition_baseline_providers.py
```

其中 RSS/HN 仅是 baseline adapter，不代表最终 Provider 选择。

## 下一 Gate

当前先完成：

```text
0.5B-A/B exact-head CI
→ 修正 contract / lint / test 问题
→ 打开 Draft PR
→ 再进入 key-gated adapters
```

当真实 Search / Fetch benchmark 已准备好时，才需要用户提供对应 Provider API key。Google Trends/Reddit 等 access-gated capability 不作为整个 Spike 的阻塞项；没有合法访问条件时必须记为 `unavailable/access-gated`。
