# Phase 0.5-B E — Human Editorial Acceptance Audit

## 状态

`IN_PROGRESS / MULTICHANNEL_REAL_RUN_COMPLETE / BLIND_REVIEW_NEXT`

本文件记录 Phase 0.5-B-E 的真实人工编辑反馈。只有 `context_sufficient=true` 的判断才进入最终 Human Acceptance Gate；上下文不足的暂定反馈用于改进 acceptance packet，不计入最终 Editorial Discovery Yield。

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

## 4. 内容形态偏差与多栏目语义

人工编辑指出，本轮 5 个 Potential 候选整体明显偏：严谨、科普、研究解释、证据型内容。额外参考短视频则强调信息差快报、多条短故事、反转/澄清、社会小事件、诈骗提醒、娱乐回应和高密度口播。

两者都属于产品目标，不能互相替代。

后续 Human Acceptance 必须覆盖：

```text
DEEP_EXPLAINER
FAST_INFO_GAP
REVERSAL / CLARIFICATION
SOCIAL_ODDITY
SCAM / RISK WARNING
EVERYDAY WHY
CULTURE / ENTERTAINMENT RESPONSE
```

这些是“内容形态 / editorial mode”，与 Momentum/Potential/Community discovery lane 正交：

```text
Momentum/Potential/Community = 为什么发现它
Editorial Mode               = 最后适合怎么讲
Series                        = 最终在哪个长期栏目运营
```

因此不能把全局 Editorial Value 改成固定的“Drama / Hook / Comments 百分比”；短视频信息差应通过独立 Series Profile / Draft Style 表达，而不是污染所有频道。

## 5. Acceptance packet 修复

第一版 packet 已增加 `review_context`，但 D4 进一步证明仅把 description 当 summary 仍可能退化成“标题换一种写法”。

因此 multichannel packet 已升级为 v2：

- 同时保留 `provider_snippet` 与 `content_excerpt`；
- Fetch 成功时优先尝试从文章标题之后截取正文，而不是直接取页面最前面的站点导航；
- 增加 `context_sufficient_hint`，但它只是机器提示，最终仍由人填写 `context_sufficient`；
- 增加 `published_at` temporal note，明确页面发布时间不等于事件发生时间；
- human-facing packet 中移除 `provider_id`，避免“声称盲审但 JSON 里仍暴露 Provider”的伪盲审；
- `human_review` 增加 `investment_priority / production_depth / series_fit / editorial_mode_fit`。

## 6. D4 中文多栏目真实运行

已完成 5 个中文 Mission 的真实 Search/Fetch：

```text
Exa Search
5 / 5 mission success
14 candidates
~2888 ms average search latency
$0.070 observed search cost

Exa → Firecrawl
14 requested
13 fetched
1 HTTP 403 failure
92.9% fetch coverage
~22463 ms average probe latency

Tavily integrated
5 / 5 mission success
14 candidates
8 / 14 raw content available
57.1% content coverage
~9325 ms average latency
20 credits
```

关键结果：

1. 中文 Web Search 已能找到非科普型素材；
2. “葫芦娃爷爷”人物故事被真实命中，和人工参考方向高度一致；
3. “班级群收款 / 家长群诈骗”被真实命中，和参考的风险提醒方向高度一致；
4. 信息差 / 官方澄清 Mission 能找到出入境新规误读澄清等材料；
5. 娱乐回应能找到素材，但出现旧事件以新页面日期重发，暴露 event-time integrity 缺口；
6. 同一学生救人事件出现两个不同 URL，暴露 event-level dedupe 缺口；
7. 自媒体 / SEO 聚合页可以用于 Discovery，但不能直接承担 Evidence；
8. 搜索网页仍无法替代原始评论区、平台传播速度、原视频和同城/热榜信号。

详细审计：`PHASE_0_5B_D4_MULTICHANNEL_ZH_CN_RUN_AUDIT.md`。

## 7. 当前 Human Acceptance Gate

旧版 `Momentum 5 + Potential 5 + Community 5 + Control 5` 不再机械地作为唯一验收序列。

下一轮优先进行真正的 Provider-blind multi-channel review：

```text
M1-A / M1-B   信息差 / 反转
M2-A / M2-B   普通人物 / 社会反差
M3-A / M3-B   诈骗 / 风险
M4-A / M4-B   娱乐 / 文化回应
M5-A / M5-B   常识 / 事实纠偏
```

人工只看候选事实上下文，不看 Provider 身份，并用中文回答：

```text
是否值得做
是否会点开
投入优先级
制作深度
适配栏目（可多选）
适配内容形态
是否需要补证
上下文是否充分
理由
```

完成该轮后，再回头补足 Momentum / Community 对 Platform capability 的判断，随后才能进入 0.5B-F Provider Decision + ADR。
