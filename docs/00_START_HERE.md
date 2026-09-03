# 00 — Start Here

**Architecture Baseline:** v1  
**Functional Baseline:** v1  
**Baseline date:** 2026-08-17  
**Human Acquisition amendment:** 2026-09-03  
**Repository:** `chengshier/ai-editorial-desk-next`

## 当前目标

Architecture + Functional Baseline v1 已通过 PR #1 合并。当前进入 **Phase 0.5 — Validation Spikes**，并在 MVP 开始前补充 Human Acquisition / HumanSubmission 这一等发现入口。

当前重点不是继续扩写大而全的架构，而是：

```text
Harness Integration Spike
+
Acquisition Provider Spike
+
HumanSubmission baseline
        ↓
MVP v0.1 Discovery Desk Vertical Slice
```

## 必读顺序

1. `CURRENT_STATE.md`：当前阶段与允许/禁止事项。
2. `DECISIONS.md`：已冻结关键决策。
3. `01_PRODUCT/PRODUCT_VISION.md`：产品目标。
4. `01_PRODUCT/FUNCTIONAL_SPEC.md`：V1 与 MVP 要实现什么。
5. `01_PRODUCT/USER_JOURNEYS.md`：真实用户如何使用系统。
6. `01_PRODUCT/WORKBENCH_UX_SPEC.md`：工作台信息架构与 Human Submission 入口。
7. `01_PRODUCT/GLOSSARY.md`：统一术语。
8. `02_DOMAIN/DOMAIN_MODEL.md`：核心领域模型。
9. `02_DOMAIN/EDITORIAL_VALUE_MODEL.md`：编辑价值判断语言。
10. `03_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`：系统边界。
11. `03_ARCHITECTURE/ACQUISITION_ARCHITECTURE.md`：Machine + Human Acquisition。
12. `03_ARCHITECTURE/HARNESS_INTEGRATION.md`：Harness 集成总则。
13. `03_ARCHITECTURE/HARNESS_RUNTIME_TOPOLOGY.md`：Harness 与 FastAPI 的真实连接方式。
14. `03_ARCHITECTURE/HARNESS_UI_STRATEGY.md`：Harness UI 决策门。
15. `03_ARCHITECTURE/WEKNORA_INTEGRATION.md`：知识层边界。
16. `04_CONTRACTS/USE_CASE_CATALOG.md`：业务 Use Case 索引。
17. `04_CONTRACTS/HARNESS_API_CONTRACT.md`：Harness ↔ Backend 协议。
18. `04_CONTRACTS/ACQUISITION_PROVIDER_CONTRACT.md`：采集 Provider seam 与 Human ingress 边界。
19. `04_CONTRACTS/PROVENANCE_CONTRACT.md`：Source Origin / Acquisition Origin 与可回放要求。
20. `05_MIGRATION/LEGACY_REUSE_AUDIT.md`：旧项目复用策略。
21. `07_DELIVERY/IMPLEMENTATION_ROADMAP.md`：实施顺序与 MVP Vertical Slice。

进入实现前还必须阅读对应 ADR 与 Acceptance/Spike 文档，尤其 `ADR-0008-human-acquisition-entry.md`。

## 新核心主链

```text
Machine Acquisition                 Human Acquisition
Feed / Search / Trend               HumanSubmission
Potential / Momentum                URL / Text / Question / Idea
        │                                  │
        └──────────────┬───────────────────┘
                       ↓
                    RawSignal
                       ↓
              SubjectObservation
                       ↓
                    Subject
                       ↓
                   Discovery
                       ↓
          EditorialOpportunity
                       ↓
        EditorialValueEvaluation
                       ↓
                   Research
                       ↓
                 CandidateV2
                       ↓
           EditorialProgramming
                       ↓
             HumanDecisionV2
                       ↓
                    Draft
                       ↓
                  Publication
                       ↓
                   Performance
                       ↓
             Learning / Calibration
```

## Acquisition 基线

```text
Ambient Coverage
+ Potential Scouts
+ Momentum Radar
+ Human Acquisition
+ Search-first Discovery
+ Targeted Fetch
+ Targeted Platform Research
```

五类 discovery lane：

```text
ambient   持续覆盖“有什么新东西”
potential 主动寻找“还没火，但可能值得讲”
momentum  发现“什么正在突然变热”
human     用户把自己刚看到/想到的线索交给编辑部
research  围绕已知 Opportunity 定向补证/补素材
```

固定平台 crawler 是 Provider，不是 Acquisition Core；HumanSubmission 不是 Provider，而是产品自身 ingress。

关键不变量：

> **热度不是 Discovery Gate。**

一个没有明显 Trend 的内容，只要足够有趣、有用、反常识、有故事性、具有保护价值、再解释价值或栏目潜力，也可以进入 Discovery / Opportunity。

同样，一个很热的内容也可能没有足够 Editorial Value。

> **Human Submission 不是正样本，也不是事实确认。**

用户把一条内容交给编辑部只表示“值得系统看一眼”。第三方 URL 的原始来源仍是第三方；必须区分 `source_origin` 与 `acquisition_origin = HUMAN_SUBMISSION`。

> **Candidate 必须有 Editorial Advantage。**

系统必须说明相对原始资料新增了什么编辑价值，例如查证、跨源连接、背景、Angle、Theme、受众连接、行动建议或后续回访钩子。我们追求 Editorial Advantage，不要求 Information Exclusivity。

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

如果 Developer Preview 的 UI/Runtime 扩展能力无法在明确时间盒内稳定满足需要，允许冻结为 `HYBRID_WEB_HARNESS`，不得无限阻塞 MVP。

## 当前 Gate

```text
Phase 0.5-A Harness Integration Spike
Phase 0.5-B Acquisition Provider Spike
```

Acquisition Spike 必须同时验证：
- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery → reliable evidence follow-up。

HumanSubmission 不参加 Provider 选型比较；它直接进入 MVP 并复用最终选定 Provider 做 fetch/research。

两个 Spike 给出足够结论后，优先进入 **MVP v0.1 Discovery Desk Vertical Slice**，而不是等待全部 Phase 顺序完成。

## MVP v0.1 一句话

**机器持续巡视世界，人负责随手投喂偶遇线索；系统把两类输入都变成可验证、可解释、可 Adopt/Watch/Drop 的编辑机会。**
