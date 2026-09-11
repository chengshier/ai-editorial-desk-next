# Harness Runtime Topology v2

## 1. 当前用户侧拓扑

AI Editorial Desk Next 当前不再采用“独立 Web Shell + 独立 Harness UI”双浏览器宿主。

正式用户侧宿主为 DeepSeek Harness Web：

```text
Browser
  │
  ▼
DeepSeek Harness Web :3080
  ├─ AI Editorial Desk Product Shell Plugin
  ├─ stock Harness workbench
  └─ Agent Runtime / Session / Tools / Jobs
          │
          │ HTTPS / JSON
          ▼
Editorial API / FastAPI :18000
          │
          ├─ Domain / Application Services
          ├─ PostgreSQL
          ├─ Acquisition Providers
          └─ WeKnora / Knowledge Providers
```

Harness 与 Python 后端仍是独立运行时；变化的是浏览器 Product Shell 被迁入 Harness Web，而不是把后端或业务真相合进 Harness。

## 2. Product Shell 侧组成

正式包：

```text
integrations/harness/editorial-shell-package
```

承载：

- Global IA / Primary Navigation；
- Today / Opportunities；
- Opportunity Inspector；
- Research business surface；
- Programming / Creation / Publication；
- Performance / Knowledge / Management；
- Human Submission / Global Search；
- Product-level runtime status / actions；
- Product ↔ stock Harness workbench switching。

Product Shell 通过 Editorial API 读取和修改业务状态，不直连 PostgreSQL。

## 3. Harness runtime 侧组成

Harness 提供：

- Client Slot / Plugin Host；
- Sessions / Workspaces outward API；
- Agent / Tool / Job / Approval runtime；
- Session replay / trajectory；
- stock Harness workbench；
- 后续 headless / SDK / JSON-RPC execution seam。

`integrations/harness` 维护 compatibility layer，并固定 exact pin。

## 4. Backend 侧组成

`apps/editorial_api` 是稳定业务边界：

- use-case oriented API；
- runtime binding API；
- 身份 / 权限 / 风险 / 幂等 / 输入校验；
- Domain/Application Service；
- structured business result；
- PostgreSQL canonical persistence（正式阶段）；
- Provider / Knowledge gateway。

Harness Plugin 不直接访问数据库或 Provider SDK。

## 5. 短任务

```text
Product Shell or Agent
→ Editorial API / Harness Tool
→ Domain Service
→ structured result
→ Product presentation / Tool Result
```

业务规则必须在 backend use case/domain 层共享，不允许 Product Shell 与 Tool 各复制一套。

## 6. Research 长任务

正式 Research 链路：

```text
Product action
→ Research Case (canonical business id)
→ HarnessRuntimeAdapter
→ runtime Session binding
→ Agent / Tool / Job
→ progress / canonical result in Editorial API
→ durable Harness Tool Result / replay
```

`harness_session_id` 与 `harness_job_id` 只表示运行时对象。

## 7. Fresh profile bootstrap

isolated / fresh Harness profile 可能没有任何 Workspace。

正式 Product Shell 不依赖人工准备环境：

```text
IWorkspaces.listDirectory()
→ Host home
→ create/reuse ai-editorial-desk-runtime
→ IWorkspaces.create({path})
→ connectWorkspace()
→ Session
```

只允许通过 Harness 公开 Host/outward API 获取和创建路径，不在 browser 侧硬编码操作系统目录。

## 8. Session 与业务真相

Session Event / Tool Result 用于：

- runtime trajectory；
- Tool call/result；
- Agent completion；
- replay continuity。

PostgreSQL / Editorial API 用于：

- Subject / Discovery / Opportunity；
- Evaluation / Evidence / Unknown；
- Research Case；
- Candidate / Programming / Decision；
- Draft / Publication / Performance。

Session 丢失只触发 runtime rebind / rehydrate，不得删除业务对象。

## 9. Product state

当前 Product Shell 使用 `ed_*` namespaced browser state 保存非 canonical UI 导航/筛选/Inspector 状态。

业务定位依赖业务 ID，不依赖 Harness private route 或 Session URL。

旧的 `/research/:research_case_id` 外部 Web Shell route 语义只属于迁移参考，不再构成最终 Harness-native 浏览器宿主 Contract。

## 10. Scheduler / Headless（下一 Gate）

S4-N4 需要建立：

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

至少支持 enable/disable、schedule/interval、event/manual trigger、Catch-up、retry、Last Run、Next Run、run history。

## 11. `apps/web` 状态

S4-N5 之前：

```text
apps/web = migration reference + regression baseline
```

它不是最终生产入口。Product Shell 达到功能等价后必须删除或明确降级为开发预览壳，避免双生产入口。

## 12. 兼容隔离

- pin Harness commit/release；
- breaking changes 收敛在 `integrations/harness`；
- no upstream core patch by default；
- Domain/API Contract 不追随 Harness private internals；
- Harness 升级不得自动触发业务 schema 迁移。

详细 Contract：

`../04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`
