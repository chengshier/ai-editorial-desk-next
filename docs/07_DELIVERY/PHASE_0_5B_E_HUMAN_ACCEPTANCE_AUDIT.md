# Phase 0.5-B E — Human Editorial Acceptance Audit

## 状态

`IN_PROGRESS / MULTICHANNEL_BLIND_REVIEW_COMPLETE / PLATFORM_GAP_NEXT`

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

## 7. Provider-blind Multi-channel Review

本轮采用 5 对、共 10 条样本，人工决定前不展示 Provider 身份。

### 7.1 人工反馈

| 样本 | 判断 | 点击意愿 | 投入 | 深度 | 栏目 | 补证 | 上下文 | 关键理由 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M1-A | 观察 | 会 | 高 | 深度 | 每日信息差 | 要 | 不足 | 反转张力强，但二手自媒体定性过重，缺原始订单/录音/平台仲裁 |
| M1-B | 观察 | 会 | 低 | 快报 | 每日信息差 | 要 | 不足 | 饭圈造型口水战，只有搜索摘要，低信息密度 |
| M2-A | 值得做 | 会 | 中 | 快报 | 人物社会 | 不要 | 够 | 监控、救助、校服止血、好心人洗衣、老人出院，事实链闭环 |
| M2-B | 观察 | 可能会 | 低 | 快报 | 人物社会 | 要 | 不足 | 雨中避雨摘要过于空泛，缺时间地点人物和完整细节 |
| M3-A | 值得做 | 会 | 中 | 快报 | 每日信息差 | 不要 | 够 | 家长群诈骗有金额、强反差、校方与警方支撑，兼具防骗与传播性 |
| M3-B | 观察 | 会 | 高 | 深度 | 人物社会 | 要 | 够 | “本地反诈日报”更像方法论/专栏特稿，不适合短平快 |
| M4-A | 观察 | 会 | 低 | 快报 | 娱乐回应 | 不要 | 够 | 用户未补充文字理由；保留字段结论，不替代推断 |
| M4-B | 观察 | 会 | 中 | 快报 | 每日信息差 | 要 | 不足 | 明星下场对线有传播性，但需双方原始博文与互动截图 |
| M5-A | 观察 | 不一定 | 低 | 快报 | 严谨科普 | 不要 | 够 | 可信但老生常谈，缺短视频前三秒反差，适合储备 |
| M5-B | 观察 | 不一定 | 低 | 快报 | 严谨科普 | 要 | 不足 | 常识题且仅有模糊摘要；理由中明确写“建议直接淘汰” |

注意：M5-B 的结构化判断写的是“观察”，但文字理由写的是“建议直接淘汰”。本审计不擅自把它改写成 `DROP`；在最终统计中保留为 **decision=观察 / rationale倾向淘汰**，如需严格 DO/MAYBE/DROP 统计，应在最终 Gate 前确认一次。

### 7.2 揭盲

blind label 的真实映射是：

```text
A = Exa Search → Firecrawl Fetch
B = Tavily integrated Search+Fetch
```

这是 packet builder 的固定配对方式：每个 Mission 先取 Exa→Firecrawl 样本作为 A，再取 Tavily 样本作为 B；人工决定期间未展示该映射。

### 7.3 Context-sufficient 结果

只有 `context_sufficient=true` 的样本进入当前可解释统计。

```text
Exa → Firecrawl (A)
context sufficient: 4 / 5
值得做:             2 / 4
观察:               2 / 4
明确淘汰:           0 / 4

Tavily (B)
context sufficient: 1 / 5
值得做:             0 / 1
观察:               1 / 1
明确淘汰:           0 / 1
```

因此本轮不能把“10 条中 2 条值得做”直接当成 Provider 总体 Editorial Yield；真正有意义的是 **可判断率 + 在可判断样本中的编辑接受度**。

阶段性结论：

```text
Exa → Firecrawl
→ human-review context sufficiency 明显更高
→ 本轮唯一两条“值得做”都来自该链路
→ human-surprise / scam-risk 的选题与材料完整度尤其强

Tavily
→ 仍能发现可用候选
→ 但本轮多数 top candidate 上下文不足，导致人工无法完成强判断
→ 保留 comparator / fallback 的结论不变
```

本结果仍不是最终 Provider Winner，因为它只覆盖中文公开 Web，不覆盖平台原帖、原评论、传播速度和平台内素材。

## 8. 本轮对编辑方法论的额外确认

人工反馈进一步验证：

1. **“值得发现”与“值得马上制作”不是一回事。** M1-A 有很强编辑张力，但因证据风险只能进入补证流。
2. **高投入并不等于高优先级短视频。** M3-B 值得深挖，但适合方法论/专栏，而不是快报。
3. **证据完整的内容也可能只值得储备。** M5-A 可信度高，但编辑新鲜度与 Hook 弱。
4. **上下文不足必须允许阻断决策。** M1-B / M2-B / M4-B / M5-B 都不能因为 Provider 返回了 URL 就强行评价成低价值。
5. **风险与民生类最容易同时满足“实用价值 + 信息差 + 传播钩子”。** M3-A 是当前多栏目 corpus 中最接近目标栏目的一类。

## 9. 下一 Gate

本轮已经完成中文 Web 多栏目 blind review。进入 0.5B-F 前仍需正式收口两个能力问题：

```text
A. Platform / Community gap
- 原始微博 / 抖音 / 小红书帖子
- 评论区与神评 provenance
- 点赞 / 评论 / 转发速度
- 同城榜 / 热搜榜 / 平台内传播路径
- 原视频 / 原始截图素材

B. Momentum context gap
- Trend signal 只说明“在升温”，不能单独支撑编辑判断
- 必须把 trend candidate 与 Search/Fetch/Research 上下文拼起来再评
```

因此下一步不是直接宣布某个 Provider 全局胜出，而是先完成 Platform / Community capability decision，再形成 0.5B-F Provider Decision + ADR。
