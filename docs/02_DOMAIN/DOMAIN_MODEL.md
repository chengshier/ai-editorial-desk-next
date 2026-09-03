# Domain Model v1

## 主链

```text
Machine Acquisition                 Human Acquisition
Source / Connector                  HumanSubmission
        │                                  │
        └──────────────┬───────────────────┘
                       ↓
                    RawSignal ──────────────┐
                       ↓                    │ provenance
              SubjectObservation           │
                       ↓                    │
                    Subject                │
                       ↓                    │
                   Discovery               │
                       ↓                    │
           EditorialOpportunity ◄───────────┘
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

## HumanSubmission

HumanSubmission 是 Human Acquisition 的入口对象，用于表达“用户刚看到/想到了一条值得系统看一眼的线索”。它不是第二套 RawSignal，也不是偏好标签。

首版建议表达：

- submission type：URL / TEXT / QUESTION / IDEA / OBSERVATION；
- raw user input；
- optional source URL；
- optional note / intent；
- submitted_at / actor；
- acquisition provenance。

归一化后仍进入统一 RawSignal。若用户提交的是第三方 URL，`source_origin` 仍指向第三方；`acquisition_origin = HUMAN_SUBMISSION`。若用户直接陈述一个未经外部来源支持的说法，则以 unverified human assertion semantics 保存并进入 Evidence/Research。

HumanSubmission 不得直接升级为 Confirmed Fact、EditorialOpportunity、Candidate 或 Adopt。

## Subject

Subject 保存“是什么”，不保存“为什么值得讲”。事件合并/聚类只是构建 EVENT Subject 的一种方法。

建议实体字段方向：canonical name、type、aliases、language、summary、canonical keys、status、created provenance。正式表结构在 Foundation Contracts 阶段冻结。

## Discovery

Discovery 是时间与上下文敏感的观察，必须保留 `mission`、`trigger`、`why_noteworthy`、source observation refs、objective signal snapshot、policy/version 与 discovered_by。

Discovery 可以来自：

- ambient sensing；
- potential scout；
- momentum radar；
- research follow-up；
- `HUMAN_SEED`。

`HUMAN_SEED` 只说明发现入口来自用户投喂，不代表内容真实性或价值已经被确认。

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

### Editorial Advantage invariant

Opportunity 进入 Candidate 前必须说明系统相对原始信息增加了什么编辑价值。可接受的增量包括：

- earlier detection；
- cross-source connection；
- attention/momentum interpretation；
- verification / correction；
- background/context；
- Angle transposition；
- Theme leverage；
- audience connection；
- actionability / protective value；
- follow-up hook。

该规则要求的是 Editorial Advantage，而不是 Information Exclusivity；公开可见的信息仍然可以因为被重新验证、连接或解释而形成高价值 Opportunity。

## Research

Research 不是“额外搜索按钮”，而是由显式 Gap 驱动的工作流。Gap 可包括：事实确认、反证、定义、数据、图片/视频、流传度、人物背景、当地语境、版权/素材可用性、风险。

HumanSubmission 与机器发现共享同一 Research/Evidence 标准，不能因为线索来自用户就降低事实要求。

对于 Momentum Discovery，可在 `momentum high + explanation confidence low` 等条件下建议 Research，但不能把“有热度”机械等价为“必须研究”或“值得做”。

## CandidateV2

CandidateV2 绑定 Opportunity，而不是 Event。它保存某次 evaluation/programming context 下的候选快照，允许同一 Opportunity 在不同栏目/日期获得不同排序。

HumanSubmission 本身不产生 Candidate。Candidate 前至少需要完成相应 Opportunity/Evaluation 与 Editorial Advantage 说明。

## Calibration

HumanSubmission 本身不作为正偏好标签。用于后续 Rubric Calibration 的有效链路应是：

```text
HumanSubmission
→ Research / Evaluation
→ Adopt / Watch / Drop
→ natural-language reason
→ optional Publication / Performance
```

这样可以分析系统对用户主动线索的高估/低估，而不把“我只是想查一下”错误学习成“我喜欢这个内容”。
