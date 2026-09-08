# System Architecture v1

```text
                 AI Editorial Desk Web Shell
          Global IA / Router / Product Workspaces
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
      Editorial Intelligence API   Harness-powered
              │                    Agent / Research Workbench
              │                     │ Editorial Tools
              │                     └──────────┐
              │                                │ HTTPS / JSON
              └────────────────────────────────┘
                         │
        ┌────────────────┼───────────────────┐
        ▼                ▼                   ▼
 Editorial Core    Knowledge Gateway     AI Gateway
 Subject/Discovery Provider abstraction  model/budget
 Opportunity        │
 Value/Research     └── WeKnora
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

### Web Shell（planned `apps/web` or equivalent）

正式产品的全局 UI Shell：

- Product Router / Primary Navigation；
- Today / Opportunities；
- Programming / Creation / Publication；
- Performance / Knowledge；
- Management / Configuration；
- Global Inspector / Search / Human Submission；
- Harness launch / return orchestration。

Web Shell 是 Editorial API 的客户端，不持有 Domain 真相，也不 import Harness 内部包。

### `apps/editorial_api`

唯一稳定的业务 API 入口；对 Web Shell、Harness、自动化、内部工具暴露 use-case API。Harness 与 Backend 通过 HTTPS/JSON 连接，长任务允许 SSE/轮询。

### `packages/editorial_core`

Subject / Observation / Discovery / Opportunity 的领域模型与服务。

### `packages/editorial_value`

版本化 rubric、evaluation schema、pairwise/ranking policy。

### `packages/acquisition`

Mission-driven Acquisition provider contracts、coverage、normalization、provenance；迁移旧版可复用 connector/runtime/raw signal 能力，但不让 Legacy crawler 成为核心架构。

### `packages/knowledge`

Knowledge Gateway 与 Provider contract；WeKnora 只是 provider。

### `integrations/harness`

Harness profile/plugins/tools/compatibility / launch adapter，不放业务真相，不直接访问数据库/WeKnora/provider SDK。

Harness 负责：

- Agent Conversation / Session / Replay；
- Editorial Tools / ToolViews；
- Background Jobs；
- Research Workspace；
- Agent-driven structured interaction。

它不负责整个产品的 Global Router / Primary Navigation。

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

## Harness / Web Shell UI 原则

Harness UI Spike PR #5–#9 已完成，最终采用：

```text
HYBRID_WEB_HARNESS
```

原因：Harness 已证明适合 Agent / Tool / Research / Replay 与 Session-scoped complex workbench，但 exact-pin 缺少适合全局业务 Router / Primary Navigation 的 additive shell seam，Programming 等全局模块不应绑定 Agent Session 生命周期。

详见：

- `HARNESS_INTEGRATION.md`
- `HARNESS_RUNTIME_TOPOLOGY.md`
- `HARNESS_UI_STRATEGY.md`
- `../ADR/ADR-0009-hybrid-web-shell-harness.md`
- `../04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`

## 技术基线

后端骨架继续采用 Python + FastAPI + SQLAlchemy + PostgreSQL，以降低旧能力迁移成本。

Harness 保持其 TypeScript/npm 生态并通过稳定边界集成。

Web Shell 作为独立前端运行时/构建产物存在；具体前端框架在 Shell Foundation PR 中冻结，但不得改变 Domain/API/Harness ownership。

三个 UI/API 运行时不硬合成一个进程：

```text
Web Shell
Harness Web / Agent Runtime
Editorial API
```

生产部署可以通过同域 reverse proxy 统一体验，逻辑边界保持独立。

## Product route / runtime identity

产品 canonical route 使用业务页面与业务 ID，例如：

```text
/today
/opportunities
/research/:research_case_id
/programming
```

Harness Session ID / Job ID 只是 runtime metadata，不得成为业务页面唯一定位依据。

Shell ↔ Harness 通过 compatibility / launch contract 关联，不访问 Harness private store / DOM / session files。

## Source of Truth

PostgreSQL 保存 canonical business state；WeKnora 保存可检索知识；Harness Session 保存 agent/runtime trajectory；Web Shell 保存非 canonical UI state。

四者职责不可互换。
