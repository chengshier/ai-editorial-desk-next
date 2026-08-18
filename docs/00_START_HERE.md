# 00 — Start Here

**Architecture Baseline:** v1  
**Functional Baseline:** v1  
**Baseline date:** 2026-08-17  
**Repository:** `chengshier/ai-editorial-desk-next`

## 当前目标

本仓库正在冻结 AI Editorial Desk Next 的第一版完整基线：不仅定义“核心对象和技术边界”，还明确 V1 的功能、用户旅程、Workbench 信息架构、Harness 物理连接方式、Acquisition 采集模型和下一阶段验证 Gate。

在这些内容冻结前，不进入大规模业务实现。

## 必读顺序

1. `CURRENT_STATE.md`：当前阶段与允许/禁止事项。
2. `DECISIONS.md`：已冻结关键决策。
3. `01_PRODUCT/PRODUCT_VISION.md`：产品目标。
4. `01_PRODUCT/FUNCTIONAL_SPEC.md`：V1 要实现什么。
5. `01_PRODUCT/USER_JOURNEYS.md`：真实用户如何使用系统。
6. `01_PRODUCT/WORKBENCH_UX_SPEC.md`：工作台信息架构与交互原则。
7. `01_PRODUCT/GLOSSARY.md`：统一术语。
8. `02_DOMAIN/DOMAIN_MODEL.md`：核心领域模型。
9. `02_DOMAIN/EDITORIAL_VALUE_MODEL.md`：编辑价值判断语言。
10. `03_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`：系统边界。
11. `03_ARCHITECTURE/ACQUISITION_ARCHITECTURE.md`：Mission-driven Acquisition。
12. `03_ARCHITECTURE/HARNESS_INTEGRATION.md`：Harness 集成总则。
13. `03_ARCHITECTURE/HARNESS_RUNTIME_TOPOLOGY.md`：Harness 与 FastAPI 的真实连接方式。
14. `03_ARCHITECTURE/HARNESS_UI_STRATEGY.md`：Harness UI 决策门。
15. `03_ARCHITECTURE/WEKNORA_INTEGRATION.md`：知识层边界。
16. `04_CONTRACTS/USE_CASE_CATALOG.md`：业务 Use Case 索引。
17. `04_CONTRACTS/HARNESS_API_CONTRACT.md`：Harness ↔ Backend 协议。
18. `04_CONTRACTS/ACQUISITION_PROVIDER_CONTRACT.md`：采集 Provider seam。
19. `05_MIGRATION/LEGACY_REUSE_AUDIT.md`：旧项目复用策略。
20. `07_DELIVERY/IMPLEMENTATION_ROADMAP.md`：实施顺序。

进入实现前还必须阅读对应 ADR 与 Acceptance/Spike 文档。

## 新核心主链

```text
Acquisition Network
→ RawSignal
→ SubjectObservation
→ Subject
→ Discovery
→ EditorialOpportunity
→ EditorialValueEvaluation
→ Research
→ CandidateV2
→ EditorialProgramming
→ HumanDecisionV2
→ Draft
→ Publication
→ Performance
→ Learning / Calibration
```

## Acquisition 基线

```text
Ambient Coverage
+ Potential Scouts
+ Momentum Radar
+ Search-first Discovery
+ Targeted Fetch
+ Targeted Platform Research
```

四类 discovery lane：

```text
ambient   持续覆盖“有什么新东西”
potential 主动寻找“还没火，但可能值得讲”
momentum  发现“什么正在突然变热”
research  围绕已知 Opportunity 定向补证/补素材
```

固定平台 crawler 是 Provider，不是 Acquisition Core。

关键不变量：

> **热度不是 Discovery Gate。**

一个没有明显 Trend 的内容，只要足够有趣、有用、反常识、有故事性、具有保护价值、再解释价值或栏目潜力，也可以进入 Discovery / Opportunity。

同样，一个很热的内容也可能没有足够 Editorial Value。

发现来源与事实证据来源必须分开。社区/非官方来源可以承担 `DISCOVERY_SIGNAL / TREND_SIGNAL / AUDIENCE_SIGNAL`，后续再通过 `PRIMARY_SOURCE / EVIDENCE_SOURCE / CONTRADICTION_SOURCE` 完成事实核验。

## Harness 基线

```text
DeepSeek Harness (Node / TypeScript)
→ Editorial Tools
→ HTTPS/JSON (+ SSE/轮询)
→ FastAPI Editorial Intelligence API
→ Domain Services / PostgreSQL
```

Harness 是首选 Agent Workbench，但复杂 Radar / Programming / Performance UI 是否完全由 Harness 承担，必须通过 Harness Integration Spike。

## 下一 Gate

PR #1 合并后先执行：

```text
Phase 0.5-A Harness Integration Spike
Phase 0.5-B Acquisition Provider Spike
```

Acquisition Spike 必须同时验证：
- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery → reliable evidence follow-up。

两个 Spike 的结论冻结后才进入 **Phase 1 — Foundation Contracts**。

## 一句话边界

**持续发现“值得讲的东西”，既不局限于热点，也不把社区噪声直接当事实。**
