# AGENTS.md

本文件是所有 Codex、AI Agent 与开发者进入仓库后的强制执行规则。

## 1. 必读顺序

开始任何实现前必须依次阅读：

1. `docs/00_START_HERE.md`
2. `docs/CURRENT_STATE.md`
3. `docs/DECISIONS.md`
4. `docs/01_PRODUCT/FUNCTIONAL_SPEC.md`
5. `docs/01_PRODUCT/WORKBENCH_UX_SPEC.md`
6. 当前任务涉及的 Domain / Architecture / Contract 文档
7. 对应 ADR / Spike Spec

如果文档之间冲突，以顺序为：**ADR / DECISIONS > Contracts > Domain > Architecture > Functional Spec > Roadmap > 代码现状**。发现冲突时不得自行选择，应先更新文档或提出阻塞。

## 2. 核心边界

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
- 必须区分 `source_origin` 与 `acquisition_origin`；用户提交 Reddit URL 时 source 仍是 Reddit，acquisition origin 才是 `HUMAN_SUBMISSION`。
- 用户直接 assertion 且无外部来源时必须保持 unverified，并进入正常 Research/Evidence 流程。
- HumanSubmission 与机器采集共享同一个 RawSignal / Subject / Discovery / Evidence 主链与风险规则。
- Legacy MediaCrawler/custom connector 只能作为 PlatformProvider/Adapter，不得决定新 Domain。
- Provider rank / trend velocity / fetched count 不等于 Editorial Value。
- Provider Spike 前不得把具体 Search/Fetch/Trend/Community 供应商写死为不可替换依赖。

## 4. 技术边界

- PostgreSQL 为 System of Record。
- WeKnora 只通过本仓库 Knowledge Gateway / Provider 接入，不直接成为业务状态数据库。
- DeepSeek Harness 通过 profile / plugin / tool / capability seam 接入；默认不 fork、不修改 upstream core。
- Harness 当前属于 Developer Preview，必须隔离 compatibility layer，禁止把业务模型耦合进其内部实现。
- Harness 与 Editorial API 维持独立运行时；Harness Tool 通过稳定 API 调用 Domain Use Case，不直连数据库。
- 如果 Harness Full Workbench 无法在 Spike 时间盒内稳定验证，允许采用 Hybrid Web + Harness Runtime；不得为了 Full Workbench 无限 patch upstream。
- Legacy 仓库只作为迁移来源与参考，不允许新代码运行时 import 旧仓库。

## 5. 开发流程

- 每个实现批次独立分支、独立 PR。
- PR 必须说明：目的、文档依据、数据模型变化、风险、测试、未完成项。
- Domain / Contract 变化必须先更新对应文档和 ADR，再写代码。
- 版本化对象（rubric/schema/policy/tool contract）不得无痕覆盖历史版本。
- 新增 AI 行为必须保存 model/provider/prompt/schema/policy/input hash/provenance。
- Spike 是验证，不得为了让结果 PASS 偷偷实现未来正式系统或绕过 Contract。
- HumanSubmission 相关学习/校准必须使用 `Submission → Evaluation → Decision + reason` 完整 trajectory，禁止把 submission 本身当 positive label。

## 6. 当前阶段限制

Architecture + Functional Baseline v1 已合并。当前阶段是 **Phase 0.5 Validation Spikes**，并为 MVP v0.1 补充 Human Acquisition baseline。

允许：
- Harness Integration Spike 所需 mock/adapter/profile/compatibility code；
- Acquisition Provider Spike 所需 adapter/benchmark harness/真实 Mission 采样；
- HumanSubmission 的文档、契约、最小接口设计；
- 为 MVP Vertical Slice 实现必要的最小 Foundation Contracts。

禁止：
- 把 Spike mock 冒充正式业务实现；
- 为 Spike 建立不可逆正式业务表；
- 在 Harness Spike 结论前假定复杂 Dashboard 一定能由 Harness 完整承担；
- 在 Acquisition Spike 前假定某个 Provider 组合已经胜出；
- 为了赶 MVP 跳过 source/acquisition provenance、Evidence 或 Human Decision append-only 规则。

除非 `CURRENT_STATE.md` 已明确切换阶段，否则不得越过 Gate。
