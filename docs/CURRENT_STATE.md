# Current State

## 状态

`ARCHITECTURE_FUNCTIONAL_BASELINE_V1_IN_PROGRESS`

当前分支 `docs/architecture-baseline-v1` 正在冻结：
- Architecture Baseline v1；
- Functional/Product Baseline v1；
- Harness Integration Contract v1；
- Mission-driven Acquisition v1；
- 项目骨架与执行规则。

## 已确认

- 新仓库独立演化，旧 `ai-editorial-desk` 冻结为 Legacy MVP/reference。
- 新核心以 Subject / Discovery / Editorial Opportunity 为中心。
- Editorial Opportunity 是 Value Evaluation 与 Candidate V2 的直接业务对象。
- Editorial Value 采用版本化 Profile，不以单个 0–100 总分作为业务真相。
- Trend 从前置必需步骤降级为可选 Feature Provider。
- Acquisition 改为 Mission-driven：Ambient Coverage + Potential Scouts + Momentum Radar + Search-first + Targeted Fetch + Targeted Platform Research。
- **热度不是 Discovery Gate**：未升温但本身有趣、有用、有故事、反常识、保护价值或再解释潜力的内容可以进入 Discovery/Opportunity。
- Reddit/论坛/社区等非官方来源允许作为 Discovery/Audience/Trend Signal；事实确认仍遵守 Evidence/Primary Source 规则。
- 固定平台 crawler/Legacy MediaCrawler 只允许作为 PlatformProvider/Adapter，不是 Acquisition Core。
- DeepSeek Harness 作为首选 Product Runtime / Agent Workbench，通过插件/工具/HTTPS API 接入 Core。
- Harness 是否承担全部复杂 Radar/Programming/Performance UI，须通过 Harness Integration Spike 决定。
- PostgreSQL 是 System of Record。
- WeKnora 是 Knowledge Provider，通过 Knowledge Gateway 接入。
- Evidence、Decision、Publication、Performance 的审计语义尽量继承旧版成熟原则。

## 此阶段允许

- 文档、ADR、Use Case、数据契约、状态机、项目结构。
- `/healthz`、mock endpoint 等最小运行骨架。
- Legacy 读取与迁移方案设计。
- Harness/WeKnora compatibility interface 设计。
- Acquisition/Harness Spike 的设计文档与最小验证代码。

## 此阶段禁止

- 提前完整实现 Subject/Discovery/Opportunity 业务表与服务。
- 把旧 Event/Trend/Score 模型复制到新仓库后继续作为主链。
- 把固定平台每天抓 N 条作为 V1 核心发现方式。
- 把“快速升温”设成所有 Discovery 的必要条件。
- 因来源非官方就直接丢弃 Community Signal，或把社区热帖直接当作 Confirmed Fact。
- 在 Provider Spike 前把 Exa/Firecrawl/Crawl4AI/MediaCrawler/Trend Provider 等具体实现锁死为不可替换基础设施。
- 直接 fork/魔改 DeepSeek Harness core 来满足复杂 UI。
- 将 Candidate/Decision/Publication 真相写到 WeKnora 或 Harness Session。
- 为了“先跑起来”跳过 provenance/versioning。

## Baseline Exit Gate

PR #1 合并前至少应具备：
- Product Vision / Functional Spec / User Journeys / Workbench UX；
- Domain / Value / State / Provenance contracts；
- Harness runtime/API/UI strategy；
- Acquisition architecture/provider contract，明确 Potential/Momentum 双通道与 Source Role；
- Legacy reuse audit；
- Implementation Roadmap / Acceptance / Spike specs；
- AGENTS/ADR 执行约束。

## 下一 Gate

Baseline 合并后先进入 **Phase 0.5 — Validation Spikes**：

1. Harness Integration Spike；
2. Acquisition Provider Spike。

Acquisition Spike 必须同时验证：
- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery → reliable evidence follow-up。

Spike 输出用于冻结 UI 形态与 V1 Provider 组合。随后再进入 **Phase 1 — Foundation Contracts**，实现核心 schema/value objects/repository ports/provenance primitives。
