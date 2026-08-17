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
        │           connectors/sources/raw signals
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
唯一稳定的业务 API 入口；对 Harness、自动化、内部工具暴露 use-case API。

### `packages/editorial_core`
Subject / Observation / Discovery / Opportunity 的领域模型与服务。

### `packages/editorial_value`
版本化 rubric、evaluation schema、pairwise/ranking policy。

### `packages/acquisition`
迁移旧版可复用 connector/runtime/raw signal 能力；与 Editorial Core 解耦。

### `packages/knowledge`
Knowledge Gateway 与 Provider contract；WeKnora 只是 provider。

### `integrations/harness`
Harness profile/plugins/tools/compatibility，不放业务真相。

## 技术基线

后端骨架继续采用 Python + FastAPI + SQLAlchemy + PostgreSQL，以降低旧能力迁移成本。Harness 保持其 TypeScript/npm 生态并通过边界集成，不将两者硬合成一个运行时。
