# S4 Harness-native Product Shell 正式迁移

## 决策

PR #15 已完成 exact-pin 自动化与 Windows 本地验收，正式证明以下路线可行：

```text
DeepSeek Harness Web
├─ official runtime
├─ stock Harness workbench
└─ AI Editorial Desk Product Shell Plugin

Editorial API / PostgreSQL
└─ canonical business truth
```

因此 S4 的正式方向为 **Harness-native Product Shell**。`apps/web -> iframe -> Harness` 不再作为最终产品架构。

活动 ADR：`../ADR/ADR-0010-harness-native-product-shell.md`  
活动 Product Shell Contract：`../04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`  
活动 Scheduler Contract：`../04_CONTRACTS/SCHEDULER_ORCHESTRATION_CONTRACT.md`  
N5 退役审计：`S4_N5_WEB_SHELL_RETIREMENT_AUDIT.md`

## 当前批次状态

```text
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

最终自动化验证 head：`a56b7b9bbe8844df88fed7071f2827dcc0b672b5`，对应 CI #289、Harness Spike #243、Harness Editorial Shell #151、Harness Native Shell Spike #157 全部 PASS。

Windows final local smoke 也已 PASS：正式 Product Shell 在 `:3080` 正常；Today / Opportunities / Inspector 可用；fresh-profile native picker fallback 正常；Workspace / Session 自动 bootstrap；Research Case 进入 `Runtime Ready`；Product Shell ↔ stock Harness 双向切换与两边 F5 状态保持正常。

## 不变边界

1. AI Editorial Desk 是结构化业务产品；Harness 同时是 Product Shell Host、Agent Runtime 与 stock Agent workbench。
2. Opportunity / Research Case / Candidate / Draft / Publication 等业务对象由 Editorial API / PostgreSQL 持有。
3. Harness Session / Job / Replay / Workspace 是运行时对象，不得替代业务 ID。
4. 标准业务动作由 Product UI 或 Scheduler / Orchestrator 主动驱动 Harness，不要求用户进入 stock Chat 手工 prompt。
5. stock Harness workbench 继续保留，并可与 AI Editorial Desk 双向切换。
6. 不修改 DeepSeek Harness upstream core；只使用公开 Client Plugin / Slot / Runtime / SDK / JSON-RPC seam。
7. `apps/web` 已完成 production-host retirement，只允许作为 migration/reference regression surface。

## S4-N1 — Product Shell Foundation

**状态：COMPLETE / CI PASS**

已完成正式 `@ai-editorial-desk/harness-editorial-shell` 包、pinned Harness public root Slot Product Shell、stock AppFrame/workbench 保留、公开 seam 双向切换、统一 API Base，以及 exact-pin typecheck/bundle/install/browser smoke。

## S4-N2 — Today / Opportunities Migration

**状态：COMPLETE / CI PASS**

已完成 Today / Opportunities、Opportunity Inspector 五 Tab、Research Case 创建/复用、`ed_*` namespaced Product state、Product ↔ stock Harness 往返恢复，并保持“不伪造缺失 canonical 数据”的边界。

## S4-N3 — Research Runtime Adapter

**状态：COMPLETE / CI PASS**

正式链路：

```text
Product Shell Research Case
→ HarnessRuntimeAdapter
→ Research Case ↔ Harness Session runtime binding
→ public ctx.sessions / ctx.workspaces
→ Session.prompt()
→ get_editorial_research_result
→ durable Harness Tool Result / replay
```

已完成 runtime binding/rebind/bootstrap-complete、public `IWorkspaces` fresh-profile bootstrap、Windows native picker fallback、自动 `Session.prompt()`、只读 canonical Research Tool，以及 runtime failure 不删除业务 Research Case。

## S4-N4 — Scheduler / Headless Orchestration

**状态：COMPLETE / CI PASS**

正式执行图：

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

N4-A 至 N4-F 已全部完成，包括 exact-pin SDK audit、Manual Run、PostgreSQL durable Task/Run、interval trigger、retry/catch-up/history、`research.completed` event trigger 与 Product Shell Scheduler status projection。

关键不变量：

- `@deepseek-ai/dsh-sdk-client` + subprocess + stdio JSON-RPC 为主 headless seam；
- Scheduler business identity 与 Harness runtime metadata 分层；
- PostgreSQL UNIQUE idempotency；
- interval occurrence `schedule:{task_id}:{scheduled_time}`；
- event occurrence `event:{task_id}:{event_id}`；
- retry 保持同一 logical Run，仅递增 attempt；
- Product Shell 状态从 Editorial API canonical projection 读取，不从 Harness transcript 猜测。

## S4-N5 — Web Shell Retirement

**状态：COMPLETE / CI PASS**

最终定义：

```text
apps/web = RETIRED_AS_PRODUCTION_HOST
apps/web = MIGRATION_REFERENCE_ONLY
formal product host = DeepSeek Harness Product Shell
```

已完成 reference quarantine、机械 retirement tests、legacy Web reference build 标识，以及 exact-pin Harness Product Shell / Native Shell browser acceptance。物理删除 `apps/web` 可在后续独立 cleanup PR 执行，不影响 S4 已建立的单一 production-host 不变量。

## PR #14 处理结论

PR #14 的 iframe / `embedded` / `surface_url` 路线已由 ADR-0010 supersede，不得作为正式架构合并。仅保留其中已被当前实现吸收的 Session rebind/bootstrap/rehydrate/business-ID invariants。

## S4 Gate

以下均已通过：

```text
Python / baseline CI
PostgreSQL migration + Scheduler integration
legacy Web reference build
Harness exact-pin typecheck
Harness bundle
isolated profile install
formal Product Shell browser Gate
Harness native-shell regression
business ID invariants
fresh-profile behavior
Windows native picker fallback
Research Runtime Ready / replay
Product Shell ↔ stock Harness round-trip
Editorial / Harness mode F5 persistence
no upstream core patch
```

最终自动化验证 head：`a56b7b9bbe8844df88fed7071f2827dcc0b672b5`。

## 合并状态

S4 仓库级工程 Gate 与 Windows 本地最终 smoke 均已完成。PR #16 已具备从 Draft 转 Ready 的条件；合并动作仍需用户明确确认。

## 当前未被 S4 自动解决的事项

S4 是 Product Shell / Runtime migration，不等于完成全部产品数据层。仍然不得宣称 PostgreSQL Opportunity / Research persistence 已完整落地、deterministic/in-memory Spike fixture 是 production data、真实外部 Acquisition 已完成或 production model/provider 内容质量已全面验收。

Phase 0.5-B Acquisition Provider Spike 继续独立推进。
