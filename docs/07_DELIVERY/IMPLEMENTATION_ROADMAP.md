# Implementation Roadmap

这不是旧项目的 M6。它是新仓库的 V1 delivery plan。

## Phase 0 — Architecture + Functional Baseline

已冻结：Product / Domain / Editorial Value / Provenance / Acquisition / HumanSubmission / Harness / WeKnora / Legacy reuse 基线。

**状态：COMPLETE / MERGED（PR #1）。**

## Phase 0.5 — Validation Spikes

### 0.5-A Harness Integration / UI Host Gate

历史过程分两步：

1. PR #2、#5–#9 先证明 Agent Runtime / Tool / Job / Replay / Research Workspace，并基于当时 UI seam 选择 `HYBRID_WEB_HARNESS`；
2. PR #15 继续验证 pinned Harness public root Slot replacement seam，证明 out-of-tree Product Shell 可以承载整个结构化工作台且无需 upstream patch。

因此最终宿主由 ADR-0010 冻结为：

```text
HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL
```

`HYBRID_WEB_HARNESS` 与其 iframe / `surface_url` launch contract 保留为历史决策证据，不再指导当前实现。

### 0.5-B Acquisition Provider Spike

**仍未关闭，独立推进。**

必须使用真实 Discovery Missions 比较 Platform-first、Search-first、Search+Fetch、Feed/Ambient、Community/Trend 等组合，并同时验证：

- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery → reliable evidence follow-up。

核心指标是 Editorial Discovery Yield、Source Quality、Cost、Latency、Maintainability，而不是抓取条数。

HumanSubmission 不属于外部 Provider 竞争项；它是产品自身的一等 Acquisition ingress。

## S4 — Harness-native Product Shell Migration

这是当前 UI/runtime 主线：

```text
S4-N1 Product Shell Foundation           COMPLETE / CI PASS
S4-N2 Today / Opportunities Migration    COMPLETE / CI PASS
S4-N3 Research Runtime Adapter           COMPLETE / CI PASS
S4-N4 Scheduler / Headless Orchestration NEXT
S4-N5 Web Shell Retirement               NOT_STARTED
```

### S4-N1

- 正式 `@ai-editorial-desk/harness-editorial-shell`；
- public root Slot Product Shell；
- stock Harness workbench 保留；
- 双工作台切换；
- exact-pin typecheck / bundle / isolated profile / browser Gate。

### S4-N2

- Today / Opportunities 迁入 Product Shell；
- Search / Filter / Sort / card/compact list；
- 五 Tab Opportunity Inspector；
- Research Case 创建/复用；
- `ed_*` namespaced Product state。

### S4-N3

- Research Case ↔ Harness Session runtime binding；
- Session reuse / rebind / bootstrap；
- `Session.prompt()` 主动驱动，不要求人工 Chat prompt；
- `get_editorial_research_result` 只读取既有 Research Case；
- durable Tool Result / replay；
- fresh profile 无 Workspace 时，通过 public `IWorkspaces.listDirectory/createDirectory/create/connectWorkspace` 自举 `ai-editorial-desk-runtime` Workspace。

### S4-N4 — NEXT

建立 Editorial Scheduler / Orchestrator，使标准业务动作不依赖用户在 Chat 中手工触发。

最低 Contract：

```text
Schedule / Event / Manual Product Command
→ Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
```

至少支持：

- enable / disable；
- schedule / interval；
- event trigger；
- manual run now；
- Catch-up；
- retry/backoff；
- Last Run / Next Run；
- run history；
- idempotency / duplicate-run protection；
- explicit failure reason；
- no provider secret in Product browser state。

### S4-N5

Product Shell 达到所需功能等价后，删除 `apps/web` 或明确降级为 dev-preview/reference 壳，禁止形成两套生产入口。

## MVP v0.1 — Discovery Desk Vertical Slice

最低入口：

```text
Machine Acquisition
├─ Feed/Ambient
├─ Potential Scout
└─ Momentum/Community minimum

Human Acquisition
└─ HumanSubmission: URL + Text
```

共同进入：

```text
RawSignal
→ Subject / Discovery
→ Editorial Opportunity
→ Value Evaluation
→ Research / Evidence / Unknown
→ Candidate
→ Adopt / Watch / Drop
```

MVP Workbench 至少提供 Today/Radar、Potential/Momentum、Human Submission、Opportunity Detail、Research、Adopt/Watch/Drop。

MVP v0.1 不以完整 Draft / Publication / Performance / WeKnora / Controlled Evolution 为阻塞条件。

## Phase 1 — Foundation Contracts

实现领域 value objects、枚举、Pydantic schemas、repository ports、provenance/version primitives、migration fixtures。

## Phase 2 — Persistence & Legacy Bridge

PostgreSQL/Alembic、核心 repository；Legacy RawSignal/Event 只读 bridge；HumanSubmission / RawSignal / source_origin / acquisition_origin 可追溯。

## Phase 3 — Acquisition Network

实现 0.5-B 选定的 Feed/Ambient、Discovery Scout、Search、Fetch、Targeted Platform、Trend minimum 与 HumanSubmission ingress。

## Phase 4 — Opportunity Intelligence

Discovery generation、Angle/Theme/Audience Promise、Value Evaluation v1、Research Gap、Editorial Advantage、pairwise comparison、replayable evaluation runner。

## Phase 5 — Evidence & Research

ResearchCase、Evidence/Unknown、KnowledgeGateway、WeKnora Provider、外部检索与 provenance；围绕已知 Opportunity 定向补证。

## Phase 6 — Candidate & Programming

CandidateV2、ProgrammingContext、Series Fit、Today Slate、Evergreen、HumanDecisionV2。

## Phase 7 — Product Workbench

宿主选择已经结束，不再二选一 Full vs Hybrid。

当前实现必须基于：

```text
Harness-native AI Editorial Desk Product Shell
+
retained stock Harness workbench
```

需要最终打通 Today/Radar、Human Submission、Opportunity Detail、Research、Pairwise Compare、Programming、Decision。

## Phase 8 — Draft / Publication / Performance

迁移 citation/risk/version/provenance；打通真实 Draft version chain、Publication、Performance snapshot。

## Phase 9 — Calibration & Controlled Evolution

Gold Set、replay A/B、policy proposal、human approval、promotion gates；禁止 silent self-mutation。

## 每个 Phase 的通用要求

- 独立分支/PR；
- 先更新对应 Domain/Contract/ADR 再改语义；
- exact-head CI；
- Harness 相关改动重跑 exact-pin compatibility/browser Gate；
- 明确真实验证与未验证项；
- 不把 provider smoke 当作产品价值验收；
- 保持 AI / Decision / Publication provenance 可重建；
- 不把 transitional deterministic/in-memory fixture 宣称为 production persistence。
