# Current State

## 状态

`S4_HARNESS_NATIVE_PRODUCT_SHELL_IN_PROGRESS`

截至 PR #15 已合并到 `main`：

```text
S1 Web Shell Foundation                 COMPLETE
S2 Today / Opportunity Inspector       COMPLETE
S3 Opportunities Library               COMPLETE
Harness Runtime / Research Spike       COMPLETE
Harness-native Product Shell Spike     ACCEPTED
Windows local native-shell acceptance  PASS
```

PR #16 当前正式迁移状态：

```text
S4-N1 Product Shell Foundation           COMPLETE / CI PASS
S4-N2 Today / Opportunities Migration    COMPLETE / CI PASS
S4-N3 Research Runtime Adapter           COMPLETE / CI PASS
S4-N4 Scheduler / Headless Orchestration IN_PROGRESS
  N4-A exact-pin audit + Contract        COMPLETE
  N4-B Manual Run vertical slice         COMPLETE / CI PASS
  N4-C Durable Task / Run model          COMPLETE / CI PASS
  N4-D Interval / Schedule trigger       NEXT
S4-N5 Web Shell Retirement               NOT_STARTED
```

N3 收口 head：`5fcc37dd1800087f564abb0dea5a70d8dbf9662a`。  
N4-B 收口 head：`6dc7a883cec849e25509cbc5f085ac351e3383de`。

N4-C 已新增 PostgreSQL Scheduler Task/Run schema、Alembic migration、durable repository、Manual Run durable path、restart-safe run history 与 PostgreSQL CI integration Gate。N4-C 代码 Gate 首次通过于 `a55904a34a7980bf9ad31e7d88c2f1468d0f1407` 的 CI：Ruff / baseline tests / Alembic migration / PostgreSQL restart-safe integration 全部 PASS；Harness 三套 exact-pin workflow 继续作为 PR #16 的独立回归 Gate。

---

## 当前正式架构

ADR-0010 冻结当前最终宿主：

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

ADR-0009 / `HYBRID_WEB_HARNESS` 与 `HYBRID_SHELL_CONTRACT.md` 现在是历史决策证据，不再是活动实现 Contract。

AI Editorial Desk 与 stock Harness 工作台在同一个 Harness Web（当前本地 `3080`）中双向切换。AI Editorial Desk 作为结构化业务工作台；stock Harness 保留为自由 Agent / Session 工作台。

业务数据由 Editorial API / PostgreSQL 持有。Harness Session / Job / Replay / Workspace 属于运行时对象，不得替代 `opportunity_id`、`research_case_id`、`candidate_id`、`draft_id`、`publication_id` 等业务主键。

活动 Contract：

- `docs/04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`
- `docs/04_CONTRACTS/SCHEDULER_ORCHESTRATION_CONTRACT.md`

---

## 已完成 Gate：S4-N3 Research Runtime Adapter

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

已落地：

- `/api/v1/integrations/harness/runtime/research/{research_case_id}` runtime binding；
- Session bind / rebind / bootstrap-complete；
- Session 更换后 bootstrap 自动重新 required；
- Product Shell 使用公开 `ctx.sessions` / `ctx.workspaces` outward API；
- 已绑定 Session 存在时复用；丢失时创建/复用新 Session 并 rebind；
- Product Shell 主动调用 `Session.prompt()`，不要求用户进入 Chat 手工 prompt；
- 正式 Host Tool `get_editorial_research_result` 只读取既有 Research Case，不重复创建 Case；
- durable structured Tool Result 出现后才标记 bootstrap complete；
- Harness Session ID 只作为 runtime metadata；
- Runtime failure 不删除 Research Case。

Fresh profile 没有 Workspace 时，Product Shell 通过 pinned public `IWorkspaces` 自动：

```text
listDirectory()
→ create/reuse ai-editorial-desk-runtime directory
→ create({path}) Workspace
→ connectWorkspace()
→ Session
→ Research Case binding
```

---

## 当前 Gate：S4-N4 Scheduler / Headless Orchestration

当前活动 Contract：`docs/04_CONTRACTS/SCHEDULER_ORCHESTRATION_CONTRACT.md`。

### N4-A — exact-pin audit + Contract

**状态：COMPLETE**

冻结结论：

- 主路径使用公开 `@deepseek-ai/dsh-sdk-client`；
- transport 为 subprocess + stdio JSON-RPC；
- `DeepSeekHarness.run()` 的运行区间是 durable inbox receipt → whole-agent `idle`；
- `messageId` 只代表 enqueue receipt，不代表业务完成；
- SDK wire 当前没有 per-prompt cancel，因此首版 SchedulerRun 使用独占 runtime process 作为 timeout/cancellation boundary；
- ACP 有 `session/cancel`，但 exact pin 仅支持 fresh sessions，不承担需要 named-session continuity 的主路径；
- Harness `schedule/` 是 Session-local reminder，没有 public Scheduler service，不作为系统 Scheduler。

### N4-B — Manual Run vertical slice

**状态：COMPLETE / CI PASS**

正式接口：

```text
POST /api/v1/integrations/harness/scheduler/research/{research_case_id}/run-now
GET  /api/v1/integrations/harness/scheduler/runs/{run_id}
```

第一条 operation：

```text
research.rehydrate
→ exact-pinned TypeScript SDK runner
→ get_editorial_research_result(research_case_id)
→ agent idle + canonical structured Tool Result
→ SchedulerRun succeeded / failed
```

已验证：business ID / runtime ID 分层、idempotency、duplicate protection、timeout、explicit failure、credential redaction、execution/runtime provenance、exact-pin headless SDK probe，且不依赖 Web UI / iframe / DOM / private Harness API。

### N4-C — Durable Task / Run model

**状态：COMPLETE / CI PASS**

已落地：

- `scheduler_tasks` durable schema：`task_id / operation / business object / trigger / enabled / schedule / next_run_at`；
- `scheduler_runs` durable schema：业务身份、状态、attempt、时间、failure、runtime provenance、execution provenance；
- `idempotency_key` PostgreSQL UNIQUE constraint；
- `business_object_id` / `task_id` / `status` history indexes；
- Alembic 基线与 `20260910_01` migration；
- `SchedulerPostgresStore` durable repository；
- `DATABASE_URL` 配置存在时 Manual Run 自动使用 PostgreSQL，未配置时仅保留开发/测试用 `transitional_in_memory` fallback；
- `GET /api/v1/integrations/harness/scheduler/research/{research_case_id}/runs` 提供按业务对象的历史查询；
- 新 repository 实例可恢复之前 Run，证明 run history 不依赖 API process memory；
- duplicate idempotency 在数据库唯一约束下保持单一 Run；
- Harness Session ID 仍只保存在 `runtime_provenance`，不进入 Scheduler 主键；
- CI 启动真实 PostgreSQL 16，实际执行 `alembic upgrade head` 与 restart-safe integration test。

N4-C 只完成 Scheduler Task/Run 持久化基础，不表示 Opportunity / Research fixture 已全部迁入 PostgreSQL，也不表示 interval/event trigger 已实现。

### N4-D — Interval / Schedule trigger

**状态：NEXT**

下一 Gate：在 N4-C durable `scheduler_tasks` 之上实现 enable/disable、interval/schedule 表达、`next_run_at`、due-task claim、manual clock-independent tick，以及避免多实例重复领取的数据库级 claim 语义。仍使用 N4-A 冻结的 Harness headless execution seam，不回退到 Harness Chat 手工 prompt。

### N4 后续

```text
N4-D Interval / Schedule trigger
→ N4-E Retry / Catch-up / History
→ N4-F Event trigger + Product status UI
```

---

## S4-N5 后续

Product Shell 达到所需功能等价后：删除 `apps/web`，或明确降级为 dev-preview/reference 壳；不允许长期维护两套生产入口。

---

## PR #14 处理

PR #14 的 iframe / `embedded` transport / `surface_url` 路线已经 superseded，**不得合并为正式架构**。

已吸收：Research Case ↔ Session runtime binding、Session 丢失后 rehydrate、公开 outward API、bootstrap/rebind 幂等、runtime failure 不等于业务对象丢失。

明确废弃：iframe Harness、`embedded` transport、`surface_url` 正式 Product UI seam、`editorial_embed` / `editorial_launch` URL host 模式、外部 `apps/web` 最终生产 Shell。

---

## 自动执行原则

标准业务动作不能要求用户进入 Harness 聊天框手工 prompt：

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness Runtime Adapter / SDK / JSON-RPC
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

Today / Opportunity / Watch 等周期任务目标是用户打开工作台时数据已经存在，而不是每天手动要求 Agent 开始工作。

---

## Product / Domain 不变边界

- 新仓库独立演化，旧 `ai-editorial-desk` 仅作为 Legacy/reference；
- 主链以 Subject / Discovery / Editorial Opportunity 为中心；
- Trend 是可选 Feature，不是 Discovery / Opportunity / Candidate 的硬 Gate；
- HumanSubmission 是一等 Acquisition 入口，但不是 Confirmed Fact、正偏好标签、Opportunity、Candidate 或 Adopt；
- `source_origin` 与 `acquisition_origin` 必须分离；
- Candidate 前必须说明 Editorial Advantage；
- PostgreSQL 是 System of Record；WeKnora 是 Knowledge Provider。

---

## Transitional data boundary

当前 Today / Opportunities / Research 的一部分集成仍使用 deterministic / in-memory Spike fixture。N4-C 之后 **Scheduler Task/Run 在配置 `DATABASE_URL` 的正式运行环境中已使用 PostgreSQL durable store**；只有未配置数据库的开发/测试场景保留 process-memory fallback。

仍不得宣称：

- 真实外部 Acquisition 已完成；
- PostgreSQL Opportunity / Research persistence 已完成；
- deterministic mock 是 production research result；
- in-memory Research / runtime binding fixture 具备 durable persistence。

---

## Acquisition Provider Spike 仍未关闭

Phase 0.5-B 必须继续独立验证 high-momentum discovery、low/no-momentum but high-potential discovery、community/non-official first discovery → reliable evidence follow-up。HumanSubmission 不参加 Provider 胜负比较。

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
