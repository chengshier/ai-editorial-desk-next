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
  N4-C Durable Task / Run model          NEXT
S4-N5 Web Shell Retirement               NOT_STARTED
```

N3 收口 head：

```text
5fcc37dd1800087f564abb0dea5a70d8dbf9662a
```

该 head 四套 workflow 全绿：

```text
CI                         PASS
Harness Spike              PASS
Harness Editorial Shell    PASS
Harness Native Shell Spike PASS
```

N4-B 收口验证 head：

```text
6dc7a883cec849e25509cbc5f085ac351e3383de
```

该 head 四套 workflow 全绿：

```text
CI                         PASS
Harness Spike              PASS
Harness Editorial Shell    PASS
Harness Native Shell Spike PASS
```

其中 Harness Editorial Shell 已实际通过 exact-pin headless SDK `--probe`、Product Shell typecheck/bundle、isolated profile 与 Browser Gate。

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

业务数据仍由 Editorial API / PostgreSQL 持有。Harness Session / Job / Replay / Workspace 属于运行时对象，不得替代 `opportunity_id`、`research_case_id`、`candidate_id`、`draft_id`、`publication_id` 等业务主键。

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

### Fresh profile bootstrap

本轮最终修复并验证了 isolated Harness profile **没有 Workspace** 的真实边界。

现在 Product Shell 会通过 pinned Harness 公开 `IWorkspaces` API：

```text
listDirectory()
→ Host home
→ create/reuse ai-editorial-desk-runtime directory
→ create({path}) Workspace
→ connectWorkspace()
→ Session
→ Research Case binding
```

不再要求用户先进入 stock Harness 手工建立 Workspace，也没有 browser 侧硬编码 Host path。

### N3 验证边界

当前“COMPLETE / CI PASS”表示正式代码、exact-pin compatibility、isolated profile 和 Browser Gate 已通过。

不得把它扩大解释为：

- 已完成 production model/provider 的全面质量验收；
- 已完成真实外部 Research Provider；
- deterministic/in-memory fixture 已变成生产持久化；
- Acquisition Provider Spike 已结束。

---

## 当前 Gate：S4-N4 Scheduler / Headless Orchestration

当前活动 Contract：

`docs/04_CONTRACTS/SCHEDULER_ORCHESTRATION_CONTRACT.md`

### N4-A — exact-pin audit + Contract

**状态：COMPLETE**

exact-pinned Harness 审计结论：

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

已验证：

- `SchedulerRun` 业务 ID 与 Harness Session runtime metadata 分离；
- manual run idempotency / duplicate protection；
- 同 idempotency key 不允许绑定不同业务输入；
- timeout 时终止本次独占 headless runner process；
- explicit failure code / reason；
- credential/error redaction；
- execution/runtime provenance；
- exact-pin headless runner `--probe` CI seam；
- 不依赖 Web UI / iframe / DOM / private Harness API；
- N4 新测试不会向其他 Spike tests 泄漏 process-memory Research fixture 状态。

当前 `SchedulerRun` ledger 仍明确是 `transitional_in_memory`。**N4-C 完成 PostgreSQL durable Task/Run 前，不得宣称 Scheduler persistence 已完成。**

### N4-C — Durable Task / Run model

**状态：NEXT**

下一 Gate 是把当前已验证的 SchedulerRun contract 从 transitional in-memory ledger 迁入正式 repository / PostgreSQL，并建立 durable SchedulerTask / SchedulerRun schema、migration 与 repository tests；不改变 N4-A/B 已冻结的 SDK outward seam。

### N4 后续

```text
N4-C Durable Task / Run model
→ N4-D Interval / Schedule trigger
→ N4-E Retry / Catch-up / History
→ N4-F Event trigger + Product status UI
```

---

## S4-N5 后续

Product Shell 达到所需功能等价后：

- 删除 `apps/web`；或
- 明确降级为 dev-preview/reference 壳。

不允许长期维护两套生产入口。

---

## PR #14 处理

PR #14 的：

```text
apps/web
→ launch descriptor
→ surface_url
→ embedded / iframe Harness
```

已经 superseded，**不得合并为正式架构**。

已经吸收的设计思想：

- `research_case_id ↔ harness_session_id` 仅为 runtime binding；
- Session 丢失后允许新 Session + canonical Research Case rehydrate；
- 只使用公开 Harness runtime outward API；
- bootstrap / rebind 幂等；
- Harness runtime failure 不等于业务 Research Case 丢失。

明确废弃：

- iframe Harness；
- `embedded` transport；
- `surface_url` 作为正式 Product UI seam；
- `editorial_embed` / `editorial_launch` URL host 模式；
- 外部 `apps/web` 作为最终生产 Shell。

---

## 自动执行原则

标准业务动作不能要求用户进入 Harness 聊天框手工 prompt。

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

目前 Today / Opportunities / Research 的一部分集成仍使用 deterministic / in-memory Spike fixture。

不得因此宣称：

- 真实外部 Acquisition 已完成；
- PostgreSQL Opportunity / Research persistence 已完成；
- deterministic mock 是生产研究结果；
- API restart 后的 in-memory Research / runtime binding / SchedulerRun fixture 具备 durable persistence。

Product Shell / Runtime integration 的完成不自动完成业务持久化与真实采集。

---

## Acquisition Provider Spike 仍未关闭

Phase 0.5-B 必须继续独立验证：

- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery → reliable evidence follow-up。

HumanSubmission 不参加 Provider 胜负比较；它作为产品自身入口，复用最终选定 Provider 做 fetch / verification / research。

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

MVP 第一成功标准不是功能数量，而是：

1. 系统能主动发现真实值得看的内容；
2. 用户能把低结构化线索交给编辑部并得到可验证、可解释的 Opportunity；
3. 两类入口最终都形成可追溯 Human Decision；
4. Product Shell 与 Harness Runtime 不复制或破坏同一业务真相。
