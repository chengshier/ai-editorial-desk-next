# Phase 0.5-B E — Human Editorial Acceptance Audit

## 状态

`IN_PROGRESS / MOMENTUM_CONTEXT_BLOCKED / POTENTIAL_ROUND_REVIEWED`

本文件记录 Phase 0.5-B-E 的真实人工编辑反馈。只有 `context_sufficient=true` 的判断才进入最终 20/20 Gate；上下文不足的暂定反馈用于改进 acceptance packet，不计入最终 Editorial Discovery Yield。

## 1. 第一轮 Momentum 暂定反馈

首轮向人工编辑展示了 5 条 Google Trends Momentum 样本，但展示层基本只有标题与简单趋势信号，没有提供足够的事实摘要、相关报道脉络或正文上下文。

人工反馈如下：

| Sample | 候选 | 暂定判断 | 会点开 | 编辑投入 | 位置 | 补证 | 上下文充分 | 理由 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| momentum-01 | Aster / 秋季花卉替代常见菊花 | 观察 | 会 | 有条件 | 栏目 | 需要 | 否 | 只有简单标题，什么都看不出来 |
| momentum-02 | Downdetector / Fidium Fiber 网络故障 | 观察 | 不会 | 有条件 | 栏目 | 需要 | 否 | 只有简单标题，什么都看不出来 |
| momentum-03 | Covid / 流感 / RSV 疫苗指南 | 观察 | 会 | 有条件 | 栏目 | 需要 | 否 | 只有简单标题，什么都看不出来 |
| momentum-04 | Maryland 2026–2027 疫苗指南 | 观察 | 不会 | 有条件 | 栏目 | 需要 | 否 | 只有简单标题，什么都看不出来 |
| momentum-05 | Josh Hartnett / Netflix《Below》预告 | 观察 | 会 | 有条件 | 栏目 | 需要 | 否 | 只有简单标题，什么都看不出来 |

这些反馈保留为 **provisional / context blocked**，不映射成最终 `MAYBE` 统计，也不据此评价 Google Trends 的 Editorial Discovery Yield。

## 2. Momentum 暴露的问题

首轮实际证明：

```text
Candidate title + trend traffic/rank
!= enough editorial review context
```

人工编辑无法仅凭标题判断：

- 事件/发现究竟发生了什么；
- 哪个事实或反常点构成 Angle；
- 是否已经有可靠来源；
- 是短热点、解释型内容还是长期题；
- 是否只是标题看起来有趣但正文空洞。

因此这不是“5 条 Momentum 都只能 MAYBE”，而是 acceptance presentation 本身不合格。

## 3. 第二轮 Potential 人工反馈

第二轮使用 Exa + Firecrawl 的真实正文上下文，而不是裸标题。5 条候选分别是：

1. 科学共识沟通为什么有时仍纠正不了错误认知；
2. 日常现象背后的科学解释素材；
3. AI 辅助高管冒充与假发票诈骗；
4. 全球低频 “Hum” 可能与低频耳鸣相关；
5. 人们为何明知研究质量差仍按既有信念行动。

人工编辑统一反馈：

```text
#2 / #3 / #5   可能值得做，优先级更高
#1 / #4        观察
5 条           都可以投入，但投入比例不同
5 条           都更适合固定栏目
若真正制作     都需要深度剖析，而不是只做标题级/浅层转述
```

因此当前 Potential 轮不应简单压成 `DO / MAYBE / DROP` 一个维度。真实编辑判断至少还包含：

```text
investment_priority
→ HIGH / MEDIUM / LOW

production_depth
→ DEEP_DIVE / STANDARD / BRIEF
```

其中本轮 5 条均倾向 `COLUMN + DEEP_DIVE`，但 #2/#3/#5 的投入优先级高于 #1/#4。

## 4. 内容形态偏差

人工编辑指出，本轮 5 个 Potential 候选整体明显偏：

```text
严谨
科普
研究解释
证据型内容
```

这类内容并非不需要，但如果只用这类样本完成 Provider Decision，会导致 benchmark corpus 对真实目标内容分布失真。

额外提供的短视频参考样本显示，目标内容风格还包含明显不同的一类：

```text
信息差快报 / 多条短故事
事实核对与反转
社会生活小事件
诈骗 / 风险提醒
历史或常识纠偏
娱乐 / 人物回应
高密度口播 + 截图证据 + meme/影视梗切片
```

该参考视频约 79 秒，核心不是“论文解读”，而是把数条真实信息压缩成“发生了什么 → 有什么反转/信息差 → 给证据截图 → 一句评论/梗 → 下一条”的高节奏栏目。

因此 Phase 0.5-B-E 在进入最终 Provider Decision 前，必须确认 Mission corpus 不只代表 science/knowledge explainer，还能覆盖至少以下编辑形态：

```text
DEEP_EXPLAINER
FAST_INFO_GAP
REVERSAL / CLARIFICATION
SOCIAL_ODDITY
SCAM / RISK WARNING
EVERYDAY WHY
CULTURE / ENTERTAINMENT RESPONSE
```

这些是“内容形态 / editorial mode”，与 Momentum/Potential/Community lane 是正交维度：

```text
Momentum/Potential/Community = 为什么发现它
Editorial Mode               = 最后适合怎么讲
```

Provider rank / academic source preference 不能替代这层编辑路由。

## 5. 已采取的工程修复

acceptance packet 已升级为 schema v2：

- 每条 sample 增加 `review_context`；
- Momentum 优先带 related news 标题 / 来源；
- Potential 优先把 Exa candidate 对应的 Firecrawl fetched description / content excerpt 合并；
- Control 优先带 Tavily integrated content excerpt；
- Community 若仍只有标题/信号，必须允许 `context_sufficient=false`；
- `human_review` 增加 `context_sufficient`；
- `context_sufficient=false` 不计入最终 20/20 Gate。

本轮人工反馈进一步要求后续 human-review contract 能表达：

- 投入优先级；
- 内容深度；
- 固定栏目 / 快报 / 深度解读等内容形态；
- 同一个候选“值得发现”与“适合哪种生产方式”必须分开判断。

## 6. 下一步

不能直接把当前 20 条样本跑完就进入 0.5B-F。

下一步先做两件事：

1. 保留当前 Potential 第二轮反馈，作为 science/knowledge explainer 代表样本；
2. 补一组更贴近真实目标内容风格的非学术型候选，至少覆盖信息差、反转/澄清、社会小事件、风险提醒和娱乐/文化回应，再继续 Human Acceptance。

随后再完成 Community / Control，并回到 Momentum 5 条补上下文重新确认，使最终 Provider Decision 建立在代表性更完整的 editorial corpus 上。
