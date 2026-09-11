# System Architecture v2

## 总体拓扑

```text
Browser
  │
  ▼
DeepSeek Harness Web
├─ AI Editorial Desk Product Shell Plugin
├─ stock Harness workbench
└─ Agent Runtime / Session / Tool / Job / Replay
        │
        │ HTTPS / JSON
        ▼
Editorial Intelligence API / FastAPI
        │
        ├─ Editorial Core
        │   Subject / Discovery / Opportunity / Value / Research / Programming
        │
        ├─ Acquisition Network
        │   Feed / Ambient / Potential / Momentum / Search / Fetch / Platform / Human
        │
        ├─ Knowledge Gateway
        │   └─ WeKnora Provider
        │
        ├─ AI Gateway
        │   model / provider / budget / policy
        │
        └─ PostgreSQL
            System of Record
            Draft / Publication / Performance / Provenance / Decisions
```

## 物理边界

### DeepSeek Harness Web

当前正式浏览器宿主。

其中存在两个一等 UI surface：

```text
AI Editorial Desk Product Shell
↔
stock Harness workbench
```

Product Shell 是 out-of-tree plugin，不修改 upstream core。

### AI Editorial Desk Product Shell

正式包：

`integrations/harness/editorial-shell-package`

负责：

- Global IA / Primary Navigation；
- Today / Opportunities；
- Opportunity Inspector；
- Research business surface；
- Programming / Creation / Publication；
- Performance / Knowledge；
- Management / Configuration；
- Global Search / Human Submission；
- structured Product Commands；
- Product ↔ stock Harness workbench switching。

Product Shell 是 Editorial API 客户端，不持有 Domain 真相。

### stock Harness workbench

负责自由 Agent / Session / Tool / Job / Replay / Approval 工作。

它不是 Product canonical business database，也不是 Programming / Draft / Publication 等全局业务对象的生命周期 owner。

### `apps/editorial_api`

唯一稳定业务 API 入口；对 Product Shell、Harness Tool、Scheduler/Orchestrator 与内部工具暴露 use-case API。

负责：

- validation / auth / risk / idempotency；
- Domain/Application Service；
- runtime binding；
- structured response；
- persistence / provider gateway。

### `packages/editorial_core`

Subject / Observation / Discovery / Opportunity 的领域模型与服务。

### `packages/editorial_value`

版本化 rubric、evaluation schema、pairwise/ranking policy。

### `packages/acquisition`

Mission-driven Acquisition provider contracts、coverage、normalization、provenance；Legacy crawler 只作为 Adapter/Provider。

### `packages/knowledge`

Knowledge Gateway 与 Provider contract；WeKnora 只是 provider。

### `integrations/harness`

保存 Product Shell、Harness tools、profile/plugin、compatibility、runtime adapter 与 Spike evidence。

不放 canonical business truth，不直接访问 PostgreSQL / WeKnora / Provider SDK。

## Harness-native Product Shell 原则

当前活动决策：

```text
HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL
```

PR #15 证明 pinned Harness public root Slot replacement seam 可以承载结构化 Product Shell，同时 Harness mode 保留 stock AppFrame，无需 upstream patch。

因此历史：

```text
HYBRID_WEB_HARNESS
apps/web -> iframe/embedded Harness
surface_url launch descriptor
```

已经 superseded，不再作为正式架构。

活动依据：

- `../ADR/ADR-0010-harness-native-product-shell.md`
- `../04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`
- `HARNESS_INTEGRATION.md`
- `HARNESS_RUNTIME_TOPOLOGY.md`
- `HARNESS_UI_STRATEGY.md`

## Research Runtime

```text
Product Shell
→ canonical Research Case
→ HarnessRuntimeAdapter
→ runtime Session binding
→ public ctx.sessions / ctx.workspaces
→ Session.prompt()
→ Editorial Tool / API
→ durable Tool Result / replay
```

`research_case_id` 是业务身份，`harness_session_id` 是 runtime metadata。

fresh Harness profile 没有 Workspace 时，通过公开 `IWorkspaces` Host/directory API 自动建立 `ai-editorial-desk-runtime` Workspace。

## Scheduler / Orchestrator

当前下一 Gate S4-N4：

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

这层负责主动执行，不让标准业务流程依赖人工 Chat prompt。

## Acquisition 原则

Next 不采用“固定平台每天抓 N 条”作为主要发现模型。

```text
Ambient Feed Sensing
+ Potential Scouts
+ Momentum Radar
+ Search-first Discovery
+ Targeted Fetch
+ Targeted Platform Research
+ Human Submission
```

具体 Provider 组合仍由 Phase 0.5-B 决定。

## 技术基线

- Backend：Python + FastAPI + SQLAlchemy + PostgreSQL；
- Harness：TypeScript/npm 生态，exact-pin compatibility；
- Product Shell：Harness out-of-tree Client Plugin；
- Knowledge：Provider/Gateway；
- Browser Product host：Harness Web；
- `apps/web`：S4-N5 前 migration reference/regression baseline。

逻辑运行时依旧分离：

```text
Harness Web / Client Runtime
Editorial API
PostgreSQL / Provider services
```

并不因为 Product Shell 迁入 Harness Web 就把 Python/backend 合并进 Node 进程。

## Product / runtime identity

Canonical business IDs：

```text
opportunity_id
research_case_id
candidate_id
draft_id
publication_id
human_submission_id
```

Runtime IDs：

```text
harness_session_id
harness_job_id
harness_workspace_id
```

Runtime ID 不得成为唯一业务定位依据。Product Shell 的非 canonical UI 状态使用 `ed_*` namespaced browser state。

## Source of Truth

```text
PostgreSQL / Editorial API
→ canonical business state

WeKnora
→ searchable knowledge/reference

Harness Session
→ agent/runtime trajectory + replay

Product Shell browser state
→ non-canonical UI state
```

四者职责不可互换。
