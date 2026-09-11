# Current State

## 状态

`S4_HARNESS_NATIVE_PRODUCT_SHELL_ENGINEERING_COMPLETE`

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

N3 收口 head：`5fcc37dd1800087f564abb0dea5a70d8dbf9662a`。  
N4-B 收口 head：`6dc7a883cec849e25509cbc5f085ac351e3383de`。  
N4-D 收口 head：`ead02f8c3f3623f90c5ab7d51b1599d0d78fa497`。  
N4-E 收口验证 head：`ecb15704372767cc267a3834d6c03d7370f25b41`。  
N4-F / N4 完整收口验证 head：`06ca19f629d22b39f28948c11ac10744feafa04b`。  
N5 / S4 工程收口验证 head：`280e7c9b2ba3a9bf7019b94b85e4acf0d4c213f6`。

N5 / S4 工程收口验证 head 的四套 workflow 全绿：

```text
CI                         #268 PASS
Harness Spike              #222 PASS
Harness Editorial Shell    #130 PASS
Harness Native Shell Spike #136 PASS
```

因此 S4 的仓库级工程 Gate 已完成。PR #16 继续保持 Draft，合并前仍需一次 Windows 本地最终 smoke；该 smoke 不重复 CI，而只验证本机启动、Product Shell 可见、Product ↔ stock Harness 切换、Research/Scheduler 状态与无明显插件启动异常。

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

## 已完成 Gate：S4-N4 Scheduler / Headless Orchestration

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

- `scheduler_tasks` durable schema；
- `scheduler_runs` durable schema；
- `idempotency_key` PostgreSQL UNIQUE constraint；
- business object / task / status history indexes；
- Alembic migration；
- `SchedulerPostgresStore` durable repository；
- 配置 `DATABASE_URL` 时 Manual Run 使用 PostgreSQL；
- Run History 按业务对象查询；
- repository restart 后仍可恢复 Run；
- Harness Session ID 只保存在 `runtime_provenance`。

### N4-D — Interval / Schedule trigger

**状态：COMPLETE / CI PASS**

正式链路：

```text
Durable SchedulerTask
→ interval + next_run_at
→ PostgreSQL due-task claim
→ SELECT ... FOR UPDATE SKIP LOCKED
→ manual clock-independent scheduler tick
→ stable schedule idempotency key
→ research.rehydrate
→ exact-pinned Harness headless execution
→ SchedulerRun
```

已验证 durable interval task、restart-safe `next_run_at`、`FOR UPDATE SKIP LOCKED` 多实例防重、stable scheduled occurrence idempotency、scheduled Run 的 business/runtime identity 分层，以及 PostgreSQL 16 migration/integration Gate。

### N4-E — Retry / Catch-up / History

**状态：COMPLETE / CI PASS**

已验证：

- `20260910_02` migration：Task catch-up / retry policy、Run `scheduled_for / next_retry_at`、`scheduler_run_attempts`；
- retry 保持同一 `run_id / idempotency_key / business_object_id`，只递增 attempt，不生成新的业务对象 ID；
- attempt 级 runtime/execution provenance durable history；
- exponential backoff / max attempts；
- `skip | bounded` catch-up；
- Task `last_run_at`；
- retry claim row lock / `SKIP LOCKED`；
- Task disable 清理待执行 retry；
- 新 attempt 不继承旧 Harness Session / completion metadata。

### N4-F — Event trigger + Product status UI

**状态：COMPLETE / CI PASS**

正式链路：

```text
research.completed
→ durable Event SchedulerTask
→ event:{task_id}:{event_id} idempotency
→ SchedulerRun(trigger_kind=event)
→ exact-pinned headless research.rehydrate
→ retry / attempt history
→ Product Shell Scheduler status projection
```

已验证：

- `research.completed` 第一条 canonical event trigger；
- durable Event Task create / read / enable / disable；
- 同 Task + 同 `event_id` 重复投递复用同一 logical SchedulerRun；
- Event Run 复用 N4-E retry queue，并保持同一 Run / business identity；
- `/research/{research_case_id}/status` 只读 canonical 状态投影；
- Product Shell Research 页面 `Scheduler / Headless` 状态卡；
- 未配置 PostgreSQL 时状态卡诚实显示 process-memory fallback，Event Task 不静默降级；
- PostgreSQL event idempotency / restart / retry integration tests；
- FastAPI query metadata 不泄漏到直接函数调用的 repository limit 参数；
- exact-pin Harness Product Shell / browser / native-shell 回归全部 PASS。

---

## 已完成 Gate：S4-N5 Web Shell Retirement

**状态：COMPLETE / CI PASS**

审计文档：`docs/07_DELIVERY/S4_N5_WEB_SHELL_RETIREMENT_AUDIT.md`。

已确认 `apps/web` 当前只包含：

- 已迁移到 Product Shell 的 Today / Opportunities；
- 已被 N3 正式 Runtime Adapter supersede 的旧 `HarnessSurfaceHost` Research 宿主；
- Programming / Creation / Publication / Performance / Knowledge / Management 等 placeholder 路由。

因此没有只存在于 standalone Web Shell、却会阻塞生产宿主退役的独占正式业务能力。

N5 最终状态：

```text
apps/web = RETIRED_AS_PRODUCTION_HOST
apps/web = MIGRATION_REFERENCE_ONLY
formal product host = DeepSeek Harness Product Shell
```

已验证：

- `apps/web/README.md` 明确 reference-only；
- package metadata 明确 retired production host；
- standalone 页面启动后显示 legacy migration reference notice；
- legacy Web 仍可 build，但只作为 migration/regression reference；
- architecture / delivery / tests 均保持单一 production host 不变量；
- formal Product acceptance 继续由 exact-pin Harness Product Shell browser / native-shell Gate 承担；
- head `280e7c9b2ba3a9bf7019b94b85e4acf0d4c213f6` 四套 workflow 全部 PASS。

物理删除 `apps/web` 不属于本 PR 的必需条件；后续在不再需要视觉/交互对照时，可独立 cleanup PR 删除。

---

## PR #14 处理

PR #14 的 iframe / `embedded` transport / `surface_url` 路线已经 superseded，**不得合并为正式架构**。

已吸收：Research Case ↔ Session runtime binding、Session 丢失后 rehydrate、公开 outward API、bootstrap/rebind 幂等、runtime failure 不等于业务对象丢失。

明确废弃：iframe Harness、`embedded` transport、`surface_url` 正式 Product UI seam、`editorial_embed` / `editorial_launch` URL host 模式、外部 `apps/web` 最终生产 Shell。

---

## 合并前人工 Gate

S4 工程 Gate 已完成，但 PR #16 暂不直接合并。最后只保留一次 Windows 本地 smoke：

```text
启动 Editorial API + pinned Harness Web
→ AI Editorial Desk Product Shell 可见
→ Today / Opportunities 可用
→ Product Shell ↔ stock Harness 双向切换
→ Research Case / Scheduler 状态可见
→ 无白屏、持续 Failed to load plugins 或明显 runtime 启动异常
```

本地 smoke PASS 后，PR #16 才可从 Draft 转 Ready 并进入合并确认。

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

当前 Today / Opportunities / Research 的一部分集成仍使用 deterministic / in-memory Spike fixture。Scheduler Task/Run/Attempt 在配置 `DATABASE_URL` 的正式运行环境中已使用 PostgreSQL durable store；只有未配置数据库的开发/测试场景保留 process-memory fallback。

仍不得宣称：

- 真实外部 Acquisition 已完成；
- PostgreSQL Opportunity / Research persistence 已完成；
- deterministic mock 是生产研究结果；
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
