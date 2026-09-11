# Phase 0.5-B D4 — 中文多栏目真实运行审计

## 状态

`COMPLETE / PASS WITH LIMITATIONS / BLIND_REVIEW_COMPLETE`

本轮验证中文开放 Web Search/Fetch 是否能覆盖 AI Editorial Desk Next 的多栏目发现需求，特别是人工参考样本暴露出的：信息差、反转/澄清、普通人物、诈骗风险、娱乐回应、常识纠偏。

本轮不验证微博、抖音、小红书等真实 PlatformProvider，也不把公开网页中的二手评论/截图当作平台原始 Audience/Material Signal。

## 1. 运行参数

```text
mission_count     5
max_results       3 / mission
fetch_limit       3 / mission
locale            zh-CN
region            CN
```

5 个 Mission：

```text
multichannel-cn-info-gap-reversal
multichannel-cn-human-surprise
multichannel-cn-scam-risk
multichannel-cn-culture-response
multichannel-cn-fact-correction
```

## 2. Provider 结果

### Exa Search

```text
successful missions     5 / 5
retrieved candidates    14
average latency         ~2888 ms / mission
observed cost           $0.070 total
```

其中 info-gap Mission 因 URL 去重只保留 2 条，其余 4 个 Mission 各 3 条。

### Exa → Firecrawl Fetch

```text
fetch probes            5
requested URLs          14
fetched                 13
failed                   1
fetch coverage          92.9%
average probe latency   ~22463 ms
observed cloud cost     unavailable in artifact
```

唯一明确失败：

```text
health.people.cn/... -> HTTP 403
```

Firecrawl 对网易、浙江在线、上海政府、新浪、新华网等正文总体可获取，但多个站点包含明显导航/站点 chrome，说明“Fetch 成功”仍不等于“正文已经适合直接给编辑阅读”。

### Tavily integrated Search+Fetch

```text
successful missions     5 / 5
retrieved candidates    14
raw content available    8 / 14
content coverage        57.1%
average latency         ~9325 ms / mission
credits used            20
```

Tavily 在 scam-risk 中 3/3 有正文，在 fact-correction 中 0/3 有正文，覆盖波动明显。

## 3. 多栏目发现质量

### 3.1 信息差 / 反转

Exa 找到：

- 长沙公共纠纷后续反转 / 司机晒订单与平台规则自证；
- “出境将全面收紧 / 闭关锁国”属于对新规误读的官方澄清报道。

第二条有较清楚的政策事实链，可形成“误读 → 官方说明 → 正常出境不受影响”的信息差内容。

第一条具备强反转和传播属性，但首要来源是网易号自媒体，文中包含大量强判断和对当事人的定性，因此只能作为 `DISCOVERY_SIGNAL`；不能直接升级为事实结论，必须追司机原始证据、平台规则、当事人回应或可信媒体报道。

Tavily 也找到同一长沙事件，另给出娱乐造型反转和街头殴打事件反转。说明 Web Search 对“反转”语义可工作，但结果质量高度依赖来源。

### 3.2 普通人物 / 社会反差

Exa 命中：

- 17 岁学生脱校服给摔倒老人止血；
- 同一事件的网易二次报道；
- “葫芦娃爷爷”的人物故事。

其中“葫芦娃爷爷”正是人工参考方向中的代表素材之一。这是本轮最重要的正向信号之一：Mission 调整后，现有 Search Provider 已能在开放中文 Web 中自然发现此前认为缺失的“人物 / 暖心 / 社会小故事”。

同时暴露 **event-level dedupe 缺口**：同一学生救人事件以两个不同 URL / 媒体出现，当前 URL dedupe 无法合并成一个 Event/Opportunity。

Tavily 找到“爷爷和 7 个葫芦娃”极目新闻版本，说明该类题材并非单一 Provider 偶然命中。

### 3.3 诈骗 / 风险提醒

Exa 命中：

- 班级群 / 群收款诈骗；
- 骗子潜入群聊后十多分钟内诱导 30 多位家长转账；
- 上海公安“国家反诈AI”上线。

前两条与人工参考的“开学群收款反转 / 诈骗提醒”高度接近，证明 `LOCAL_SCAM_RISK` Mission 的方向成立。

上海政府来源还提供了更高可信度的正式反诈能力信息，可用于后续 Research 补证。

Tavily 结果更偏反诈宣传、银行拦截案例与国家反诈 AI 解释，实用性存在，但“当日信息差 / 强事件钩子”弱于 Exa 本轮结果。

### 3.4 娱乐 / 文化回应

Exa 命中：

- 许凯“机场臭脸”回应；
- 迪玛希“忘关麦克风”回应；
- 李沐宸回应“还我季洁”。

但该 Mission 暴露严重 **temporal integrity** 问题：部分网页在 2026 年重新发布或聚合的是 2024 年旧事件。Provider 的 `published_at` / 页面日期不能直接当作“事件发生时间”。

因此后续必须区分：

```text
page_published_at
retrieved_at
event_time
recency_confidence
```

否则“最新回应”类 Mission 会被旧闻重发污染。

另外 YesDaily / 四克财经等结果来源质量一般，说明娱乐类 Web Search 需要更强 source policy / source quality feature，且应优先追本人账号、工作室、主创采访或可信媒体原文。

Tavily 返回一个有效的娱乐争议样本，但同时把 App Store 腾讯视频页面带入 `culture-response`，说明该 Mission 的 Search precision 仍需 Human Acceptance 验证。

### 3.5 常识 / 事实纠偏

Exa 命中：

- 新华网：蚊子叮人与血型关系；
- 人民网：家庭用药误区；
- 网易：生活误区合集。

这说明“常识纠偏”能找到素材，但本轮仍偏科普 / 健康，尚未很好覆盖人工参考里的“历史日期、文化记忆、社会常识纠偏”。Mission 后续应拆分或增加 `HISTORY_MEMORY_CORRECTION`，避免 `FACT_CORRECTION` 又退化成纯科普。

Tavily 找到洗衣机清洁和电动车充电常识，但 3 条全部无 raw content，且出现同题跨站转载。

## 4. 本轮已经回答的问题

D4 证明：

```text
“中文开放 Web Search 只能找到严肃科普” = FALSE
```

在不接入真实社交平台的前提下，仅通过正确的中文 Mission，现有 Search/Fetch 已经能找到：

- 反转；
- 官方澄清；
- 普通人物故事；
- 暖心社会事件；
- 群聊诈骗；
- 娱乐回应；
- 常识纠偏。

尤其是“葫芦娃爷爷”和“班级群收款诈骗”与人工参考方向高度一致。

因此此前的主要问题确实不是 Editorial Core 只能做科普，而是 benchmark corpus / query strategy / source coverage 偏窄。

## 5. 同时暴露的新能力缺口

### 5.1 Platform / Community gap 仍然真实存在

Web Search 能找到“事件被报道后的网页”，但不能稳定提供：

- 原始微博 / 抖音 / 小红书帖子；
- 原始评论区；
- 点赞、转发、评论速度；
- 同城榜 / 热搜榜 / 平台内传播路径；
- 原视频 / 原始现场素材；
- 网友神评的完整 provenance。

所以 Search/Fetch 可以成为多栏目信息网络的重要层，但不能替代 PlatformProvider / CommunityProvider。

### 5.2 Event-level dedupe

URL dedupe 不够。同一个“学生脱校服帮老人止血”事件以多个媒体 URL 重复出现。

在进入 Opportunity 前需要：

```text
URL dedupe
→ event/entity similarity
→ same-story merge
→ source diversity retained as provenance
```

### 5.3 Temporal integrity

`published_at` 只能表示 Provider / 页面声称的发布时间，不能证明事件是“最近发生”。娱乐回应已经出现旧事件重发污染。

后续 Research / Opportunity 必须独立抽取并验证 event time。

### 5.4 Source quality / evidence routing

自媒体和 SEO 聚合页非常适合 Discovery，但不能直接承担 Evidence。需要把“发现得快”与“证据可信”继续分开。

### 5.5 Fetch body cleanliness

Firecrawl 本轮 coverage 很高，但部分正文前含大量导航和站点模板；Human Acceptance packet 已升级为 v2，保留 provider snippet / 正文 excerpt，避免只取页面开头。

## 6. Provider 阶段性判断

当前仍不能完成 0.5B-F 最终选型，但 D4 + blind review 使判断更清晰：

```text
Exa Search
→ 中文多栏目 discovery precision 本轮整体较好
→ 尤其 human-surprise / scam-risk / info-gap

Firecrawl Fetch
→ 中文站点 fetch coverage 13/14 = 92.9%
→ 适合作为独立正文获取层继续保留
→ latency 较高，正文 clean-up 仍需要上层处理

Tavily integrated
→ 继续保留 comparator / fallback
→ fetch coverage 和 Mission precision 在本轮更不稳定

Platform / Community Provider
→ 仍是正式 capability gap
→ 不能由 Search/Fetch 冒充
```

### Blind review 结果

Provider 身份揭盲后：

```text
A = Exa → Firecrawl
B = Tavily integrated
```

只统计 `context_sufficient=true`：

```text
A: 4 / 5 可完成判断，其中 2 值得做、2 观察
B: 1 / 5 可完成判断，其中 0 值得做、1 观察
```

唯一两条“值得做”均来自 A：

- 学生脱校服给老人止血；
- 家长群 / 班级群收款诈骗。

这支持 **Exa → Firecrawl 作为当前中文 Web 主链路候选**，但仍不能外推成全局 Provider Winner。

## 7. 下一 Gate

D4 的 Web 层盲审已完成。下一步进入 Platform / Community capability decision：

```text
中文热榜 / rank snapshot baseline
→ 官方 platform-item / metrics seam
→ Momentum enrichment
→ Platform / Community capability matrix
→ 0.5B-F Provider Decision + ADR
```

详细人工记录见 `PHASE_0_5B_E_HUMAN_ACCEPTANCE_AUDIT.md`。
