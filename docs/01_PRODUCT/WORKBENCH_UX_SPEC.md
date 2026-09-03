# Workbench UX Specification v1

> 本文冻结信息架构与交互原则，不冻结最终视觉稿。

## 1. 首屏不是后台首页

用户打开产品时首先回答三个问题：

1. 今天有什么值得讲？
2. AI 为什么这么判断？
3. 我下一步能做什么？

因此首屏默认不是平台配置、采集任务或统计卡片，而是 **Editorial Radar / Today Desk**。

同时，Workbench 必须允许用户在看到任何值得关注的内容时，以极低成本把线索“交给编辑部”，而不是要求先整理成完整选题表单。

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

Human Submission 应作为全局入口存在，而不是藏在 System 或 Acquisition 配置页中。

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
Human Submission → 自动视为高价值/已确认
```

用户应该能看到“为什么它虽然没火，但值得我看一眼”。

## 4. Global Human Submission Entry

Workbench 第一版应提供一个始终容易找到的“交给编辑部”入口。

最小交互可以是：

```text
┌────────────────────────────────────────────┐
│ 刚看到什么值得我们看一下？                 │
│                                            │
│ [ 粘贴链接、文字、问题、想法……          ] │
│                                            │
│                              [交给编辑部]  │
└────────────────────────────────────────────┘
```

首版最低支持：
- URL；
- Text / Question / Idea。

提交后不显示“已创建选题”，而应显示：

```text
已收到线索
→ 正在读取/规范化
→ 正在查证/补背景（如需要）
→ 正在判断是否形成 Discovery / Opportunity
```

完成后可能出现多种结果：
- 形成 Opportunity；
- 建议继续 Research；
- 已有重复 Opportunity，合并到已有上下文；
- 事实不成立/证据不足；
- 暂无明显编辑价值，建议 Store/Drop。

用户投喂本身不应在 UI 上被暗示成“你已经喜欢/采纳了它”。

## 5. Opportunity Card

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

如果 Opportunity 来自 HumanSubmission，应可轻量显示 `Human Seed` / “你投喂的线索”，同时保留真实 Source Origin。

操作：`查看`、`换 Angle`、`继续研究`、`比较`、`Adopt`、`Watch`、`Drop`。

卡片不得只显示一个“综合分 86”，也不得因为没有 Trend 就表现为“0 热度”。

## 6. Opportunity Detail

详情推荐分为：
- Overview：Subject / Discovery / Angle / Theme / Promise。
- Discovery Context：Ambient / Potential / Momentum / Human / Research，来源角色与发现原因。
- Value Profile：优势、弱项、Confidence、Integrity、Execution。
- Attention：趋势/社区信号；不可用时明确 unavailable，不影响其他价值判断。
- Evidence：Confirmed / Investigating / Single Source / Disputed / False / Unknown。
- Sources：原始来源、source role、source origin 与 acquisition provenance。
- Research：研究任务、问题、进度、结果。
- Alternatives：其他 Angle / sibling Opportunities。
- History：Evaluation / Human Decision / Policy versions。

详情还应显示 **Editorial Advantage**：系统相对原始资料新增了什么，而不是只复述原文。

## 7. Research UX

Research 必须是可观察任务：
- 显示 Research Goal。
- 显示正在使用的来源类型，而不是展示模型隐藏推理。
- 显示完成项 / 待处理项 / Unknown。
- 可以取消、继续、追加目标。
- 完成后展示“新增了什么证据、解决了什么未知、哪些判断发生变化”。

当 Discovery 来自 Reddit/论坛/社区/趋势信号或 HumanSubmission 时，应明确区分：

```text
发现线索
↓
事实核验
↓
受众/讨论信号
```

避免把社区帖子或用户投喂直接包装成 Confirmed Fact。

对于高 Momentum 但原因不清晰的项，UI 可提示：

```text
“正在升温，但 Why Now 尚不清楚”
[调查原因]
```

而不是所有高热度项目自动启动 Research。

## 8. Human Decision UX

Adopt / Watch / Drop 是重要编辑行为：
- 明示当前 Evaluation 与风险上下文。
- 原因应可填写/选择，但不能无痕覆盖前一次 Decision。
- Adopt 后不自动发布、不自动生成 Draft。
- R3/R4 等高风险状态应要求 acknowledgement 或阻止相应写操作。

对于 Human Seed，也必须等到 Opportunity/Evaluation 后再做 Adopt / Watch / Drop。Submission 本身不是 Decision。

## 9. Programming UX

Programming 不是一个全局 TOP 榜：
- Today Main
- Momentum / Current
- Potential / Worth a Look
- Series / Mission-specific Pool
- Evergreen
- Researching / Watch

支持 Pairwise Compare：用户可问“B 和 F 今天只能做一个，哪个更适合？”并查看差异理由。

系统允许一个“热度很低但价值高”的 Opportunity 在 Evergreen/Series/Potential 中优先于一个“很热但没有好 Angle”的 Opportunity。

## 10. Harness 交互原则

Harness 中优先使用结构化 Card / Conversation Node 展示 Opportunity、Research Progress、Evidence、Decision 结果；不要把所有业务都降级成聊天文本。

HumanSubmission 可以通过：
- Harness 对话直接投喂；
- 结构化输入组件；
- Hybrid Web Shell 的全局投喂框；

但无论 UI 形态如何，后端都调用同一 Human Acquisition API，不复制业务逻辑。

复杂全局 Radar、筛选、长期库、Performance Dashboard 是否由 Harness 原生扩展承担，需要通过 Spike 证明。若不足，允许采用“业务 Web Shell + Harness Workspace”混合产品形态，但两者共享同一 Editorial Intelligence API。

## 11. 视觉与可用性原则

- 减少传统后台式大量表格/卡片堆砌。
- 默认展示编辑含义，而非 id、enum、内部版本号。
- 复杂 provenance 可展开查看，不抢占首屏。
- Human Submission 入口必须低摩擦，不要求填写 category/mission/score 等内部字段。
- 所有不可用能力必须展示原因，`Unavailable != 0`。
- Attention/Momentum 与 Editorial Value 分开展示，避免用户误以为热度等于价值。
- AI 推荐必须可解释为业务理由、证据和未知项，不暴露隐藏 chain-of-thought。
