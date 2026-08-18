# Editorial Value Model — Draft v0.3 / V1 Contract Direction

> 本模型来自 44 条人工编辑判断的探索阶段。它是“判断语言”，不是已训练好的普适排名算法。

## 八个价值块

### 1. Intrinsic Value
内容本身是否有料：Knowledge、Utility、Story、Importance、Novelty、Correction 等。

### 2. Audience Connection
普通人为什么在意：Lived Relevance、Self Projection、Universality、Recognition Leverage。

### 3. Editorial Tension
为什么想继续看：Cognitive Tension、Social Tension、Curiosity Gap、Conflict、Surprise、Common Belief Collision。

### 4. Angle Strength
这个切口是否成立：Intrinsic Hook、Universal Angle、Angle Transposition、Discussion Potential、Emotional Resonance、Theme Leverage。

### 5. Context Value
为什么现在讲：Timeliness、Momentum、Context Resonance、Rediscovery Opportunity。

### 6. Outcome Value
看完以后得到什么：Actionability、Immediate Utility、Protective Value、Knowledge Gain、Emotional Gain。

### 7. Execution
当前是否有条件做好：Entry Cost、Visual Availability、Material Quality、Researchability、Narrative Potential、Production Readiness。

### 8. Editorial Integrity
讲法是否可靠：Evidence Confidence、Hook–Fact Integrity、Uncertainty、Risk。

## 评价表达

V1 不要求每个 Opportunity 对所有维度打数值。优先使用：

`VERY_LOW / LOW / MEDIUM / HIGH / VERY_HIGH`

每个被评价维度必须允许携带：`level, confidence, reason, evidence_refs`。

## 不使用单一总分作为事实

Evaluation 可以产出推荐动作，例如：

- `PROMOTE_MAIN`
- `PROMOTE_SERIES`
- `RESEARCH_REQUIRED`
- `WATCH`
- `EVERGREEN_STORE`
- `DROP`

但推荐动作必须保留 rationale，不得只返回 score。

## Angle / Theme / Promise

Evaluation 的直接对象是完整 Opportunity，而不是裸 Subject。

```text
Angle: 从哪里切
Theme: 最终讨论什么
Audience Promise: 用户看完得到什么
```

## Programming 独立

`Worth Telling` 与 `Should Publish Today` 是不同问题。Today Main、Safety Series、Story Series、Evergreen 等 ranking context 可以对同一 Candidate 产生不同顺序。
