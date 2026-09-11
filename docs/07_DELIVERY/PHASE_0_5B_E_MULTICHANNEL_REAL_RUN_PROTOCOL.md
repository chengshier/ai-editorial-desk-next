# Phase 0.5-B E — Multi-channel Real Run Protocol

## 状态

`READY_FOR_REAL_RUN`

本轮不替代 D2-B 的解释型 Search/Fetch benchmark，而是补一组更接近 AI Editorial Desk Next 多栏目目标的中文开放网页样本。

## 1. 本轮回答的问题

当前 D2-B 已经证明：

```text
Exa Search → Firecrawl Fetch
vs
Tavily integrated Search+Fetch
```

在英文 Potential / 深度解释型 Mission 上都能工作。

D4 要继续回答：

> 同一组 Provider 在中文、多栏目、非学术型选题上是否仍能稳定发现值得人工编辑继续看的候选？

以及：

> 如果开放 Web Search 无法稳定覆盖社会事件、人物、反转、评论和娱乐回应，这个缺口究竟有多大，是否足以要求 V1 明确增加 PlatformProvider / 国内趋势与社区来源？

## 2. 固定 Mission Corpus

版本文件：

`benchmarks/acquisition/mission_templates.multichannel.zh-CN.v1.json`

固定 5 个 Mission：

```text
1. multichannel-cn-info-gap-reversal
   信息差 / 反转 / 官方澄清

2. multichannel-cn-human-surprise
   普通人物 / 暖心 / 惊险 / 社会反差

3. multichannel-cn-scam-risk
   新型诈骗 / 消费风险 / 反诈提醒

4. multichannel-cn-culture-response
   娱乐 / 影视 / 人物回应 / 原话

5. multichannel-cn-fact-correction
   常识纠偏 / 历史日期 / 日常误区
```

本轮只验证公开 Web Search/Fetch。它不是微博、抖音、小红书、快手等 PlatformProvider 的替代品。

## 3. 运行边界

保持与 D2-B 相近的小预算：

```text
每 Mission max_results = 3
Exa top 3 → Firecrawl Fetch
Tavily max 3 integrated Search+Fetch
5 Missions
```

预期上限：

```text
Exa candidates       <= 15
Firecrawl fetch URLs <= 15
Tavily candidates    <= 15
```

不提交 `.local-benchmark/` 原始 artifact。

## 4. PowerShell 运行命令

在本地三个 provider key 已通过环境变量配置后：

```powershell
cd F:\newWorkSpace\ai-editorial-next\editorial-next

git checkout spike/phase-0.5b-acquisition-providers
git pull --ff-only origin spike/phase-0.5b-acquisition-providers

.\.venv\Scripts\python.exe -m benchmarks.acquisition.run_keyed_search_fetch `
  --manifest benchmarks\acquisition\mission_templates.multichannel.zh-CN.v1.json `
  --max-results 3 `
  --fetch-limit 3 `
  --output .local-benchmark\phase-0.5b-d4-multichannel-zh-cn.json
```

确认：

```powershell
Get-Item .local-benchmark\phase-0.5b-d4-multichannel-zh-cn.json
```

## 5. D4 审计维度

不能只看 retrieved_count。逐 Mission 检查：

### 5.1 Discovery Relevance

- 是否真的命中 Mission；
- 是否只是关键词碰撞；
- 是否存在明显过时、海外语境错配或 SEO 垃圾；
- 是否能让人快速看懂“为什么值得注意”。

### 5.2 Local / Chinese Web Coverage

- 中文来源比例；
- 中国本地事件比例；
- 官方 / 本地媒体 / 全国媒体 / 博客 / 聚合站分别占多少；
- 是否缺少社交平台原帖、评论、现场素材。

### 5.3 Fetch Correctness

- Firecrawl 是否抓到真正正文；
- Tavily raw content 是否与搜索标题对应；
- 非空正文不得自动视为正确正文；
- 失败 / 页面壳 / 跳转页必须明确记录。

### 5.4 Editorial Reviewability

候选至少需要能整理出：

```text
发生了什么
反差 / 信息差是什么
当前事实来源是什么
还缺什么证据
适合哪些 Series / Editorial Mode
```

只给标题仍判 `context_sufficient=false`。

## 6. Provider-blind Human Acceptance

D4 完成后运行：

```powershell
.\.venv\Scripts\python.exe -m benchmarks.acquisition.build_multichannel_acceptance_packet `
  --d4 .local-benchmark\phase-0.5b-d4-multichannel-zh-cn.json `
  --output .local-benchmark\phase-0.5b-e-multichannel-acceptance.json
```

构建器会为每个 Mission 选：

```text
1 条 Exa → Firecrawl
1 条 Tavily integrated
```

共 10 条，生成 `M1-A / M1-B ... M5-A / M5-B` 的盲评标签。人工判断时先不展示 Provider 名称，避免因为 Provider 先验偏见影响判断。

新增人工字段：

```text
investment_priority
  HIGH / MEDIUM / LOW

production_depth
  DEEP_DIVE / STANDARD / BRIEF

series_fit
  可多选栏目

editorial_mode_fit
  可多选内容形态
```

原字段仍保留：

```text
decision
would_read
would_make
rationale
evidence_followup_needed
context_sufficient
```

## 7. D4 完成后的决策边界

可能出现三种结果：

### A. Search/Fetch 已有较好覆盖

说明 Exa / Tavily 能承担一部分“每日信息差”开放网页发现，但仍需单独评估平台评论、热榜、原帖和现场素材能力。

### B. 能找新闻，但缺 Audience / Material

说明 Web Search 适合作为背景与补证层，V1 仍需要 PlatformProvider / CommunityProvider 补：

```text
原帖
评论
热度变化
本地同城信号
现场图片 / 视频
人物原始回应
```

### C. 中文社会 / 娱乐类 Discovery 本身明显失真

说明不能用英文 Search Provider 的表现外推到多栏目 V1；0.5B-F 必须把 PlatformProvider 能力列为正式选型缺口，而不是硬选一个“全能 Provider”。

## 8. 不变规则

- Provider rank / score 不等于 Editorial Value；
- 热度不等于值得做；
- 快节奏栏目也必须保留 Evidence / Provenance；
- 社交评论只作为 Audience Signal，不自动成为事实证据；
- Hook / 段子 / 爽感属于栏目与创作策略，不能覆盖事实层；
- D4 不实现验证码绕过、指纹伪造、自动换号、代理轮换等平台规避能力。
