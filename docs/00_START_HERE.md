# 00 — Start Here

**Architecture Baseline:** v2  
**Functional Baseline:** v1  
**Baseline date:** 2026-08-17  
**Human Acquisition amendment:** 2026-09-03  
**Harness-native Product Shell decision:** 2026-09-10  
**Repository:** `chengshier/ai-editorial-desk-next`

## 当前目标

当前正式产品宿主已经从历史 `HYBRID_WEB_HARNESS` 路线切换并冻结为：

```text
HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL
```

当前拓扑：

```text
DeepSeek Harness Web
├─ AI Editorial Desk Product Shell Plugin
├─ stock Harness workbench
└─ Agent Runtime / Session / Tool / Job

Editorial API / PostgreSQL
└─ canonical business truth
```

旧的独立 `apps/web -> iframe/embedded Harness -> surface_url` 方向已经 superseded。`apps/web` 在 S4-N5 前只作为迁移参考和回归基线。

## 当前产品推进主线

```text
S4-N1 Product Shell Foundation           COMPLETE
→ S4-N2 Today / Opportunities Migration  COMPLETE
→ S4-N3 Research Runtime Adapter          COMPLETE
→ S4-N4 Scheduler / Headless Orchestration NEXT
→ S4-N5 Web Shell Retirement              NOT_STARTED
```

并行工作流仍然是：

```text
Phase 0.5-B Acquisition Provider Spike
```

S4 Product Shell 工作不能替代 Acquisition Provider Spike；Provider Spike 也不能改变已经冻结的 Product Shell host，除非未来新 ADR 明确重新决策。

## 必读顺序

1. `CURRENT_STATE.md`：当前阶段、Gate、允许/禁止事项。
2. `DECISIONS.md`：已冻结关键决策与 supersede 关系。
3. `ADR/ADR-0010-harness-native-product-shell.md`：当前 Product Shell 架构决策。
4. `04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`：当前活动 Harness/Product Contract。
5. `07_DELIVERY/S4_HARNESS_NATIVE_PRODUCT_SHELL_MIGRATION.md`：S4 N1→N5 迁移批次。
6. `01_PRODUCT/PRODUCT_VISION.md`：产品目标。
7. `01_PRODUCT/FUNCTIONAL_SPEC.md`：V1 与 MVP 要实现什么。
8. `01_PRODUCT/USER_JOURNEYS.md`：真实用户如何使用系统。
9. `01_PRODUCT/WORKBENCH_UX_SPEC.md`：结构化编辑工作台语义。
10. `01_PRODUCT/UI_PAGE_STATE_AND_GENERATION_MAP.md`：正式页面 / State / Overlay 划分。
11. `01_PRODUCT/GLOSSARY.md`：统一术语。
12. `02_DOMAIN/DOMAIN_MODEL.md`：核心领域模型。
13. `02_DOMAIN/EDITORIAL_VALUE_MODEL.md`：编辑价值判断语言。
14. `03_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`：系统边界。
15. `03_ARCHITECTURE/ACQUISITION_ARCHITECTURE.md`：Machine + Human Acquisition。
16. `03_ARCHITECTURE/HARNESS_INTEGRATION.md`：当前 Harness 集成总则。
17. `03_ARCHITECTURE/HARNESS_RUNTIME_TOPOLOGY.md`：Harness Web / Product Shell / FastAPI 运行拓扑。
18. `03_ARCHITECTURE/HARNESS_UI_STRATEGY.md`：当前 Product Shell UI 策略。
19. `03_ARCHITECTURE/WEKNORA_INTEGRATION.md`：知识层边界。
20. `04_CONTRACTS/USE_CASE_CATALOG.md`：业务 Use Case 索引。
21. `04_CONTRACTS/HARNESS_API_CONTRACT.md`：Harness ↔ Backend 协议。
22. `04_CONTRACTS/ACQUISITION_PROVIDER_CONTRACT.md`：采集 Provider seam。
23. `04_CONTRACTS/PROVENANCE_CONTRACT.md`：来源与可回放约束。
24. `07_DELIVERY/IMPLEMENTATION_ROADMAP.md`：整体 V1 路线。

历史背景需要时再读：

- `ADR/ADR-0009-hybrid-web-shell-harness.md` — SUPERSEDED；
- `04_CONTRACTS/HYBRID_SHELL_CONTRACT.md` — SUPERSEDED / HISTORICAL；
- PR #14 iframe/embedded integration — superseded，不得作为当前实现依据。

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

## 业务不变量

> **热度不是 Discovery Gate。**

Potential-driven 与 Momentum-driven Discovery 同等合法。

> **Human Submission 不是正样本，也不是事实确认。**

第三方 URL 的原始来源仍是第三方；必须区分 `source_origin` 与 `acquisition_origin = HUMAN_SUBMISSION`。

> **Candidate 必须有 Editorial Advantage。**

系统要说明相对原始资料新增的查证、连接、背景、Angle、Theme、受众价值或行动价值。

> **Harness Session 不是业务数据库。**

`opportunity_id / research_case_id / candidate_id / draft_id / publication_id` 是业务身份；Session / Job / Workspace ID 只属于 runtime metadata。

## Harness-native Product Shell 基线

正式包：

```text
integrations/harness/editorial-shell-package
@ai-editorial-desk/harness-editorial-shell
```

Harness exact-pin：

```text
99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
dsh@0.1.0-rc.7
Node 22.19.0
pnpm 11.7.0
```

当前已经证明：

- public root Slot 承载 Product Shell；
- stock Harness workbench 保留；
- Today / Opportunities / 五 Tab Inspector 迁移；
- `ed_*` Product state；
- Research Case ↔ Harness Session runtime binding；
- Session rebind / bootstrap / replay；
- fresh profile 无 Workspace 时通过公开 `IWorkspaces` 自动创建 dedicated runtime Workspace；
- Product action 不要求用户进入 Chat 手工 prompt；
- exact-pin / browser / ordinary CI 全绿。

## 当前 Gate：S4-N4

下一步不是再做 iframe transport，也不是重开 Full-vs-Hybrid 讨论，而是建立：

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

至少需要：enable/disable、schedule/interval、event/manual trigger、Catch-up、retry、Last Run / Next Run、run history。

## Transitional boundary

Today / Opportunities / Research 的部分数据当前仍是 deterministic / in-memory Spike fixture。

不得因此宣称：

- 真实外部 Acquisition 已完成；
- PostgreSQL Opportunity / Research persistence 已完成；
- deterministic mock 已经是生产研究结果；
- API restart 后的内存 fixture 已具备正式 durable persistence。

## MVP v0.1 一句话

**机器持续巡视世界，人负责随手投喂偶遇线索；系统把两类输入都变成可验证、可解释、可 Adopt/Watch/Drop 的编辑机会。**
