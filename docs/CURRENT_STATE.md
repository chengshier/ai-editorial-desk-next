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
S4-N3 Research Runtime Adapter           IN_PROGRESS
S4-N4 Scheduler / Headless Orchestration NOT_STARTED
S4-N5 Web Shell Retirement               NOT_STARTED
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

## 当前 Gate：S4-N3 Research Runtime Adapter

S4-N1 / N2 已通过正式 exact-pin Gate：

- `@ai-editorial-desk/harness-editorial-shell` 正式包；
- pinned Harness prepare / typecheck / bundle；
- isolated profile install；
- Harness `root` shadow + `sidebar.footer.action` 双向工作台切换；
- Today / Opportunities 真实业务交互迁入 Product Shell；
- 五 Tab Opportunity Inspector；
- 搜索 / 筛选 / 排序 / 卡片与紧凑列表；
- Research Case 创建 / 复用；
- namespaced `ed_*` Product state；
- 普通 CI / Harness Spike / Harness Editorial Shell 全绿。

S4-N3 当前正在建立正式 Runtime Adapter：

```text
Product Shell Research Case
→ HarnessRuntimeAdapter
→ Research Case ↔ Harness Session runtime binding
→ ctx.sessions / ctx.workspaces
→ Session.prompt()
→ get_editorial_research_result
→ durable Harness Tool Result / replay
```

当前已落地：

- `/api/v1/integrations/harness/runtime/research/{research_case_id}` runtime binding；
- Session bind / rebind / bootstrap-complete 契约；
- Session 更换后 bootstrap 自动重新 required；
- Product Shell 使用公开 `ctx.sessions` / `ctx.workspaces` outward API；
- 已绑定 Session 存在时复用；不存在时从 Workspace `connectWorkspace()` 获取新 Session 并重新绑定；
- Research Case 完成后由 Product Shell 主动调用 `Session.prompt()`，不要求用户进入聊天框手工 prompt；
- 正式插件 Host 侧注册 `get_editorial_research_result`，只读取既有 Research Case，不迁入会重复创建 Case 的 `start_editorial_research`；
- bootstrap 只有在 Session durable log 中出现对应 Research Case 的结构化 Tool Result 后才标记完成；
- Harness Session ID 只作为 runtime metadata 展示，不进入 Product business URL。

N3 当前自动化 Gate 分两层：

```text
1. 无模型密钥 CI：
   Product action → Research Case → 自动获得 Harness Session binding
   且 business URL 不出现 Session ID

2. 有模型 Runtime：
   Session.prompt() → get_editorial_research_result
   → durable Tool Result → bootstrap complete
```

无模型密钥的 CI 不得伪装成“真实 Research Agent 已完成”。若 Harness Provider 未配置，Product Shell 保留 Research Case 并显示 Runtime Error，可在配置模型后重新连接。

后续：

```text
S4-N3 complete gate
→ S4-N4 Scheduler / Headless Orchestration
→ S4-N5 Web Shell Retirement
```

完整边界见：

`docs/07_DELIVERY/S4_HARNESS_NATIVE_PRODUCT_SHELL_MIGRATION.md`

---

## PR #14 处理

PR #14 的 `apps/web -> launch descriptor -> embedded Harness iframe` 不再作为最终方向，不直接合并。

已吸收 / 正在吸收其设计思想：

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
- API restart 后的 in-memory Research / runtime binding fixture 具备 durable persistence。

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
