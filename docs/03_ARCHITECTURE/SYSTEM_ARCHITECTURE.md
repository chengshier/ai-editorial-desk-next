# System Architecture v1

```text
                         DeepSeek Harness
                  Product Runtime / Workbench
                           │  tools/API
                           ▼
                Editorial Intelligence API
                           │
        ┌──────────────────┼───────────────────┐
        ▼                  ▼                   ▼
 Editorial Core      Knowledge Gateway     AI Gateway
 Subject/Discovery    Provider abstraction  model/budget
 Opportunity          │
 Value/Research       └── WeKnora
 Programming
        │
        ├──────── Acquisition Network
        │           ├─ Feed / Ambient Sensing
        │           ├─ Discovery Scouts
        │           ├─ SearchProvider
        │           ├─ FetchProvider
        │           └─ PlatformProvider
        │
        ▼
     PostgreSQL
   System of Record
        │
 Draft / Publication / Performance
        │
 Evaluation / Calibration / Controlled Evolution
```

## 物理边界

### `apps/editorial_api`
唯一稳定的业务 API 入口；对 Harness、自动化、内部工具暴露 use-case API。Harness 与 Backend 通过 HTTPS/JSON 连接，长任务允许 SSE/轮询。

### `packages/editorial_core`
Subject / Observation / Discovery / Opportunity 的领域模型与服务。

### `packages/editorial_value`
版本化 rubric、evaluation schema、pairwise/ranking policy。

### `packages/acquisition`
Mission-driven Acquisition provider contracts、coverage、normalization、provenance；迁移旧版可复用 connector/runtime/raw signal 能力，但不让 Legacy crawler 成为核心架构。

### `packages/knowledge`
Knowledge Gateway 与 Provider contract；WeKnora 只是 provider。

### `integrations/harness`
Harness profile/plugins/tools/compatibility，不放业务真相，不直接访问数据库/WeKnora/provider SDK。

## Acquisition 原则

Next 不采用“固定平台每天抓 N 条”作为主要发现模型。核心组合为：

```text
Ambient Feed Sensing
+ Mission-driven Discovery Scout
+ Search-first Discovery
+ Targeted Fetch
+ Targeted Platform Research
```

具体 Provider 供应商通过 Spike 决定。详见 `ACQUISITION_ARCHITECTURE.md`。

## Harness UI 原则

Harness 是首选 Agent Workbench，但大型 Radar/Programming/Performance 页面是否全部由 Harness 承担，必须通过技术 Spike；若扩展成本过高允许 Hybrid Web + Harness，业务逻辑仍只存在于 Editorial Intelligence API。

详见：
- `HARNESS_INTEGRATION.md`
- `HARNESS_RUNTIME_TOPOLOGY.md`
- `HARNESS_UI_STRATEGY.md`

## 技术基线

后端骨架继续采用 Python + FastAPI + SQLAlchemy + PostgreSQL，以降低旧能力迁移成本。Harness 保持其 TypeScript/npm 生态并通过稳定边界集成，不将两者硬合成一个运行时。

## Source of Truth

PostgreSQL 保存 canonical business state；WeKnora 保存可检索知识；Harness Session 保存 agent/runtime trajectory。三者职责不可互换。