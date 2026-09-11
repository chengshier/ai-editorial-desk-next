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
Windows final local smoke                PASS
```

N3 收口 head：`5fcc37dd1800087f564abb0dea5a70d8dbf9662a`。  
N4-B 收口 head：`6dc7a883cec849e25509cbc5f085ac351e3383de`。  
N4-D 收口 head：`ead02f8c3f3623f90c5ab7d51b1599d0d78fa497`。  
N4-E 收口验证 head：`ecb15704372767cc267a3834d6c03d7370f25b41`。  
N4-F / N4 完整收口验证 head：`06ca19f629d22b39f28948c11ac10744feafa04b`。  
N5 / S4 工程收口验证 head：`280e7c9b2ba3a9bf7019b94b85e4acf0d4c213f6`。  
Windows native-picker 兼容修复与最终自动化验证 head：`a56b7b9bbe8844df88fed7071f2827dcc0b672b5`。

最终自动化 workflow 全绿：

```text
CI                         #289 PASS
Harness Spike              #243 PASS
Harness Editorial Shell    #151 PASS
Harness Native Shell Spike #157 PASS
```

Windows 最终本地 smoke 已完成：Pinned Harness Web `:3080` 正常启动；Today / Opportunities / Opportunity Inspector 可用；fresh profile 下 native directory picker 回退可用；Workspace / Session 自动 bootstrap；Research Case 恢复到 `Runtime Ready` 并保留 durable Tool Result replay；Product Shell ↔ stock Harness 双向切换正常；两种模式 F5 后状态保持，无持续白屏或 `Failed to load plugins`。

因此 S4 的仓库级工程 Gate 与 Windows 人工 acceptance 均已完成。PR #16 可从 Draft 转 Ready；合并仍需用户明确确认。

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

## S4 已完成工程 Gate

### S4-N3 Research Runtime Adapter

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

已验证 runtime binding/rebind/bootstrap-complete、public `IWorkspaces` fresh-profile bootstrap、Windows native picker fallback、自动 `Session.prompt()`、只读 canonical Research Tool，以及 runtime failure 不删除业务 Research Case。

### S4-N4 Scheduler / Headless Orchestration

正式执行图：

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

N4-A 至 N4-F 已全部完成：exact-pin audit、Manual Run、PostgreSQL durable Task/Run、interval trigger、retry/catch-up/history、`research.completed` event trigger 与 Product Shell Scheduler status projection。

关键不变量：

- `@deepseek-ai/dsh-sdk-client` + subprocess + stdio JSON-RPC 为主 headless seam；
- Scheduler business identity 与 Harness runtime metadata 分层；
- PostgreSQL UNIQUE idempotency；
- schedule/event occurrence key 稳定；
- retry 保持同一 logical Run，仅递增 attempt；
- Product Shell 状态从 Editorial API canonical projection 读取，不从 Harness transcript 猜测。

### S4-N5 Web Shell Retirement

最终状态：

```text
apps/web = RETIRED_AS_PRODUCTION_HOST
apps/web = MIGRATION_REFERENCE_ONLY
formal product host = DeepSeek Harness Product Shell
```

已验证：

- `apps/web/README.md` 与 package metadata 明确 reference-only；
- standalone 页面显示 legacy migration reference notice；
- legacy Web build 仅作为 migration/regression reference；
- architecture / delivery / tests 保持单一 production host；
- formal Product acceptance 继续由 exact-pin Harness Product Shell browser / native-shell Gate 承担；
- head `a56b7b9bbe8844df88fed7071f2827dcc0b672b5` 四套 workflow 全部 PASS；
- Windows 最终本地 smoke PASS。

物理删除 `apps/web` 不属于 PR #16 的必需条件，可在后续独立 cleanup PR 中执行。

---

## PR #14 处理

PR #14 的 iframe / `embedded` transport / `surface_url` 路线已经 superseded，**不得合并为正式架构**。

已吸收：Research Case ↔ Session runtime binding、Session 丢失后 rehydrate、公开 outward API、bootstrap/rebind 幂等、runtime failure 不等于业务对象丢失。

明确废弃：iframe Harness、`embedded` transport、`surface_url` 正式 Product UI seam、`editorial_embed` / `editorial_launch` URL host 模式、外部 `apps/web` 最终生产 Shell。

---

## 合并 Gate

PR #16 的自动化 Gate 与 Windows 本地 smoke 均已 PASS，可从 Draft 转 Ready。合并动作仍需用户明确确认，不自动执行。

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
