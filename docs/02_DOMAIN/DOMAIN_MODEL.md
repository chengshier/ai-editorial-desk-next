# Domain Model v1

## 主链

```text
Source / Connector
   ↓
RawSignal ──────────────┐
   ↓                    │ provenance
SubjectObservation      │
   ↓                    │
Subject                 │
   ↓                    │
Discovery               │
   ↓                    │
EditorialOpportunity ◄──┘
   ↓
EditorialValueEvaluation
   ↓              ↘
ResearchCase       Watch / Store
   ↓
Re-evaluation
   ↓
CandidateV2
   ↓
ProgrammingRun / Slate
   ↓
HumanDecisionV2
   ↓
OpportunityBrief / ResearchPack
   ↓
Draft
   ↓
Publication
   ↓
PerformanceSnapshot
```

## Subject

Subject 保存“是什么”，不保存“为什么值得讲”。事件合并/聚类只是构建 EVENT Subject 的一种方法。

建议实体字段方向：canonical name、type、aliases、language、summary、canonical keys、status、created provenance。正式表结构在 Foundation Contracts 阶段冻结。

## Discovery

Discovery 是时间与上下文敏感的观察，必须保留 `mission`、`trigger`、`why_noteworthy`、source observation refs、objective signal snapshot、policy/version 与 discovered_by。

## EditorialOpportunity

Opportunity 是新系统最重要的业务对象。V1 至少表达：

- `subject_refs`
- `discovery_refs`
- `angle`
- `theme`
- `audience_promise`
- `why_now`
- `target_audience/profile`
- `status`
- provenance/version

同一 Subject + Discovery 可以生成多个 Opportunity；不同 Angle/Theme 不得覆盖为同一条历史记录。

## Research

Research 不是“额外搜索按钮”，而是由显式 Gap 驱动的工作流。Gap 可包括：事实确认、反证、定义、数据、图片/视频、流传度、人物背景、当地语境、版权/素材可用性、风险。

## CandidateV2

CandidateV2 绑定 Opportunity，而不是 Event。它保存某次 evaluation/programming context 下的候选快照，允许同一 Opportunity 在不同栏目/日期获得不同排序。
