# Phase 0.5-B Acquisition Provider Spike — Execution

## 状态

`IN_PROGRESS / E5 PLATFORM + CONTEXT ENRICHMENT`

起点：PR #16 已以 merge commit `609d0bbc1bef0992d61b9f7e2e02871755f6e223` 合并到 `main`。本阶段从该 exact main head 新建：

```text
spike/phase-0.5b-acquisition-providers
```

本阶段不是继续扩充 Harness/S4，也不是直接实现最终 Acquisition Network；目标是用真实 Discovery Missions 选出 V1 Provider 组合，并建立可重复的 benchmark 证据。

## 不变 Contract

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
  D3 Google Trends Momentum                      COMPLETE / PASS WITH LIMITATIONS
  D4 zh-CN multi-channel Search/Fetch             COMPLETE / PASS WITH LIMITATIONS
0.5B-E Human Editorial Acceptance                IN_PROGRESS
  E1 Momentum title-only                         CONTEXT_BLOCKED
  E2 Deep-explainer Potential                    REVIEWED
  E3 Multi-channel corpus correction             COMPLETE
  E4 Provider-blind multi-channel review         COMPLETE
  E5-A Chinese platform hotlist                  COMPLETE / PASS WITH LIMITATIONS
  E5-B Official platform item/metrics seam       CODE_COMPLETE / REAL_AUTH_PENDING
  E5-C Hotlist → Web context enrichment          READY_FOR_REAL_RUN / CI PASS
0.5B-F Provider Decision + ADR                   NOT_STARTED
```

## 已完成的 Provider 证据

### D1 — HN Community baseline

HN ranked snapshot 可作为 Community/Audience/Ambient discovery baseline，但不能独立承担 semantic Potential search、Trend velocity 或 Evidence provider。

### D2 — Search / Fetch

阶段性选择：

```text
Exa Search
→ 当前 semantic Search 主候选

Firecrawl Fetch
→ 当前独立正文获取主候选

Tavily integrated
→ comparator / fallback
```

D4 中文多栏目真实运行进一步证明：正确 Mission 下，开放 Web Search 可以发现反转、普通人物、诈骗风险、娱乐回应、常识纠偏等多栏目素材；不是“只能找严谨科普”。

### E4 — Provider-blind Human Review

揭盲：

```text
A = Exa → Firecrawl
B = Tavily
```

只统计上下文充分样本：

```text
Exa → Firecrawl   4 / 5 可判断；2 值得做；2 观察
Tavily            1 / 5 可判断；0 值得做；1 观察
```

因此 Exa → Firecrawl 暂为中文 Web 主链路候选，但仍不是全局 Provider Winner。

## E5-A — 中文平台热榜真实 baseline

第一次使用公共 NewsNow demo 时四平台统一 HTTP 403。该失败被正确归因于公共 demo 实例，而非微博/抖音/知乎/B站自身 capability。

改用自部署 NewsNow 后真实重跑：

```text
weibo                 SUCCESS   10 candidates   39 ms
douyin                SUCCESS   10 candidates   1219 ms
zhihu                 SUCCESS   10 candidates   399 ms
bilibili-hot-search   SUCCESS   10 candidates   369 ms

TOTAL                  40 candidates
required SourceRole    4 / 4 PASS
```

四个平台均满足：

```text
DISCOVERY_SIGNAL + TREND_SIGNAL
```

单次 hotlist 仍只是 rank snapshot，不是 velocity，不是 Editorial Value，不是 Evidence。

数据丰富度存在明显差异：知乎 10/10 带热度文本、9/10 带 hover 事件上下文；微博/抖音/B站当前主要是标题 + rank + platform URL。40 条中出现一个精确跨平台标题重合：`国家对成品油价格实施调控`，抖音 rank 1、B站 rank 5。

详细审计：`PHASE_0_5B_E5A_PLATFORM_HOTLIST_RUN_AUDIT.md`。

## E5-B — Official platform item / metrics seam

已实现首条官方 adapter contract：

```text
DouyinVideoSearchProvider
benchmarks/acquisition/run_douyin_official_probe.py
tests/test_douyin_official_provider.py
```

边界：

```text
官方 platform item
→ Discovery / Platform Material

搜索 rank
→ query relevance only

点赞等指标
→ point-in-time audience snapshot

视频中的主张
→ 不自动升级为 Confirmed Evidence
```

真实 keyed probe 只在取得官方 capability + client token + 合法 device_id 后执行；凭据只读 server-side environment，不写入 artifact。

## E5-C — Hotlist → Search/Fetch context enrichment

已新增：

```text
benchmarks/acquisition/run_platform_context_enrichment.py
tests/test_acquisition_platform_context_enrichment.py
```

它从 E5-A artifact 中确定性选择：

```text
每个平台 top N
+ 任意精确标题跨平台重复
```

然后执行：

```text
Platform hotlist signal
→ Exa Search 背景补全
→ Firecrawl Fetch 正文
→ Human Momentum Acceptance
```

该链路用于解决 E1 暴露的问题：`标题 + 热度` 不足以支持真实人工编辑判断。

## 当前 Gate

下一次本地真实运行不需要新的平台账号，先用已有 E5-A 自部署 artifact + Exa/Firecrawl keys 跑 E5-C。拿到补全后的 8 个左右热点上下文后，再做真正的 Momentum Human Acceptance。

E5-B 官方平台接入与 E5-C 人工验收完成后，形成 capability matrix，进入 0.5B-F Provider Decision + ADR。
