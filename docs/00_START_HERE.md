# 00 — Start Here

**Architecture Baseline:** v1  
**Functional Baseline:** v1  
**Baseline date:** 2026-08-17  
**Human Acquisition amendment:** 2026-09-03  
**Harness UI architecture decision:** 2026-09-08  
**Repository:** `chengshier/ai-editorial-desk-next`

## 当前目标

Architecture + Functional Baseline v1 已合并。

Harness Integration / UI Gate 已通过 PR #2、#5–#9 完成，最终 UI 架构冻结为：

```text
HYBRID_WEB_HARNESS
```

当前产品推进主线：

```text
Hybrid Shell Contract
→ Web Shell foundation
→ Today / Opportunities
→ Harness-powered Research integration
→ Programming / Creation / Publication
```

并行工作流：

```text
Phase 0.5-B Acquisition Provider Spike
```

Shell 工作不能替代 Acquisition Provider Spike；Provider Spike 也不能重新打开已关闭的 Full-vs-Hybrid UI Gate。

## 必读顺序

1. `CURRENT_STATE.md`：当前阶段与允许/禁止事项。
2. `DECISIONS.md`：已冻结关键决策。
3. `01_PRODUCT/PRODUCT_VISION.md`：产品目标。
4. `01_PRODUCT/FUNCTIONAL_SPEC.md`：V1 与 MVP 要实现什么。
5. `01_PRODUCT/USER_JOURNEYS.md`：真实用户如何使用系统。
6. `01_PRODUCT/WORKBENCH_UX_SPEC.md`：工作台信息架构与 Human Submission 入口。
7. `01_PRODUCT/UI_PAGE_STATE_AND_GENERATION_MAP.md`：正式产品页面 / State / Overlay 划分。
8. `01_PRODUCT/GLOSSARY.md`：统一术语。
9. `02_DOMAIN/DOMAIN_MODEL.md`：核心领域模型。
10. `02_DOMAIN/EDITORIAL_VALUE_MODEL.md`：编辑价值判断语言。
11. `03_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`：系统边界。
12. `03_ARCHITECTURE/ACQUISITION_ARCHITECTURE.md`：Machine + Human Acquisition。
13. `03_ARCHITECTURE/HARNESS_INTEGRATION.md`：Harness 集成总则。
14. `03_ARCHITECTURE/HARNESS_RUNTIME_TOPOLOGY.md`：Web Shell / Harness / FastAPI 运行拓扑。
15. `03_ARCHITECTURE/HARNESS_UI_STRATEGY.md`：最终 Hybrid UI 策略。
16. `04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`：Web Shell ↔ Harness 路由、ID、launch/return、ownership。
17. `03_ARCHITECTURE/WEKNORA_INTEGRATION.md`：知识层边界。
18. `04_CONTRACTS/USE_CASE_CATALOG.md`：业务 Use Case 索引。
19. `04_CONTRACTS/HARNESS_API_CONTRACT.md`：Harness ↔ Backend 协议。
20. `04_CONTRACTS/ACQUISITION_PROVIDER_CONTRACT.md`：采集 Provider seam 与 Human ingress 边界。
21. `04_CONTRACTS/PROVENANCE_CONTRACT.md`：Source Origin / Acquisition Origin 与可回放要求。
22. `05_MIGRATION/LEGACY_REUSE_AUDIT.md`：旧项目复用策略。
23. `07_DELIVERY/IMPLEMENTATION_ROADMAP.md`：实施顺序与 MVP Vertical Slice。

进入实现前还必须阅读对应 ADR 与当前批次 Contract / Spike 文档。

当前特别重要：

- `ADR-0008-human-acquisition-entry.md`
- `ADR-0009-hybrid-web-shell-harness.md`

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

没有明显 Trend 的内容，只要足够有趣、有用、反常识、有故事性、保护价值、再解释价值或栏目潜力，也可以进入 Discovery / Opportunity。

> **Human Submission 不是正样本，也不是事实确认。**

用户把一条内容交给编辑部只表示“值得系统看一眼”。第三方 URL 的原始来源仍是第三方；必须区分 `source_origin` 与 `acquisition_origin = HUMAN_SUBMISSION`。

> **Candidate 必须有 Editorial Advantage。**

系统必须说明相对原始资料新增了什么编辑价值，例如查证、跨源连接、背景、Angle、Theme、受众连接、行动建议或后续回访钩子。

## Hybrid Web + Harness 基线

最终职责：

```text
AI Editorial Desk Web Shell
├─ Global IA / Router
├─ Today / Opportunities
├─ Programming / Creation / Publication
├─ Performance / Knowledge
├─ Management / Configuration
├─ Global Inspector / Search / Human Submission
└─ Harness launch / return orchestration

DeepSeek Harness
├─ Agent Conversation / Session / Replay
├─ Editorial Tools / ToolViews
├─ Background Jobs
└─ Research Workspace

Editorial Intelligence API / PostgreSQL
└─ canonical business truth
```

Harness exact-pin：

```text
99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
dsh@0.1.0-rc.7
```

PR #5–#9 已证明：Harness 很适合 Agent / Tool / Job / Research / Replay 与 Session-scoped complex workbench；但全局产品 Router / Programming / Publishing 等不应绑定 Agent Session。

因此不再以 Full Harness Workbench 为 V1 目标，也不得为了全局 Shell patch/fork upstream core。

## 产品 Route 基线

正式产品页面由 Web Shell 持有：

```text
/today
/opportunities
/research/:research_case_id
/programming
/creation
/publication
/performance
/knowledge
/manage/acquisition
/manage/configuration
/manage/system
```

产品 route 使用业务 ID；`harness_session_id` / Harness Job ID 仅是 runtime metadata。

详细见 `04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`。

## 当前 Gate

### Hybrid Shell Contract

先冻结：

- Shell / Harness / API ownership；
- route map；
- business id / runtime id 边界；
- Shell → Harness launch；
- Harness → Shell return；
- Research outer route / inner Harness surface；
- session 丢失后的 rehydrate；
- browser transport 与 Domain 隔离。

### Phase 0.5-B Acquisition Provider Spike

必须同时验证：

- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery → reliable evidence follow-up。

HumanSubmission 不参加 Provider 选型比较；它直接进入 MVP 并复用选定 Provider 做 fetch/research。

## MVP v0.1 一句话

**机器持续巡视世界，人负责随手投喂偶遇线索；系统把两类输入都变成可验证、可解释、可 Adopt/Watch/Drop 的编辑机会。**
