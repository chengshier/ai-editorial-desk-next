# Acquisition Provider Spike

## 1. 目的

验证 Next 的 Mission-driven Acquisition 是否真的比旧版 Platform-first 抓取更能产生高价值 Editorial Opportunity，并据此选择 V1 Provider 组合。

## 2. 不比较“谁抓得多”

核心指标：**Editorial Discovery Yield**。

示例：

```text
Provider A 获取 1000 条资料 → 8 个可进入 Opportunity 的素材 = 0.8%
Provider B 获取 80 条资料   → 12 个可进入 Opportunity 的素材 = 15%
```

后一种通常更符合本项目目标。

## 3. 测试任务

从已有人类标注样本中反向设计 10~20 个 Discovery Mission，例如：
- common belief contradiction；
- everyday why/explainer；
- protective value / scam / food safety；
- story behind familiar things；
- rediscovery in current context；
- emerging technology with ordinary-person relevance。

每个 Mission 使用同等预算运行候选 Provider。

## 4. Provider 组

至少比较：

1. Legacy Platform-first baseline
   - 旧 MediaCrawler / 固定平台搜索的受控样本。
2. Search-first 组合
   - 一个语义 SearchProvider + 一个 FetchProvider。
3. Search+Fetch 一体化服务
   - 用于验证运维简单性与结果质量。
4. Feed/Ambient baseline
   - RSS / RSSHub / 官方 Feed/API。

具体供应商在 Spike 开始前根据当时可用性、价格、条款和技术状态确认；文档不提前锁定厂商。

## 5. 统一记录

每次 run 保存：
- mission/version；
- provider/version；
- query variants；
- retrieved/fetched count；
- duplicate count；
- primary/authoritative source ratio；
- source diversity；
- latency/cost；
- fetch failures；
- 形成 Discovery/Opportunity 的数量；
- 人工 `做 / 可能做 / 不做` 结果。

## 6. 评价维度

### Acquisition Quality
- 覆盖是否真实；
- 权威来源是否足够；
- provenance 是否完整；
- 去重/规范化是否稳定。

### Discovery Quality
- 是否找到不同类型的内容机会；
- 是否过度依赖热点/科技；
- 是否能发现冷知识、实用、安全、人物、文化、Rediscovery。

### Editorial Yield
- Opportunity conversion rate；
- Human Gold 中“做/可能做”比例；
- 可形成强 Angle / Theme / Audience Promise 的比例。

### Engineering
- 成本；
- latency；
- rate limits；
- 自托管复杂度；
- 稳定性；
- 替换难度。

## 7. 输出

Spike 结束必须形成：
- Provider capability matrix；
- benchmark 数据；
- 推荐的 V1 provider 组合；
- fallback strategy；
- 是否保留 Legacy MediaCrawler，以及保留在哪些 capability；
- ADR。

## 8. 默认假设

当前设计假设是：

```text
Feed/Ambient
+ Semantic Search
+ Targeted Fetch
+ Targeted Platform Research
```

优于“固定平台每天抓 N 条”作为核心采集策略。

该假设必须由 Spike 验证，不把讨论结论伪装成性能事实。