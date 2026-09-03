# Provenance Contract

系统必须能够回答：

1. 当时实际看到了什么？
2. 为什么看到了它？
3. 信息原始来自哪里？系统通过什么入口发现它？
4. 系统如何把它解释为 Subject/Discovery？
5. AI 为什么给出此 Opportunity/Angle/Evaluation？
6. 人工最终做了什么决定、为什么？
7. 发布了哪个版本？
8. 后来表现如何？
9. 如果今天重放，哪些 policy/model/source 已经不同？

## 四类数据必须分离

- **Observed Facts**：RawSignal、source、collection run、coverage、HumanSubmission input。
- **Machine Judgement**：discovery/evaluation/AI generation，必须版本化。
- **Human Decision**：append-only editor decision/reason。
- **Outcome**：publication/performance observation。

## Source Origin 与 Acquisition Origin

任何进入系统的资料都必须允许区分：

- `source_origin`：信息原始来源；
- `acquisition_origin`：系统如何注意到该资料。

示例：

```text
用户粘贴 Reddit URL
source_origin      = reddit
acquisition_origin = HUMAN_SUBMISSION
```

```text
Scout 通过 SearchProvider 找到 Reddit URL
source_origin      = reddit
acquisition_origin = SEARCH_PROVIDER
```

```text
用户直接输入“我听说洗碗机更省水”
source_origin      = HUMAN_ASSERTION
acquisition_origin = HUMAN_SUBMISSION
verification       = unverified
```

不得把 `source=human` 作为第三方内容来源的替代字段，否则会丢失原始来源链。

## HumanSubmission provenance

HumanSubmission 至少记录：

```text
submission_id
submission_type
raw_input
optional source_url
optional user_note / intent
actor
submitted_at
acquisition_origin = HUMAN_SUBMISSION
normalization version
resulting raw_signal refs
```

HumanSubmission 本身不是正偏好标签，也不能改变 Evidence verification state。

后续若形成 Discovery / Opportunity / Candidate，必须能够反向追到对应 submission。

## 最低 AI provenance

model/provider、task/route、prompt version、schema version、policy/rubric version、input hash、AI invocation id、created_at、actor/requester。

## Acquisition Coverage

未来必须保存 collection coverage，以区分“看到了但判低价值”和“根本没有采到”。

Human Acquisition 不以机器 coverage 统计替代，但应分别记录 submission volume、processed/failed、formed discovery/opportunity、最终 Adopt/Watch/Drop 等结果，以便分析 Human/Machine 两类入口的实际价值。

## Editorial Advantage traceability

Candidate 必须能追溯 Opportunity 相对原始资料新增的 Editorial Advantage。该说明应绑定对应 evidence/source refs 或 evaluation rationale，不能只存一句不可回放的最终结论。
