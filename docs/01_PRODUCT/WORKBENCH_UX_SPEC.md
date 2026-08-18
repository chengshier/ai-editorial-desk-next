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

首屏至少同时覆盖“注意力变化”和“内容潜力”，不能把 Radar 做成热点榜单：

- Today Main：当前最值得做的少量机会。
- Emerging / Momentum：正在发生、升温、跨平台扩散。
- **Potential / Worth a Look：尚未明显升温，但 AI 认为本身有趣、有价值、值得研究或有好 Angle 潜力。**
- Explain / Curiosity：值得解释、反常识、为什么。
- Utility / Safety：实用、诈骗、食品/消费安全。
- Story / Culture / Rediscovery：人物、作品、历史、老内容再发现。
- Watch / Researching：正在观察或研究中的机会。
- Evergreen：暂不抢时效但长期有价值。

这些是 Programming Context / View，不要求永久固定成栏目名称。

必须避免：

```text
热度低 → 默认隐藏
Trend unavailable → 不显示
社区来源 → 自动降为无价值
```

用户应该能看到“为什么它虽然没火，但值得我看一眼”。

## 4. Opportunity Card

卡片必须优先展示业务判断，而不是数据库字段：

```text
Headline / Working Angle
Subject
Discovery Reason / Lane
Why worth telling
Theme
Audience Promise
Why now / Evergreen note
Value highlights
Attention/Momentum（若有）
Evidence confidence / Unknowns
Production readiness
Recommended destination
```

操作：`查看`、`换 Angle`、`继续研究`、`比较`、`Adopt`、`Watch`、`Drop`。

卡片不得只显示一个“综合分 86”，也不得因为没有 Trend 就表现为“0 热度”。

## 5. Opportunity Detail

详情推荐分为：
- Overview：Subject / Discovery / Angle / Theme / Promise。
- Discovery Context：Ambient / Potential / Momentum / Research，来源角色与发现原因。
- Value Profile：优势、弱项、Confidence、Integrity、Execution。
- Attention：趋势/社区信号；不可用时明确 unavailable，不影响其他价值判断。
- Evidence：Confirmed / Investigating / Single Source / Disputed / False / Unknown。
- Sources：原始来源、source role 与 acquisition provenance。
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

当 Discovery 来自 Reddit/论坛/社区/趋势信号时，应明确区分：

```text
发现线索
↓
事实核验
↓
受众/讨论信号
```

避免把社区帖子直接包装成 Confirmed Fact。

## 7. Human Decision UX

Adopt / Watch / Drop 是重要编辑行为：
- 明示当前 Evaluation 与风险上下文。
- 原因应可填写/选择，但不能无痕覆盖前一次 Decision。
- Adopt 后不自动发布、不自动生成 Draft。
- R3/R4 等高风险状态应要求 acknowledgement 或阻止相应写操作。

## 8. Programming UX

Programming 不是一个全局 TOP 榜：
- Today Main
- Momentum / Current
- Potential / Worth a Look
- Series / Mission-specific Pool
- Evergreen
- Researching / Watch

支持 Pairwise Compare：用户可问“B 和 F 今天只能做一个，哪个更适合？”并查看差异理由。

系统允许一个“热度很低但价值高”的 Opportunity 在 Evergreen/Series/Potential 中优先于一个“很热但没有好 Angle”的 Opportunity。

## 9. Harness 交互原则

Harness 中优先使用结构化 Card / Conversation Node 展示 Opportunity、Research Progress、Evidence、Decision 结果；不要把所有业务都降级成聊天文本。

复杂全局 Radar、筛选、长期库、Performance Dashboard 是否由 Harness 原生扩展承担，需要通过 Spike 证明。若不足，允许采用“业务 Web Shell + Harness Workspace”混合产品形态，但两者共享同一 Editorial Intelligence API。

## 10. 视觉与可用性原则

- 减少传统后台式大量表格/卡片堆砌。
- 默认展示编辑含义，而非 id、enum、内部版本号。
- 复杂 provenance 可展开查看，不抢占首屏。
- 所有不可用能力必须展示原因，`Unavailable != 0`。
- Attention/Momentum 与 Editorial Value 分开展示，避免用户误以为热度等于价值。
- AI 推荐必须可解释为业务理由、证据和未知项，不暴露隐藏 chain-of-thought。
