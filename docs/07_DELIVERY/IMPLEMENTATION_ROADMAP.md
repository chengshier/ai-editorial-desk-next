# Implementation Roadmap

这不是旧项目的 M6。它是新仓库的 V1 delivery plan。

## Phase 0 — Architecture + Functional Baseline

已冻结：
- Product Vision / Functional Spec / User Journeys / Workbench UX；
- Domain / Editorial Value / State / Provenance；
- Harness Runtime / API / UI Strategy；
- Mission-driven Acquisition / Provider Contract；
- Human Acquisition / HumanSubmission；
- WeKnora / Knowledge boundary；
- Legacy reuse map；
- ADR / AGENTS / Acceptance / project skeleton。

**状态：COMPLETE / MERGED（PR #1）。**

## Phase 0.5 — Validation Spikes

在业务模型大规模实现前先验证两个高风险外部边界。

### 0.5-A Harness Integration Spike
验证：Tool → FastAPI、Opportunity Card、Research Job/Conversation Node、复杂全局 UI 扩展能力。

输出必须选择：
- `HARNESS_FULL_WORKBENCH`；或
- `HYBRID_WEB_HARNESS`。

Harness Developer Preview 不允许无限阻塞产品。若 Full Workbench 所需扩展点无法在明确时间盒内稳定验证，应保留 Harness Agent Runtime，并采用 Hybrid Web Workbench 继续 MVP。

### 0.5-B Acquisition Provider Spike
使用真实 Discovery Missions 比较 Platform-first、Search-first、Search+Fetch、Feed/Ambient、Community/Trend 等组合。

必须同时验证：
- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery → reliable evidence follow-up。

核心指标是 Editorial Discovery Yield、Source Quality、Cost、Latency、Maintainability，而不是抓取条数。

输出 V1 Provider 组合与 fallback strategy。

HumanSubmission 不属于外部 Provider 竞争项；它是产品自身的一等 Acquisition ingress，并在 MVP 中直接复用选定的 Fetch/Research Provider。

## MVP v0.1 — Discovery Desk Vertical Slice

两个 Spike 给出足够结论后，不等待完整 Phase 1→7 全部独立完成，优先做一条真实可用纵向闭环。

最低入口：

```text
Machine Acquisition
├─ Feed/Ambient
├─ Potential Scout
└─ Momentum/Community minimum

Human Acquisition
└─ HumanSubmission: URL + Text
```

共同进入：

```text
RawSignal
→ Subject / Discovery
→ Editorial Opportunity
→ Value Evaluation
→ Research / Evidence / Unknown
→ Candidate
→ Adopt / Watch / Drop
```

MVP Workbench 至少提供：
- Today / Radar；
- Emerging / Momentum；
- Potential / Worth a Look；
- Human Submission 入口；
- Opportunity Detail；
- Research；
- Adopt / Watch / Drop。

MVP v0.1 不以 Draft / Publication / Performance / WeKnora / Controlled Evolution 为阻塞条件。

MVP 的核心成功点：系统能在没有预先喂答案的情况下主动发现至少一批用户真实认为“值得看/值得做”的内容，同时能把用户随手投喂的线索转化成可验证、可解释、可决策的 Opportunity。

## Phase 1 — Foundation Contracts

实现纯领域 value objects、枚举、Pydantic schemas、repository ports、provenance/version primitives、migration test fixtures。

重点：HumanSubmission、Subject、Observation、Discovery、Opportunity、Evaluation Contract、EditorialProfile、Research primitives。

此阶段不先实现完整 UI，不让 Provider SDK 进入 Domain。

## Phase 2 — Persistence & Legacy Bridge

PostgreSQL/Alembic、核心 repository；实现 Legacy RawSignal/Event 只读 bridge 和必要的 import/backfill 工具。

旧 Event 可映射到 `Subject(type=EVENT)`，但不恢复旧主链。

HumanSubmission / RawSignal / source_origin / acquisition_origin 必须可追溯，不得把“用户提交”覆盖成内容原始来源。

## Phase 3 — Acquisition Network

实现 Provider seams 与 Spike 选定的 V1 Provider：
- Feed/Ambient Sensor；
- Discovery Scout；
- SearchProvider；
- FetchProvider；
- Targeted PlatformProvider；
- TrendProvider minimum；
- HumanSubmission ingress；
- coverage / budget / risk / provenance。

迁移旧版可复用 Source/RawSignal/Checkpoint/Budget/Risk Guard 能力，但不复制 Platform-first 产品逻辑。

## Phase 4 — Opportunity Intelligence

Discovery generation、Angle/Theme/Audience Promise generation、Value Evaluation v1、Research Gap、Editorial Advantage、pairwise comparison。建立可 replay 的 evaluation runner。

## Phase 5 — Evidence & Research

迁移 Evidence 语义并 generalize；ResearchCase、KnowledgeGateway、WeKnora Provider、外部检索/知识库 provenance。

Research 可以按 Gap 再次调用 Acquisition Provider，形成“发现/投喂 → 判断 → 定向补证 → 重新评价”闭环。

## Phase 6 — Candidate & Programming

CandidateV2、ProgrammingContext、Series Fit、Today Slate、Evergreen、HumanDecisionV2。

不建立一个永久全局 TOP 榜作为唯一工作流。

HumanSubmission 本身不得作为 Candidate 或偏好标签；后续 Decision + reason 才进入 Calibration 数据。

## Phase 7 — Product Workbench

根据 Phase 0.5-A ADR 落地：

- Harness Full Workbench；或
- Hybrid Web + Harness Workspace。

必须打通：Today/Radar、Human Submission、Opportunity Detail、Research、Pairwise Compare、Programming、Decision。

## Phase 8 — Draft / Publication / Performance

迁移旧版成熟的 citation/risk/version/provenance；打通真实 Draft version chain、Publication 与 Performance snapshot。

## Phase 9 — Calibration & Controlled Evolution

Gold Set、replay A/B、policy proposal、human approval、promotion gates；禁止 silent self-mutation。

HumanSubmission → Evaluation → HumanDecision + reason 可作为重要 Calibration trajectory，但 Submission 本身不能被当作 positive label。

## 每个 Phase 的通用要求

- 独立分支/PR；
- 先更新对应 Domain/Contract/ADR 再改语义；
- exact-head CI；
- 明确真实验证与未验证项；
- 不把 provider smoke 当作产品价值验收；
- 保持所有 AI/Decision/Publication provenance 可重建。
