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
S4-N1 Product Shell Foundation          COMPLETE / CI PASS
S4-N2 Today / Opportunities Migration   IN_PROGRESS
S4-N3 Research Runtime Adapter          NOT_STARTED
S4-N4 Scheduler / Headless Orchestration NOT_STARTED
S4-N5 Web Shell Retirement              NOT_STARTED
```

## 当前正式架构

PR #15 证明并冻结新的最终宿主方向：

```text
DeepSeek Harness
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

AI Editorial Desk 与 stock Harness 工作台在同一个 Harness Web（当前本地 `3080`）中双向切换。AI Editorial Desk 默认作为结构化业务工作台；stock Harness 保留为自由 Agent / Session 工作台。

业务数据仍由 Editorial API / PostgreSQL 持有。Harness Session / Job / Replay 属于运行时对象，不得替代 `opportunity_id`、`research_case_id`、`candidate_id`、`draft_id`、`publication_id` 等业务主键。

---

## 当前 Gate：S4-N2 Today / Opportunities Migration

S4-N1 已通过正式 exact-pin Gate：

- `@ai-editorial-desk/harness-editorial-shell` 正式包；
- pinned Harness prepare / typecheck / bundle；
- isolated profile install；
- Harness `root` shadow + `sidebar.footer.action` 双向工作台切换；
- Editorial API Base `http://127.0.0.1:18000`；
- Browser smoke；
- 普通 CI / Harness Spike / Harness Editorial Shell 全绿。

S4-N2 当前正在把原 `apps/web` 的真实业务交互迁入正式 Product Shell，而不是复制外部 Web App：

- Today 使用 `/api/v1/spike/shell/opportunities` 读取当前真实 integration read model；
- Today 支持 Opportunity 选择、筛选与共享 Inspector；
- Opportunities 支持搜索、recommendation / research / readiness 筛选、排序、卡片/紧凑列表；
- Opportunity Inspector 保留概览 / 证据 / 研究 / 时间线 / 历史五个 Tab；
- 缺少 canonical Evidence / Timeline / Human Decision 时继续明确 unavailable，不伪造；
- “开始研究 / 进入研究”创建或复用业务 `research_case_id`；
- N2 只把 Research Case 带入 Product Shell 研究区，不宣称 Harness Agent 已执行；
- 产品状态通过 namespaced `ed_*` URL query + localStorage section 持久化，避免依赖 `react-router-dom`；
- Product Shell 不使用 iframe / `surface_url` / `editorial_embed`。

N2 Browser Gate：

```text
Today
→ 选择 Opportunity
→ 五 Tab Inspector
→ Opportunities 搜索/筛选
→ 创建/复用 Research Case
→ URL / UI 只暴露 rc_xxx 业务 ID
→ stock Harness
→ 返回 Product Shell
→ section / search 状态恢复
```

后续：

```text
S4-N3 Research Runtime Adapter
→ S4-N4 Scheduler / Headless Orchestration
→ S4-N5 Web Shell Retirement
```

完整边界见：

`docs/07_DELIVERY/S4_HARNESS_NATIVE_PRODUCT_SHELL_MIGRATION.md`

---

## PR #14 处理

PR #14 的 `apps/web -> launch descriptor -> embedded Harness iframe` 不再作为最终方向，不直接合并。

保留并迁移其设计思想：

- `research_case_id <-> harness_session_id` 仅为运行时绑定；
- Session 丢失后允许新建 Session 并从 canonical Research Case rehydrate；
- 仅使用公开 `sessions / workspaces / Session.prompt()` outward API；
- bootstrap / rebind 必须幂等；
- Harness runtime failure 不得被解释为 Research Case 丢失。

明确废弃：

- iframe Harness；
- `embedded` transport；
- `surface_url` 作为产品 UI 主接入；
- `editorial_embed` / `editorial_launch` URL 参数宿主模式；
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
→ Product UI
```

PR #15 已用 pinned Harness 真实 runtime + mock OpenAI-compatible provider 证明“无 Web UI 主动 prompt”可行。

自动任务必须配置化，至少支持：

- enable / disable；
- schedule / interval；
- condition trigger；
- manual run now；
- Catch-up；
- retry；
- Last Run / Next Run；
- run history。

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
- API restart 后的 in-memory Research fixture 具备 durable persistence。

正式迁移只改变 Product Shell / Runtime integration，不自动完成业务持久化与真实采集。

---

## Acquisition Provider Spike 仍未关闭

Phase 0.5-B 必须继续独立验证：

- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery -> reliable evidence follow-up。

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
4. AI Editorial Desk Product Shell 与 Harness Runtime 不复制或破坏同一业务真相。
