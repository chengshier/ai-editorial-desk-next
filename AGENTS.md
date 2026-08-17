# AGENTS.md

本文件是所有 Codex、AI Agent 与开发者进入仓库后的强制执行规则。

## 1. 必读顺序

开始任何实现前必须依次阅读：

1. `docs/00_START_HERE.md`
2. `docs/CURRENT_STATE.md`
3. `docs/DECISIONS.md`
4. `docs/01_PRODUCT/FUNCTIONAL_SPEC.md`
5. `docs/01_PRODUCT/USER_JOURNEYS.md`
6. 当前任务涉及的 Product / Domain / Architecture / Contract 文档
7. 对应 ADR / Spike / Acceptance 文档

如果文档之间冲突，以顺序为：**ADR / DECISIONS > Contracts > Domain > Architecture > Product Design > Roadmap > 代码现状**。发现冲突时不得自行选择，应先更新文档或提出阻塞。

## 2. 核心业务边界

- 不恢复旧版 `Event → Trend → Score → DailyCandidate` 为 V1 主链。
- Event 只是 Subject 的一种 Legacy / specialized representation。
- Editorial Opportunity 是主要编辑判断单位，必须能够表达 Angle / Theme / Audience Promise / Why Now。
- Trend 是可选 feature；`Unavailable != 0`。
- Unknown 不是 Fact；`single_source != confirmed`。
- 不允许 AI 自动将 Claim 从未确认状态升级为 confirmed。
- Human Decision 必须 append-only，可追溯，不得被重新排名覆盖。
- Publication、Performance 不得反向静默修改历史 Evaluation / Decision。
- 不允许以“更容易爆”为理由牺牲 Hook–Fact Integrity。
- 不得把一个 0–100 total score 重新变成主要业务真相。

## 3. Acquisition 边界

- V1 Acquisition Core 是 Mission-driven / Search-first / Ambient / Targeted Retrieval / Targeted Platform Research。
- 固定平台 crawler、Legacy MediaCrawler 只能作为 Provider/Adapter，禁止再次成为主链入口。
- SearchProvider/FetchProvider/FeedProvider/PlatformProvider 必须通过统一 contract 与 Domain 解耦。
- Provider rank/score 不等于 Editorial Value。
- 每次 acquisition 必须保留 mission/query/source/provider/version/coverage 等 provenance。
- Provider 选型必须以 Spike 结果为依据；不得在 Spike 前写死某供应商。
- 禁止实现验证码破解、指纹伪造、自动换号、代理轮换等绕过平台限制的机制。

## 4. Harness / UI 边界

- PostgreSQL 为 System of Record。
- WeKnora 只通过 Knowledge Gateway / Provider 接入，不直接成为业务状态数据库。
- DeepSeek Harness 通过 profile / plugin / tool / capability seam 接入；默认不 fork、不修改 upstream core。
- Harness Tool 只调用 `apps/editorial_api`；不得直接访问 PostgreSQL、WeKnora 或 Provider SDK。
- Harness Session Log 是运行轨迹，不是 Subject/Candidate/Decision 的唯一事实源。
- Harness 当前属于 Developer Preview，必须隔离 compatibility layer，禁止把业务模型耦合进其内部实现。
- 在 Harness Integration Spike 完成前，不得假定复杂 Radar/Programming/Performance UI 一定能全由 Harness 实现。
- 如果 out-of-tree UI 扩展不足，优先评估 Hybrid Web + Harness，不得直接魔改 upstream core。

## 5. Legacy 边界

- Legacy 仓库只作为迁移来源与参考，不允许新代码运行时 import 旧仓库。
- 可复用能力必须重新通过 contract tests 与新领域边界验证。
- 不允许因为“旧版已经有表/接口”就复制其 Event/Trend/Score/Candidate 语义。

## 6. 开发流程

- 每个实现批次独立分支、独立 PR。
- PR 必须说明：目的、文档依据、数据模型变化、风险、测试、真实验证、未完成项。
- Domain / Contract 变化必须先更新对应文档和 ADR，再写代码。
- 版本化对象（rubric/schema/policy/tool contract/provider contract）不得无痕覆盖历史版本。
- 新增 AI 行为必须保存 model/provider/prompt/schema/policy/input hash/provenance。
- Spike 的目标是验证假设，不得把 mock/smoke 结果写成生产能力。

## 7. 当前阶段限制

Architecture + Functional Baseline v1 尚未进入完整业务实现阶段。允许：项目骨架、文档、接口占位、测试骨架、最小健康检查、Harness/Acquisition Spike 准备。禁止提前实现完整 Subject/Discovery/Opportunity 工作流，除非 `CURRENT_STATE.md` 已明确切换阶段。