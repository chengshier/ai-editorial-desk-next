# Current State

## 状态

`PHASE_0_5B_ACQUISITION_PROVIDER_SPIKE_IN_PROGRESS`

S4 Harness-native Product Shell 已完成并合并：

```text
S4_HARNESS_NATIVE_PRODUCT_SHELL_ENGINEERING_COMPLETE
PR #16                                     MERGED
merge commit                               609d0bbc1bef0992d61b9f7e2e02871755f6e223
S4-N1 Product Shell Foundation           COMPLETE / CI PASS
S4-N2 Today / Opportunities Migration    COMPLETE / CI PASS
S4-N3 Research Runtime Adapter           COMPLETE / CI PASS
S4-N4 Scheduler / Headless Orchestration COMPLETE / CI PASS
  N4-A exact-pin audit + Contract        COMPLETE
  N4-B Manual Run vertical slice         COMPLETE / CI PASS
  N4-C Durable Task / Run model          COMPLETE / CI PASS
  N4-D Interval / Schedule trigger       COMPLETE / CI PASS
  N4-E Retry / Catch-up / History        COMPLETE / CI PASS
  N4-F Event trigger + Product status UI COMPLETE / CI PASS
S4-N5 Web Shell Retirement               COMPLETE / CI PASS
S4 Engineering                           COMPLETE / CI PASS
Windows final local smoke                PASS
```

S4 最终自动化与 Windows acceptance 已验证：Harness Product Shell `:3080`、Today / Opportunities / Opportunity Inspector、native directory picker fallback、Workspace / Session bootstrap、Research Case → Runtime Ready、durable Tool Result replay、Product Shell ↔ stock Harness 双向切换与两种模式 F5 均正常，无持续白屏或 `Failed to load plugins`。

---

## 当前正式架构

ADR-0010 冻结当前正式宿主：

```text
DeepSeek Harness Web
├─ official Agent Runtime
├─ stock Harness workbench
└─ AI Editorial Desk Product Shell Plugin

Editorial API / PostgreSQL
└─ canonical business truth
```

因此：

```text
HARNESS_AS_AGENT_RUNTIME = ACCEPTED
HARNESS_STOCK_WORKBENCH = RETAINED
HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL = ACCEPTED
EXTERNAL_WEB_SHELL_IFRAME_HARNESS = SUPERSEDED
HARNESS_UPSTREAM_CORE_PATCH = FORBIDDEN_BY_DEFAULT
```

Harness Session / Job / Replay / Workspace 是 runtime metadata，不能替代 `opportunity_id`、`research_case_id`、`candidate_id`、`draft_id`、`publication_id` 等业务身份。`apps/web` 已是 migration/reference-only，不再是 production host。

活动 Harness Contract：

- `docs/04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`
- `docs/04_CONTRACTS/SCHEDULER_ORCHESTRATION_CONTRACT.md`

---

## 当前活动主线 — Phase 0.5-B Acquisition Provider Spike

当前分支：

```text
spike/phase-0.5b-acquisition-providers
```

执行文档：

- `docs/07_DELIVERY/ACQUISITION_PROVIDER_SPIKE.md`
- `docs/07_DELIVERY/PHASE_0_5B_ACQUISITION_EXECUTION.md`
- `docs/07_DELIVERY/PHASE_0_5B_REAL_RUN_PROTOCOL.md`
- `docs/07_DELIVERY/PHASE_0_5B_D1_NO_KEY_RUN_AUDIT.md`
- `docs/03_ARCHITECTURE/ACQUISITION_ARCHITECTURE.md`
- `docs/04_CONTRACTS/ACQUISITION_PROVIDER_CONTRACT.md`
- `docs/ADR/ADR-0006-mission-driven-acquisition.md`

当前批次：

```text
0.5B-A Benchmark Contract + Mission Corpus       COMPLETE / CI PASS
0.5B-B No-key Baselines                          COMPLETE / CI PASS
0.5B-C Key-gated Search / Fetch Adapters         COMPLETE / CI PASS
0.5B-D Real Provider Runs                        IN_PROGRESS
  D1 no-key live runner                          COMPLETE / CI PASS
  D1 HN local real run + audit                   COMPLETE / PASS WITH LIMITATIONS
  D1 RSS/Atom configured live baseline           NOT_RUN / NON-BLOCKING
  D2-A Exa vs Tavily keyed real run              NEXT
  D2-B Firecrawl independent fetch               DEFERRED UNTIL D2-A
0.5B-E Human Editorial Acceptance                NOT_STARTED
0.5B-F Provider Decision + ADR                   NOT_STARTED
```

0.5B-C 已在 exact head `23a7c6e61c30558f7e2c733c2e6796763cad38b1` 的 CI #323 验证通过；D1 no-key live runner + SourceRole coverage assessment 已在 CI #341 验证通过。

D1 HN 真实运行已审计：17 个 Mission 中 7 个 transport success、10 个 explicit unsupported；只有 Ambient Mission 满足 required SourceRole。6 个 Momentum Mission 均缺 `TREND_SIGNAL`，其中 emerging-tech 还缺 `EVIDENCE_SOURCE`。7 个成功 run 共 70 个 candidate occurrence，但实际只有 10 个唯一 HN item，因此进入 Opportunity conversion 前必须跨 Mission 去重。该结果证明 HN 适合作为 Community/Audience/Ambient discovery baseline，但不能冒充 semantic Potential search、Trend velocity 或 Evidence provider。

已建立：

- provider-agnostic Mission / Run / Candidate / Benchmark Summary；
- `ambient / potential / momentum / research` discovery lane；
- SourceRole / ProviderCapability；
- `unsupported / unavailable / error` 显式语义；
- Editorial / Potential / Momentum Discovery Yield 分离；
- 版本化 Discovery Mission manifest；
- RSS/Atom Ambient baseline；
- Hacker News public ranked community snapshot baseline；
- Exa semantic Search candidate；
- Firecrawl independent Fetch candidate；
- Tavily integrated Search+Fetch candidate；
- server-side key boundary + missing-key `UNAVAILABLE`；
- keyed Search/Fetch benchmark runner；
- no-key live baseline runner；
- Mission required SourceRole 与实际候选 SourceRole 的覆盖评估，避免把 provider success 冒充 mission success。

当前尚未产生任何 Provider 胜负结论。下一 Gate 是 D2-A：先真实比较 Exa semantic Search 与 Tavily integrated Search+Fetch；只有 Exa Search 本身值得保留时，才进入 D2-B Firecrawl independent Fetch。

---

## Acquisition 不变边界

Next 的 Acquisition Core 继续采用：

```text
Mission-driven Discovery
+ Search-first Acquisition
+ Ambient Feed Sensing
+ Potential Scouting
+ Momentum Radar
+ Human Acquisition
+ Targeted Retrieval
+ Targeted Platform Research
```

规则：

- 热度不是进入 Discovery 的硬门槛；
- `Trend unavailable` 不等于 `Editorial Value low`；
- Provider rank / score / trend number 不能直接升级为 Editorial Value；
- Provider transport 成功不等于 Mission 所需 SourceRole 已满足；
- 非官方来源可以是 Discovery / Audience / Trend Signal，但不能自动成为 Confirmed Evidence；
- Community-first Discovery 必须验证是否能追到可靠 Evidence / Primary Source；
- HumanSubmission 是产品自身的一等 Acquisition ingress，不参加外部 Provider 比较；
- `source_origin` 与 `acquisition_origin` 必须分离；
- Provider secret 只允许 server-side 注入，不进入 Product browser state 或 Git fixture；
- 不实现验证码破解、指纹伪造、自动换号、代理轮换等绕过平台限制的机制。

核心 Spike 指标是 Editorial Discovery Yield，并分别记录 Potential Discovery Yield 与 Momentum Discovery Yield；抓取数量本身不是胜负标准。

---

## S4 已完成工程能力

### Research Runtime Adapter

```text
Product Shell Research Case
→ HarnessRuntimeAdapter
→ Research Case ↔ Harness Session runtime binding
→ public ctx.sessions / ctx.workspaces
→ Session.prompt()
→ get_editorial_research_result
→ durable Harness Tool Result / replay
```

该链路当前负责既有 Research Case 的 runtime binding / replay / rehydrate。现阶段 deterministic mock 只用于证明结构和恢复链路，不代表真实 Research Agent 已完成。

### Scheduler / Headless Orchestration

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

已完成 durable Task/Run/Attempt、interval、event、manual run、retry/backoff、bounded catch-up、idempotency 与 canonical Product status projection。

---

## Transitional data boundary

当前 Today / Opportunities / Research 的一部分集成仍使用 deterministic / in-memory Spike fixture。Scheduler Task/Run/Attempt 在配置 `DATABASE_URL` 的正式运行环境中使用 PostgreSQL durable store；只有未配置数据库的开发/测试场景保留 process-memory fallback。

仍不得宣称：

- 真实外部 Acquisition 已完成；
- PostgreSQL Opportunity / Research persistence 已完成；
- deterministic mock 是 production research result；
- in-memory Research / runtime binding fixture 具备 durable persistence；
- Phase 0.5-B 已选择最终 Provider。

---

## Product / Domain 不变边界

- 新仓库独立演化，旧 `ai-editorial-desk` 仅作为 Legacy/reference；
- 主链以 Subject / Discovery / Editorial Opportunity 为中心；
- Trend 是可选 Feature，不是 Discovery / Opportunity / Candidate 的硬 Gate；
- HumanSubmission 是一等 Acquisition 入口，但不是 Confirmed Fact、正偏好标签、Opportunity、Candidate 或 Adopt；
- Candidate 前必须说明 Editorial Advantage；
- PostgreSQL 是 System of Record；WeKnora 是 Knowledge Provider。

---

## MVP v0.1 Gate

最低闭环仍是：

```text
Machine Discovery + HumanSubmission
→ RawSignal
→ Discovery
→ Editorial Opportunity
→ Evaluation / Research
→ Adopt / Watch / Drop
```

MVP 第一成功标准不是功能数量，而是：系统能主动发现真实值得看的内容；用户能投喂低结构化线索并得到可验证、可解释的 Opportunity；两类入口最终形成可追溯 Human Decision；Product Shell 与 Harness Runtime 不复制或破坏同一业务真相。
