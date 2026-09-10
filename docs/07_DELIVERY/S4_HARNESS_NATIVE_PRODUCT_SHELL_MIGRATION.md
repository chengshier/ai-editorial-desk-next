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
S4-N5 Web Shell Retirement               IN_PROGRESS
```

N4 完整收口验证 head：

```text
06ca19f629d22b39f28948c11ac10744feafa04b
```

该 head：CI #254、Harness Spike #208、Harness Editorial Shell #116、Harness Native Shell Spike #122 全部 PASS。

## 不变边界

1. AI Editorial Desk 是结构化业务产品；Harness 同时是 Product Shell Host、Agent Runtime 与 stock Agent workbench。
2. Opportunity / Research Case / Candidate / Draft / Publication 等业务对象由 Editorial API / PostgreSQL 持有。
3. Harness Session / Job / Replay / Workspace 是运行时对象，不得替代业务 ID。
4. 标准业务动作由 Product UI 或 Scheduler / Orchestrator 主动驱动 Harness，不要求用户进入 stock Chat 手工 prompt。
5. stock Harness workbench 继续保留，作为自由 Agent / Session 模式，并可与 AI Editorial Desk 双向切换。
6. 不修改 DeepSeek Harness upstream core；只使用公开 Client Plugin / Slot / Runtime / SDK / JSON-RPC seam。
7. `apps/web` 已进入 S4-N5 retirement quarantine：只允许作为 migration/reference regression surface，不再是 production host。

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

已完成：

- 正式 `@ai-editorial-desk/harness-editorial-shell` 包；
- pinned Harness public root Slot Product Shell；
- stock AppFrame / workbench 保留；
- `sidebar.footer.action` 等公开 seam 双向切换；
- 统一 API Base `http://127.0.0.1:18000`；
- API failure/retry/runtime state；
- exact-pin typecheck / bundle / install / browser smoke。

## S4-N2 — Today / Opportunities Migration

**状态：COMPLETE / CI PASS**

已完成：

- Today / Opportunities 真实交互迁入 Product Shell；
- Opportunity 搜索、筛选、排序、卡片/紧凑列表；
- 概览 / 证据 / 研究 / 时间线 / 历史五 Tab Inspector；
- Research Case 创建/复用；
- `ed_*` namespaced Product state；
- Product ↔ stock Harness 往返后状态恢复；
- 不伪造缺失的 canonical Evidence / Timeline / Human Decision。

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

已完成 runtime binding / rebind / bootstrap-complete、public `IWorkspaces` fresh-profile bootstrap、自动 `Session.prompt()`、只读 canonical Research Tool，以及 runtime failure 不删除业务 Research Case。

## S4-N4 — Scheduler / Headless Orchestration

**状态：COMPLETE / CI PASS**

目标：标准业务任务无需人工 Chat prompt。

正式执行图：

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

### N4-A — exact-pin audit + Contract

**状态：COMPLETE**

冻结：`@deepseek-ai/dsh-sdk-client` + subprocess + stdio JSON-RPC 是主 headless seam；每个 SchedulerRun 首版独占 runtime subprocess；Harness `schedule/` 不作为系统 Scheduler。

### N4-B — Manual Run vertical slice

**状态：COMPLETE / CI PASS**

第一条 operation：`research.rehydrate`。已验证 Manual Run API、business/runtime identity 分层、idempotency、timeout、explicit failure、credential redaction、runtime/execution provenance 与 exact-pin SDK probe。

### N4-C — Durable Task / Run model

**状态：COMPLETE / CI PASS**

已落地 PostgreSQL `scheduler_tasks` / `scheduler_runs`、Alembic migration、DB UNIQUE idempotency、repository、runtime/execution provenance persistence、restart-safe Run History。

### N4-D — Interval / Schedule trigger

**状态：COMPLETE / CI PASS**

已落地 durable interval task、`next_run_at`、`FOR UPDATE SKIP LOCKED` due claim、stable `schedule:{task_id}:{scheduled_time}` occurrence key 与 clock-independent scheduler tick。

### N4-E — Retry / Catch-up / History

**状态：COMPLETE / CI PASS**

已落地 durable `scheduler_run_attempts`、同 logical Run retry、exponential backoff、max attempts、bounded catch-up、`last_run_at`、retry queue row locking、disable 清理 pending retry，以及新 attempt runtime metadata reset。

### N4-F — Event trigger + Product status UI

**状态：COMPLETE / CI PASS**

正式事件链：

```text
research.completed
→ durable Event SchedulerTask
→ event:{task_id}:{event_id} idempotency
→ SchedulerRun(trigger_kind=event)
→ exact-pinned headless research.rehydrate
→ N4-E retry / attempt history
→ Product Shell Scheduler status projection
```

已验证 Event Task create/read/enable/disable、重复事件复用同一 Run、Event Run retry、canonical `/research/{research_case_id}/status`、Product Shell Scheduler/Headless 状态卡、PostgreSQL restart/idempotency/retry integration，以及 direct-call FastAPI Query metadata 不泄漏到 repository limit。

## S4-N5 — Web Shell Retirement

**状态：IN_PROGRESS**

审计结论：当前 `apps/web` 没有阻塞退役的独占正式业务能力。

当前 standalone Web Shell 只有：

- 已迁移到 Product Shell 的 Today / Opportunities；
- 已被 N3 Runtime Adapter supersede 的旧 `HarnessSurfaceHost` Research host；
- Programming / Creation / Publication / Performance / Knowledge / Management 等 placeholder routes。

因此 N5 采用允许的 reference quarantine 模式：

```text
apps/web = RETIRED_AS_PRODUCTION_HOST
apps/web = MIGRATION_REFERENCE_ONLY
```

已执行：

- 新增 `apps/web/README.md`，明确不可作为第二 production entry；
- package metadata 标记 retired production host；
- standalone app 启动后显示 legacy migration reference notice；
- architecture/current-state docs 切换到 N5；
- 新增 mechanical retirement tests。

N5 仍需最新 head 通过：

```text
Python / baseline CI
legacy Web reference build
Harness exact-pin typecheck
Harness bundle
isolated profile install
formal Product Shell browser Gate
Harness native-shell regression
```

这些 Gate 全绿后，S4 可整体收口；`apps/web` 后续可在独立 cleanup PR 中物理删除，不影响“唯一 production Product Shell”不变量。

## Gate

每个 Harness 相关批次必须独立通过：

```text
Python / baseline CI
Harness exact-pin typecheck
Harness bundle
isolated profile install
browser smoke
business ID invariants
fresh-profile behavior where relevant
no upstream core patch
```

N4 额外要求的 headless SDK public-seam、Scheduler idempotency、failure/timeout、runtime provenance 和 credential boundary 已完成。

## 当前未被 S4 自动解决的事项

S4 是 Product Shell / Runtime migration，不等于完成全部产品数据层。

仍然不得宣称：

- PostgreSQL Opportunity / Research 正式 persistence 已完整落地；
- deterministic/in-memory Spike fixture 是 production data；
- 真实外部 Acquisition 已完成；
- production model/provider 的内容质量已经全面验收。

Phase 0.5-B Acquisition Provider Spike 继续独立推进。
