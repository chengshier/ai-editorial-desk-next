# AGENTS.md

本文件是所有 Codex、AI Agent 与开发者进入仓库后的强制执行规则。

## 1. 必读顺序

开始任何实现前必须依次阅读：

1. `docs/00_START_HERE.md`
2. `docs/CURRENT_STATE.md`
3. `docs/DECISIONS.md`
4. 当前任务涉及的 Domain / Architecture / Contract 文档
5. 对应 ADR

如果文档之间冲突，以顺序为：**ADR / DECISIONS > Contracts > Domain > Architecture > Roadmap > 代码现状**。发现冲突时不得自行选择，应先更新文档或提出阻塞。

## 2. 核心边界

- 不恢复旧版 `Event → Trend → Score → DailyCandidate` 为 V1 主链。
- Event 只是 Subject 的一种 Legacy / specialized representation。
- Editorial Opportunity 是主要编辑判断单位。
- Trend 是可选 feature；`Unavailable != 0`。
- Unknown 不是 Fact；`single_source != confirmed`。
- 不允许 AI 自动将 Claim 从未确认状态升级为 confirmed。
- Human Decision 必须 append-only，可追溯，不得被重新排名覆盖。
- Publication、Performance 不得反向静默修改历史 Evaluation / Decision。
- 不允许以“更容易爆”为理由牺牲 Hook–Fact Integrity。

## 3. 技术边界

- PostgreSQL 为 System of Record。
- WeKnora 只通过本仓库 Knowledge Gateway / Provider 接入，不直接成为业务状态数据库。
- DeepSeek Harness 通过 profile / plugin / tool / capability seam 接入；默认不 fork、不修改 upstream core。
- Harness 当前属于 Developer Preview，必须隔离 compatibility layer，禁止把业务模型耦合进其内部实现。
- Legacy 仓库只作为迁移来源与参考，不允许新代码运行时 import 旧仓库。

## 4. 开发流程

- 每个实现批次独立分支、独立 PR。
- PR 必须说明：目的、文档依据、数据模型变化、风险、测试、未完成项。
- Domain / Contract 变化必须先更新对应文档和 ADR，再写代码。
- 版本化对象（rubric/schema/policy/tool contract）不得无痕覆盖历史版本。
- 新增 AI 行为必须保存 model/provider/prompt/schema/policy/input hash/provenance。

## 5. 当前阶段限制

Architecture Baseline v1 尚未进入完整业务实现阶段。允许：项目骨架、文档、接口占位、测试骨架、最小健康检查。禁止提前实现完整 Subject/Discovery/Opportunity 工作流，除非 `CURRENT_STATE.md` 已明确切换阶段。
