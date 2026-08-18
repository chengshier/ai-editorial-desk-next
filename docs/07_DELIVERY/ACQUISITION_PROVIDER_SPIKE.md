# Acquisition Provider Spike

## 1. 目的

验证 Next 的 Mission-driven Acquisition 是否真的比旧版 Platform-first 抓取更能产生高价值 Editorial Opportunity，并据此选择 V1 Provider 组合。

Spike 必须同时验证两件事：

1. 能不能发现 **正在快速获得注意力** 的内容；
2. 能不能发现 **尚未明显升温、但本身已经有编辑潜力** 的内容。

如果只能做好其中一种，Spike 不能视为完整通过。

## 2. 不比较“谁抓得多”

核心指标：**Editorial Discovery Yield**。

示例：

```text
Provider A 获取 1000 条资料 → 8 个可进入 Opportunity 的素材 = 0.8%
Provider B 获取 80 条资料   → 12 个可进入 Opportunity 的素材 = 15%
```

后一种通常更符合本项目目标。

同时分别记录：
- `Potential Discovery Yield`
- `Momentum Discovery Yield`

避免某个 Provider 只靠追热点取得高总分，却漏掉 Evergreen/Curiosity/Story 内容。

## 3. 测试任务

从已有人类标注样本和新的真实开放素材中设计 12~20 个 Discovery Mission，至少覆盖：

### Potential-driven Missions
- common belief contradiction；
- everyday why/explainer；
- protective value / scam / food safety；
- story behind familiar things；
- human story with universal angle；
- culture discovery：电影/书/音乐/游戏中“未必热门但有故事/差异性”的内容；
- rediscovery in current context；
- open curiosity：只是因为足够有趣、奇怪、值得问“为什么”。

### Momentum-driven Missions
- recent search/attention surge；
- rapidly rising film / series / song / game / person；
- Reddit / forum / community discussion acceleration；
- cross-platform spread；
- old content suddenly resurfacing；
- emerging technology with ordinary-person relevance。

每个 Mission 在可比预算下运行候选 Provider；不要求所有 Provider 都实现同一种 capability，但必须记录 unsupported/unavailable。

## 4. Source Mix 要求

Spike 测试素材必须故意混合不同来源角色，不能只用官方科普资料：

- Primary / official source；
- 专业媒体 / 研究资料；
- Reddit / forum / community；
- 电影/文化社区或公开榜单/趋势信号；
- Blog / newsletter / personal story；
- Social/platform discussion；
- Evergreen / historical source。

需要验证：

```text
非官方来源能否作为 Discovery/Audience/Trend Signal 被发现
↓
Research 能否再找到更可靠的 Evidence/Primary Source
```

而不是简单统计“官方来源占比越高越好”。

## 5. Provider 组

至少比较：

1. Legacy Platform-first baseline
   - 旧 MediaCrawler / 固定平台搜索的受控样本。
2. Search-first 组合
   - 一个语义 SearchProvider + 一个 FetchProvider。
3. Search+Fetch 一体化服务
   - 用于验证运维简单性与结果质量。
4. Feed/Ambient baseline
   - RSS / RSSHub / 官方 Feed/API / 合规社区 Feed。
5. Trend/Momentum capability
   - 一个或多个 TrendProvider / Platform trend capability，用于观察 attention velocity、榜单变化或社区增速。
6. Community/Platform research capability
   - Reddit/论坛/平台等合法可用入口，用于 Discovery/Audience Signal 与定向研究。

具体供应商在 Spike 开始前根据当时可用性、价格、条款和技术状态确认；文档不提前锁定厂商。

## 6. 统一记录

每次 run 保存：
- mission/version；
- discovery lane：ambient / potential / momentum / research；
- provider/version；
- source role(s)；
- query variants；
- retrieved/fetched count；
- duplicate count；
- primary/authoritative source ratio；
- community/non-official coverage；
- source diversity；
- latency/cost；
- fetch failures；
- 形成 Discovery/Opportunity 的数量；
- 是否需要后续 Evidence Research；
- 人工 `做 / 可能做 / 不做` 结果。

## 7. 评价维度

### Acquisition Quality
- 覆盖是否真实；
- 是否覆盖官方、社区、文化、历史等不同 Source Role；
- provenance 是否完整；
- 去重/规范化是否稳定。

### Discovery Quality
- 是否找到不同类型的内容机会；
- 是否过度依赖热点/科技/官方科普；
- 是否能发现冷知识、实用、安全、人物、文化、Rediscovery；
- 是否能发现当前没有明显 Trend、但人类仍认为“值得看/可能做”的内容；
- 是否能发现 Reddit/社区出现的早期信号；
- 是否能发现电影/文化对象的 attention surge 或旧内容重新翻红。

### Editorial Yield
- Opportunity conversion rate；
- Potential Discovery Yield；
- Momentum Discovery Yield；
- Human Gold 中“做/可能做”比例；
- 可形成强 Angle / Theme / Audience Promise 的比例。

### Evidence Follow-up
- 社区/非官方 Discovery 后，能否定位 Primary/Evidence Source；
- 找不到可靠证据时是否正确保留 Unknown/Investigating；
- 不得把热帖、搜索热度或 Provider score 直接升级为事实。

### Engineering
- 成本；
- latency；
- rate limits；
- 自托管复杂度；
- 稳定性；
- 替换难度。

## 8. 最小人工验收样本

Spike 结果至少抽取：

```text
5 个高 Momentum Discovery
5 个低/无 Momentum 但高 Potential Discovery
5 个 Community/Non-official first Discovery
5 个普通/失败 Discovery 作为负样本
```

人工查看：
- 是否真的想看；
- 是否会做；
- 适合主推/栏目/长期储备/不收录；
- Provider 为什么找到它；
- 后续 Research 是否能建立可靠 Evidence。

## 9. 输出

Spike 结束必须形成：
- Provider capability matrix；
- benchmark 数据；
- Potential/Momentum 两条 lane 的结果对比；
- 推荐的 V1 provider 组合；
- fallback strategy；
- 是否保留 Legacy MediaCrawler，以及保留在哪些 capability；
- Community/Trend Provider 的合规与访问边界；
- ADR。

## 10. 默认假设

当前设计假设是：

```text
Ambient Coverage
+ Potential Scouts
+ Momentum Radar
+ Semantic Search
+ Targeted Fetch
+ Targeted Platform Research
```

优于“固定平台每天抓 N 条”或“只追正在升温的热点”作为核心采集策略。

该假设必须由 Spike 验证，不把讨论结论伪装成性能事实。
