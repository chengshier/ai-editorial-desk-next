# Workbench UX Specification v1

> 本文冻结信息架构与交互原则，不冻结最终视觉稿。

## 1. 首屏不是后台首页

用户打开产品时首先回答三个问题：

1. 今天有什么值得讲？
2. AI 为什么这么判断？
3. 我下一步能做什么？

因此首屏默认不是平台配置、采集任务或统计卡片，而是 **Editorial Radar / Today Desk**。

## 2. 建议信息架构

```text
Editorial Desk
├─ Today / Radar
├─ Opportunities
├─ Research
├─ Programming
├─ Drafts
├─ Published / Performance
├─ Knowledge
└─ System / Providers
```

具体由 Harness 原生 UI、Harness Extension 或混合 Web Shell 承担，由 Harness UI Spike 决定。

## 3. Today / Radar

首屏至少提供：
- Today Main：当前最值得做的少量机会。
- Emerging：正在发生/升温。
- Explain / Curiosity：值得解释、反常识、为什么。
- Utility / Safety：实用、诈骗、食品/消费安全。
- Story / Culture / Rediscovery：人物、作品、历史、老内容再发现。
- Watch / Researching：正在观察或研究中的机会。
- Evergreen：暂不抢时效但长期有价值。

这些是 Programming Context / View，不要求永久固定成栏目名称。

## 4. Opportunity Card

卡片必须优先展示业务判断，而不是数据库字段：

```text
Headline / Working Angle
Subject
Why worth telling
Theme
Audience Promise
Why now
Value highlights
Evidence confidence / Unknowns
Production readiness
Recommended destination
```

操作：`查看`、`换 Angle`、`继续研究`、`比较`、`Adopt`、`Watch`、`Drop`。

卡片不得只显示一个“综合分 86”。

## 5. Opportunity Detail

详情推荐分为：
- Overview：Subject / Discovery / Angle / Theme / Promise。
- Value Profile：优势、弱项、Confidence、Integrity、Execution。
- Evidence：Confirmed / Investigating / Single Source / Disputed / False / Unknown。
- Sources：原始来源与 acquisition provenance。
- Research：研究任务、问题、进度、结果。
- Alternatives：其他 Angle / sibling Opportunities。
- History：Evaluation / Human Decision / Policy versions。

## 6. Research UX

Research 必须是可观察任务：
- 显示 Research Goal。
- 显示正在使用的来源类型，而不是展示模型隐藏推理。
- 显示完成项 / 待处理项 / Unknown。
- 可以取消、继续、追加目标。
- 完成后展示“新增了什么证据、解决了什么未知、哪些判断发生变化”。

## 7. Human Decision UX

Adopt / Watch / Drop 是重要编辑行为：
- 明示当前 Evaluation 与风险上下文。
- 原因应可填写/选择，但不能无痕覆盖前一次 Decision。
- Adopt 后不自动发布、不自动生成 Draft。
- R3/R4 等高风险状态应要求 acknowledgement 或阻止相应写操作。

## 8. Programming UX

Programming 不是一个全局 TOP 榜：
- Today Main
- Series / Mission-specific Pool
- Evergreen
- Researching / Watch

支持 Pairwise Compare：用户可问“B 和 F 今天只能做一个，哪个更适合？”并查看差异理由。

## 9. Harness 交互原则

Harness 中优先使用结构化 Card / Conversation Node 展示 Opportunity、Research Progress、Evidence、Decision 结果；不要把所有业务都降级成聊天文本。

复杂全局 Radar、筛选、长期库、Performance Dashboard 是否由 Harness 原生扩展承担，需要通过 Spike 证明。若不足，允许采用“业务 Web Shell + Harness Workspace”混合产品形态，但两者共享同一 Editorial Intelligence API。

## 10. 视觉与可用性原则

- 减少传统后台式大量表格/卡片堆砌。
- 默认展示编辑含义，而非 id、enum、内部版本号。
- 复杂 provenance 可展开查看，不抢占首屏。
- 所有不可用能力必须展示原因，`Unavailable != 0`。
- AI 推荐必须可解释为业务理由、证据和未知项，不暴露隐藏 chain-of-thought。