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
Windows final local smoke                PENDING
```

N4 完整收口验证 head：

```text
06ca19f629d22b39f28948c11ac10744feafa04b
```

该 head：CI #254、Harness Spike #208、Harness Editorial Shell #116、Harness Native Shell Spike #122 全部 PASS。

N5 / S4 工程收口验证 head：

```text
280e7c9b2ba3a9bf7019b94b85e4acf0d4c213f6
```

该 head：CI #268、Harness Spike #222、Harness Editorial Shell #130、Harness Native Shell Spike #136 全部 PASS。

## 不变边界

1. AI Editorial Desk 是结构化业务产品；Harness 同时是 Product Shell Host、Agent Runtime 与 stock Agent workbench。
2. Opportunity / Research Case / Candidate / Draft / Publication 等业务对象由 Editorial API / PostgreSQL 持有。
3. Harness Session / Job / Replay / Workspace 是运行时对象，不得替代业务 ID。
4. 标准业务动作由 Product UI 或 Scheduler / Orchestrator 主动驱动 Harness，不要求用户进入 stock Chat 手工 prompt。
5. stock Harness workbench 继续保留，作为自由 Agent / Session 模式，并可与 AI Editorial Desk 双向切换。
6. 不修改 DeepSeek Harness upstream core；只使用公开 Client Plugin / Slot / Runtime / SDK / JSON-RPC seam。
7. `apps/web` 已完成 production-host retirement：只允许作为 migration/reference regression surface，不再是 production host。

## PR #14 处理结论

PR #14 的 iframe 方向已被本决策 supersede，不直接合并。

继续吸收：

- `research_case_id ↔ harness_session_id` 是运行时绑定，不是业务主键替换；
- Session 丢失时允许创建/复用新 Session，并从 canonical Research Case rehydrate；
- 使用公开 `sessions / workspaces / Session.prompt()` outward API；
- bootstrap 必须幂等；
- Research Case 即使 runtime failure 也不得被视为业务对象丢失；
- launch/session/rebind/bootstrap 的测试思想。

明确废弃：

- `surface_url` 作为 Product UI 主接入；
- `embedded` transport；
- iframe Harness；
- `editorial_embed` / `editorial_launch` URL host 模式；
- 外部 `apps/web` 作为最终运行宿主。

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

已完成 runtime binding/rebind/bootstrap-complete、public `IWorkspaces` fresh-profile bootstrap、自动 `Session.prompt()`、只读 canonical Research Tool，以及 runtime failure 不删除业务 Research Case。

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
- runtime/session metadata 不进入业务主键；
- Event/Interval/Retry 使用 durable PostgreSQL 状态与 row locking；
- Product Shell 状态从 Editorial API canonical projection 读取，不从 Harness transcript 猜测。

## S4-N5 — Web Shell Retirement

**状态：COMPLETE / CI PASS**

审计结论：当前 `apps/web` 没有阻塞退役的独占正式业务能力。

最终定义：

```text
apps/web = RETIRED_AS_PRODUCTION_HOST
apps/web = MIGRATION_REFERENCE_ONLY
formal product host = DeepSeek Harness Product Shell
```

已完成：

- `apps/web/README.md` 明确不可作为第二 production entry；
- package metadata 标记 retired production host；
- standalone app 显示 legacy migration reference notice；
- architecture/current-state docs 保持单一 production host；
- mechanical retirement tests；
- CI 中 standalone Web 只作为 legacy reference build；
- exact-pin Harness Editorial Shell / Native Shell browser Gate 继续承担正式 Product acceptance；
- readiness race 已在两个 browser Gate 中显式处理，不靠简单扩大 timeout 掩盖真实失败。

物理删除 `apps/web` 可在后续独立 cleanup PR 执行，不影响 S4 已建立的单一 production-host 不变量。

## S4 工程 Gate

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
no upstream core patch
```

最终自动化验证 head：`280e7c9b2ba3a9bf7019b94b85e4acf0d4c213f6`。

## 合并前最后一步

S4 仓库级工程实现已完成，但 PR #16 暂时保持 Draft。合并前仍需一次 Windows 本地最终 smoke，仅验证 CI 难以替代的环境相关路径：

```text
Editorial API + pinned Harness Web 启动
→ AI Editorial Desk Product Shell 可见
→ Today / Opportunities 可用
→ Product Shell ↔ stock Harness 双向切换
→ Research Case / Scheduler 状态可见
→ 无持续白屏 / Failed to load plugins / runtime 启动异常
```

本地 smoke PASS 后，再把 PR #16 转 Ready 并进入合并确认。

## 当前未被 S4 自动解决的事项

S4 是 Product Shell / Runtime migration，不等于完成全部产品数据层。

仍然不得宣称：

- PostgreSQL Opportunity / Research 正式 persistence 已完整落地；
- deterministic/in-memory Spike fixture 是 production data；
- 真实外部 Acquisition 已完成；
- production model/provider 的内容质量已经全面验收。

Phase 0.5-B Acquisition Provider Spike 继续独立推进。
