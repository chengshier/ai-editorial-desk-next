# ADR-0008：Human Acquisition 是一等发现入口

- Status: Accepted
- Date: 2026-09-03

## Context

现有 Acquisition Baseline 已覆盖 Ambient Sensing、Potential Scout、Momentum Radar、Search/Fetch/Feed/Platform/Trend Provider，但“人主动把刚看到的线索交给编辑部”尚未形成正式机制。

个人创作者在真实信息流中会通过偶遇、跨领域联想、异常感、生活经验和个人兴趣发现素材。这类线索可能来自 Reddit/论坛帖子、网页、短视频、截图、朋友转述、一个问题或纯粹的想法。它们不应绕过统一的 RawSignal / Evidence / Provenance 体系，也不应被当成天然正样本。

## Decision

Human Acquisition 作为 Acquisition Network 的一等入口，与 Machine Acquisition 并列。

正式入口对象命名为 `HumanSubmission`，而不是新建第二套 `HumanSignal` 事实体系。

```text
Machine Acquisition                 Human Acquisition
RSS / Search / Trend                HumanSubmission
Community / Platform                URL / Text / Question / Idea
Targeted Fetch                      Observation
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
              trigger = HUMAN_SEED
```

### Provenance separation

必须区分：

- `source_origin`：信息原始来自哪里，例如 reddit / nasa.gov / user_assertion；
- `acquisition_origin`：系统通过什么入口注意到它，例如 `HUMAN_SUBMISSION` / `SEARCH_PROVIDER` / `FEED_PROVIDER`。

用户粘贴 Reddit URL 时，原始来源仍是 Reddit，只是 acquisition origin 为 Human Submission。

### Semantics

`HumanSubmission` 只表达“值得系统看一眼的线索”，不等于：

- Confirmed Fact；
- Positive Preference Label；
- Editorial Opportunity；
- Candidate；
- Adopt。

用户直接陈述但没有外部来源的内容，应以 `HUMAN_ASSERTION` / unverified semantics 保存，并进入 Research/Evidence 规则后再决定事实状态。

### Editorial Advantage invariant

进入 Candidate 的 Opportunity 必须能够说明系统相对于原始信息新增了什么编辑价值。增量可以来自：

- 更早发现；
- 跨源连接；
- 趋势变化；
- 事实验证 / 纠偏；
- 背景补充；
- Angle transposition；
- Theme leverage；
- 与目标受众建立连接；
- Actionability / Protective Value；
- 后续值得回访的时间钩子。

不要求信息本身具有排他性，也不要求“普通人打开页面看不到”。我们追求的是 Editorial Advantage，不是 Information Exclusivity。

### Calibration

Human Submission 本身不作为偏好正标签。真正用于 Rubric 校准的是后续完整链条：

```text
HumanSubmission
→ Research / Evaluation
→ Human Adopt / Watch / Drop
→ natural-language reason
→ Publication / Performance（若有）
```

## Consequences

- MVP Vertical Slice 必须包含最小 Human Submission 入口。
- Acquisition/Provenance Contract 必须支持 human acquisition metadata。
- Workbench 应提供低摩擦“交给编辑部”入口。
- Machine Acquisition 与 Human Acquisition 共享 Subject/Discovery/Opportunity/Evidence 主链，不复制业务模型。
- 后续可扩展 URL、文本、问题、想法、截图/图片等 submission type，但首版可以只做文本 + URL。
