# DeepSeek Harness Integration

## 官方 / pin 基线

DeepSeek Harness 当前作为本项目 V1 Agent Runtime 与 Product Shell Host exact-pin：

```text
DeepSeek Harness 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release dsh@0.1.0-rc.7
Node 22.19.0
pnpm 11.7.0
```

Harness 仍处于 Developer Preview，因此 compatibility-breaking changes 必须被 `integrations/harness` 隔离。

## 当前最终定位

PR #15 已证明并冻结当前产品宿主方向：

```text
HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL
```

即：

```text
DeepSeek Harness Web
├─ official Agent Runtime
├─ stock Harness workbench
└─ AI Editorial Desk Product Shell Plugin

Editorial API / PostgreSQL
└─ canonical business truth
```

ADR-0009 的 `HYBRID_WEB_HARNESS` 是历史 Gate 结论，已由 ADR-0010 supersede。PR #14 的 `apps/web -> launch descriptor -> embedded Harness iframe` 同样不再作为正式产品方向。

## Harness 承担

- Product Shell Host；
- stock Agent workbench；
- Agent Runtime / Session / Replay；
- Tool / ToolView / Job / Approval orchestration；
- public Client Runtime / Workspace outward API；
- Research runtime interaction；
- 后续 Scheduler / headless execution 的 Harness side runtime。

## Product Shell 承担

正式包：

```text
integrations/harness/editorial-shell-package
@ai-editorial-desk/harness-editorial-shell
```

负责：

- Global IA / Primary Navigation；
- Today / Opportunities；
- Opportunity Inspector；
- Research business entry / status；
- Programming / Creation / Publication；
- Performance / Knowledge / Management；
- Human Submission / Global Search；
- structured product actions；
- stock Harness workbench 双向切换。

Product Shell 运行在 Harness Web 内，但它不是 Harness Session 的业务投影。Programming / Draft / Publication 等全局对象必须跨 Session 长期存在。

## Editorial API / PostgreSQL 承担

全部 canonical business truth：

- Subject / Observation / Discovery；
- Opportunity / Evaluation；
- Evidence / Unknown / Research Case；
- Candidate / Programming / Human Decision；
- Draft / Publication / Performance；
- Acquisition / Provenance / Knowledge references。

Harness Session / Job / Workspace 只属于 runtime metadata。

## 物理连接方式

当前正式拓扑：

```text
Browser
  │
  ▼
DeepSeek Harness Web :3080
  ├─ Product Shell Plugin
  ├─ stock Harness workbench
  └─ Agent Runtime / Session / Tools
          │
          │ HTTPS / JSON
          ▼
Editorial API / FastAPI :18000
          │
          ▼
PostgreSQL / Providers / WeKnora
```

`apps/web` 在 S4-N5 前仅作为迁移参考和回归基线，不再是最终生产浏览器宿主。

## 插件边界

`integrations/harness` 提供 out-of-tree plugin/profile/bundle/compatibility layer。

业务规则不得复制到插件中。插件负责把 Harness 能力映射到 Backend Use Case。

禁止：

- patch/fork Harness upstream core；
- private Harness store access；
- DOM click/query hack；
- iframe 作为正式 Product Shell host；
- `surface_url` / `embedded` launch contract 作为正式 Product UI seam；
- Harness Plugin 直接访问 PostgreSQL / SQLAlchemy；
- 用 Session ID 替代业务 ID。

## Product Shell root seam

在 editorial mode 下，正式 Product Shell 使用 pinned Harness 公开 root Slot replacement seam shadow stock AppFrame。

在 Harness mode 下，stock AppFrame 保持完整，并通过 additive slot 暴露返回 Product Shell 的入口。

这是一种 plugin composition，不是 upstream patch。

## Research Runtime Adapter

正式 Research 链路：

```text
Product Shell Research Case
→ HarnessRuntimeAdapter
→ Research Case ↔ Harness Session runtime binding
→ public ctx.sessions / ctx.workspaces
→ Session.prompt()
→ get_editorial_research_result
→ durable Harness Tool Result / replay
```

关键不变量：

- `research_case_id` 是 canonical identity；
- `harness_session_id` 是 runtime metadata；
- Session 丢失不等于 Research Case 丢失；
- bootstrap 必须幂等；
- 只有 durable structured Tool Result 出现后才算 bootstrap complete；
- Product action 不要求用户去 Chat 手工 prompt。

## Fresh profile runtime bootstrap

完全新的 Harness profile 可能没有 Workspace。

Product Shell 必须通过公开 `IWorkspaces` outward API 自举，而不是要求用户先访问 stock Harness：

```text
listDirectory()
→ create/reuse ai-editorial-desk-runtime directory
→ create({ path }) Workspace
→ connectWorkspace()
→ Session binding
```

禁止在浏览器凭空构造 Host path。

## Session / Replay 边界

Session log 保存运行轨迹与 replayable interaction，不保存唯一业务真相。

即使旧 Session 丢失，Research Case / Evidence / Unknown / Decision / Draft 仍必须能通过 Editorial API 重建。

## Scheduler / headless orchestration

S4-N4 的正式方向：

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

Today / Opportunity / Watch 等标准任务的目标是用户打开工作台时结果已经存在，而不是每天进入 stock Chat 手工发起。

## 集成规则

1. 优先 out-of-tree plugin/profile/bundle/tool/public runtime seam，不 patch upstream core。
2. 固定 upstream commit/version，并保留 compatibility adapter。
3. Harness tool 只调用 Editorial API；不得绕过 domain service 直接写数据库。
4. Harness approval 不是服务端权限/风险校验的替代品。
5. Session log 是运行轨迹，不是业务事实源。
6. Harness breaking change 只能影响 integration layer，不得迫使业务表或 Domain Contract 迁移。
7. Product Shell 与 Harness tools 禁止复制同一套 Domain Logic。
8. `apps/web` 只在迁移期作为 reference；S4-N5 后不得形成双生产入口。

详细见：

- `../ADR/ADR-0010-harness-native-product-shell.md`
- `HARNESS_RUNTIME_TOPOLOGY.md`
- `HARNESS_UI_STRATEGY.md`
- `../04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`
- `../04_CONTRACTS/HARNESS_API_CONTRACT.md`
