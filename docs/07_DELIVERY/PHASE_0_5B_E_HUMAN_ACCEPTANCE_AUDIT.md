# Phase 0.5-B E — Human Editorial Acceptance Audit

## 状态

`IN_PROGRESS / MOMENTUM_CONTEXT_BLOCKED / POTENTIAL_ROUND_REVIEWED / D4_READY_FOR_REAL_RUN`

本文件记录 Phase 0.5-B-E 的真实人工编辑反馈。只有 `context_sufficient=true` 的判断才进入最终 Gate；上下文不足的暂定反馈用于改进 acceptance packet，不计入最终 Editorial Discovery Yield。

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

原 acceptance packet 已增加 `review_context` 与 `context_sufficient` Gate：

- Momentum 优先带 related news 标题 / 来源；
- Potential 优先把 Exa candidate 对应的 Firecrawl fetched description / content excerpt 合并；
- Control 优先带 Tavily integrated content excerpt；
- Community 若仍只有标题/信号，必须允许 `context_sufficient=false`；
- `context_sufficient=false` 不计入最终 Gate。

本轮人工反馈进一步要求后续 human-review contract 能表达：

- 投入优先级；
- 内容深度；
- 固定栏目 / 快报 / 深度解读等内容形态；
- 同一个候选“值得发现”与“适合哪种生产方式”必须分开判断。

因此新增多栏目扩展：

- `benchmarks/acquisition/mission_templates.multichannel.zh-CN.v1.json`
- `benchmarks/acquisition/build_multichannel_acceptance_packet.py`
- `tests/test_acquisition_multichannel_acceptance.py`
- `docs/07_DELIVERY/PHASE_0_5B_E_MULTICHANNEL_REAL_RUN_PROTOCOL.md`

多栏目扩展固定验证：

```text
信息差 / 反转 / 澄清
普通人物 / 社会反差
诈骗 / 风险提醒
娱乐 / 文化回应
常识 / 历史纠偏
```

Human Review 在旧字段之外新增：

```text
investment_priority
production_depth
series_fit
editorial_mode_fit
```

并采用 Provider-blind 的 `M1-A / M1-B ... M5-A / M5-B` 配对方式，避免人工在决定前看到 Exa / Tavily 名称。

## 6. D4 的定位

D4 不是“假装已经接入国内社交平台”。它只回答当前 Search/Fetch 组合在 **中文公开 Web** 上能做到什么。

如果真实运行只能找到新闻转载、SEO 页面或缺少评论 / 原帖 / 现场素材，则应明确得出：

```text
Web Search / Fetch = 背景与补证层
Platform / Community = 仍有正式能力缺口
```

如果开放网页本身就无法稳定发现这些栏目需要的候选，则更不能把 D2-B 英文解释型结果外推成 V1 全局 Provider 结论。

## 7. 下一步

1. exact-head CI 通过后运行 D4 中文多栏目 Search/Fetch；
2. 审计 Exa → Firecrawl 与 Tavily 在 5 个多栏目 Mission 上的真实候选；
3. 构建 10 条 Provider-blind Multi-channel Human Acceptance；
4. 根据真实缺口决定是否必须进入 PlatformProvider / 国内趋势与社区 Provider Spike；
5. 再完成 Community / Control 与 Momentum 补上下文；
6. 只有代表性覆盖充分后才进入 0.5B-F Provider Decision + ADR。
