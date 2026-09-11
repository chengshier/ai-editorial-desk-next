# AGENTS.md

本文件是所有 Codex、AI Agent 与开发者进入仓库后的强制执行规则。

## 1. 必读顺序

开始任何实现前必须依次阅读：

1. `docs/00_START_HERE.md`
2. `docs/CURRENT_STATE.md`
3. `docs/DECISIONS.md`
4. `docs/ADR/ADR-0010-harness-native-product-shell.md`
5. `docs/04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`
6. `docs/07_DELIVERY/S4_HARNESS_NATIVE_PRODUCT_SHELL_MIGRATION.md`
7. `docs/01_PRODUCT/FUNCTIONAL_SPEC.md`
8. `docs/01_PRODUCT/WORKBENCH_UX_SPEC.md`
9. 当前任务涉及的 Domain / Architecture / Contract 文档
10. 对应 ADR / Spike / Delivery 文档

如果文档之间冲突，以顺序为：**当前 Accepted ADR / DECISIONS > Active Contracts > CURRENT_STATE > Domain > Architecture > Functional Spec > Roadmap > 代码现状**。

标记为 `SUPERSEDED / HISTORICAL` 的 ADR/Contract 只能用于理解历史，不能覆盖活动 Contract。

## 2. 核心业务边界

- 不恢复旧版 `Event → Trend → Score → DailyCandidate` 为 V1 主链。
- Event 只是 Subject 的一种 Legacy / specialized representation。
- Editorial Opportunity 是主要编辑判断单位。
- Trend 是可选 feature；`Unavailable != 0`。
- **热度不是 Discovery/Opportunity/Candidate 的必经 Gate。** 必须允许 low/no-momentum but high-potential 内容进入后续流程。
- Attention/Momentum 与 Editorial Value 必须分离；热点可以低价值，非热点可以高价值。
- 非官方/社区内容可以作为 Discovery/Audience/Trend Signal，但不得未经 Research/Evidence 直接升级为 Confirmed Fact。
- Source Role 必须可区分 Discovery / Trend / Audience / Primary / Evidence / Contradiction / Material。
- Unknown 不是 Fact；`single_source != confirmed`。
- 不允许 AI 自动将 Claim 从未确认状态升级为 confirmed。
- Human Decision 必须 append-only，可追溯，不得被重新排名覆盖。
- Publication、Performance 不得反向静默修改历史 Evaluation / Decision。
- 不允许以“更容易爆”为理由牺牲 Hook–Fact Integrity。
- **Candidate 前必须能说明 Editorial Advantage**：系统相对原始信息新增了什么编辑价值；不要求信息本身独家或难以直接看到。

## 3. Acquisition 边界

- Acquisition Core 采用 Mission-driven，不得退回固定平台每天抓 N 条作为主发现策略。
- 至少支持 `ambient / potential / momentum / human / research` 五类 discovery lane。
- Potential Scout 用于主动发现尚未热门但有趣、有用、有故事、反常识或有长期潜力的内容。
- Momentum Radar 用于发现搜索/社区/平台/跨平台注意力变化。
- **Human Acquisition 是一等发现入口。** 正式 ingress 对象为 `HumanSubmission`，不得另建第二套 `HumanSignal` 事实体系。
- HumanSubmission 首版最低支持 URL + Text；Question / Idea / Observation 属于同一入口语义。
- HumanSubmission 只表示“值得系统看一眼”，不得自动视为 Confirmed Fact、正偏好标签、Opportunity、Candidate 或 Adopt。
- 必须区分 `source_origin` 与 `acquisition_origin`；用户提交第三方 URL 时原始 source 仍是第三方。
- 用户直接 assertion 且无外部来源时必须保持 unverified，并进入正常 Research/Evidence 流程。
- HumanSubmission 与机器采集共享同一个 RawSignal / Subject / Discovery / Evidence 主链与风险规则。
- Legacy crawler 只能作为 PlatformProvider/Adapter，不得决定新 Domain。
- Provider rank / trend velocity / fetched count 不等于 Editorial Value。
- Phase 0.5-B 未关闭前不得把具体 Search/Fetch/Trend/Community Provider 写死为不可替换依赖。

## 4. 当前 Harness / Product Shell 技术边界

当前正式架构是：

```text
DeepSeek Harness Web
├─ AI Editorial Desk Product Shell Plugin
├─ stock Harness workbench
└─ Agent Runtime / Session / Tool / Job

Editorial API / PostgreSQL
└─ canonical business truth
```

强制规则：

- PostgreSQL 为 System of Record。
- WeKnora 只通过 Knowledge Gateway / Provider 接入，不直接成为业务状态数据库。
- 正式 Product Shell 是 `integrations/harness/editorial-shell-package`，通过公开 Harness plugin/Slot/runtime seam 接入。
- stock Harness workbench 必须保留为自由 Agent / Session 工作台。
- DeepSeek Harness upstream core 默认禁止 fork/patch。
- 禁止 private Harness store / DOM click/query hack。
- 禁止把 iframe、`surface_url`、`embedded`、`editorial_embed` / `editorial_launch` 恢复为正式 Product Shell host。
- `apps/web` 只在 S4-N5 前作为 migration reference/regression baseline。
- Harness Tool / Product Shell 都调用稳定 Editorial API，不直连数据库。
- `opportunity_id / research_case_id / candidate_id / draft_id / publication_id` 是 canonical business IDs。
- Harness Session / Job / Workspace ID 只是 runtime metadata。
- Session 丢失不得导致业务对象丢失；必须允许 rebind / rehydrate。
- fresh Harness profile 无 Workspace 时，technical runtime Workspace 必须通过公开 `IWorkspaces` outward API 自动 bootstrap，不要求用户手工准备。
- 标准业务动作不得要求用户进入 stock Harness Chat 手工 prompt。

历史 ADR-0009 / `HYBRID_SHELL_CONTRACT.md` 已 superseded，不得作为当前宿主依据。

## 5. 开发流程

- 每个实现批次独立分支、独立 PR；当前 S4-N1→N5 统一在已存在的 PR #16 分支内按 Gate 推进，不另起同一批次重复分支，除非 `CURRENT_STATE.md` 明确改变计划。
- PR 必须说明：目的、文档依据、数据模型变化、风险、测试、未完成项。
- Domain / Contract 变化必须先更新对应文档和 ADR，再写代码。
- 版本化对象（rubric/schema/policy/tool contract）不得无痕覆盖历史版本。
- 新增 AI 行为必须保存 model/provider/prompt/schema/policy/input hash/provenance。
- Spike 是验证，不得为了让结果 PASS 偷偷实现未来正式系统或绕过 Contract。
- HumanSubmission 相关学习/校准必须使用 `Submission → Evaluation → Decision + reason` 完整 trajectory，禁止把 submission 本身当 positive label。
- Harness 相关改动必须重跑 exact-pin compatibility / bundle / isolated profile / browser Gate 中适用的部分。
- 不得把 deterministic/in-memory fixture 冒充 production persistence。

## 6. 当前阶段与 Gate

当前 S4 状态：

```text
S4-N1 Product Shell Foundation           COMPLETE / CI PASS
S4-N2 Today / Opportunities Migration    COMPLETE / CI PASS
S4-N3 Research Runtime Adapter           COMPLETE / CI PASS
S4-N4 Scheduler / Headless Orchestration NEXT
S4-N5 Web Shell Retirement               NOT_STARTED
```

当前只进入 **S4-N4**。

N4 开始前必须先审计 exact-pinned DeepSeek Harness 的公开 SDK / JSON-RPC / ACP / headless execution seam，不得从 private implementation 猜接口。

N4 允许：

- Scheduler / Orchestrator Contract；
- durable task/run model；
- Manual Run Now vertical slice；
- Schedule / interval / event trigger；
- retry / Catch-up / run history / Last Run / Next Run；
- Harness SDK / JSON-RPC / public headless adapter；
- 与 Product Shell 的运行状态 UI；
- 为 N4 所需的最小 backend persistence / API contract。

N4 禁止：

- 重新打开 iframe / Hybrid browser transport 设计；
- 把 runtime Session ID 变成 SchedulerTask/业务对象主键；
- 让用户 Chat prompt 成为 scheduled task 的执行机制；
- 未审计 upstream 就依赖 private Harness RPC；
- 借 N4 宣称 Phase 0.5-B Acquisition Provider 已完成；
- 未经用户明确要求合并 PR #16。

## 7. 并行未关闭工作流

Phase 0.5-B Acquisition Provider Spike 仍独立开放，必须验证：

- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery → reliable evidence follow-up。

除非 `CURRENT_STATE.md` 明确切换 Gate，否则不得把该 Provider 选型当作已冻结事实。
