# Acquisition Architecture v1

## 1. 核心决定

Next 版本不再把某一个固定平台爬虫作为 Acquisition Core。

旧版的 `Platform-first Crawling` 调整为：

```text
Mission-driven Discovery
+ Search-first Acquisition
+ Ambient Feed Sensing
+ Targeted Retrieval
+ Targeted Platform Research
```

平台 Connector 是 Provider 之一，不是系统入口。

## 2. 目标

Acquisition 的目标不是最大化抓取量，而是提高 **Editorial Discovery Yield**：单位采集/检索成本能够产生多少值得进入 Editorial Opportunity 的真实素材。

同时必须保留 Coverage 数据，以区分：
- 系统没有看到；
- 系统看到了但没有形成 Discovery；
- 形成 Discovery 但 Value 较弱；
- Value 高但因 Research/Production 问题暂未采用。

## 3. Acquisition Mesh

```text
                     Acquisition Network

       Ambient Sensing                Discovery Scouts
       常驻环境监听                    主动价值侦察
              │                            │
       Feed / RSS / API             SearchProvider
       Platform Watch               Query Strategy
              │                     Mission / Budget
              └──────────────┬─────────────┘
                             ▼
                       Candidate URLs/Items
                             │
                     Targeted Retrieval
                             │
                       FetchProvider
                             │
                             ▼
                          RawSignal
                             │
                     Subject / Discovery
                             │
                     Editorial Opportunity
                             │
                    Research Acquisition
                      ┌──────┼──────┐
                      ▼      ▼      ▼
                    Search  Fetch  Platform
                                  Research
```

## 4. Ambient Sensing

负责低成本回答“最近有哪些新东西出现/更新”。

适用来源：
- RSS / Atom / RSSHub 类转换源；
- 官方 API；
- 新闻/机构/科研网站 Feed；
- 指定账号或主题的轻量 Watch；
- GitHub / 博客 / Release / Newsletter 等结构化更新。

Ambient Sensor 不负责判断最终选题价值，只提供覆盖与新鲜信号。

## 5. Discovery Scout

Discovery Scout 是围绕 Editorial Mission 的主动侦察单元。

示例 Mission：
- `COMMON_BELIEF_CONTRADICTION`：寻找大众常见认知与证据反差。
- `WHY_EXPLAINER`：寻找普通人常见但很少理解原因的现象。
- `STORY_BEHIND_THINGS`：寻找熟悉事物背后的陌生故事。
- `PROTECTIVE_VALUE`：诈骗、食品、消费、安全等保护性内容。
- `REDISCOVERY`：因当前语境重新值得讲的老内容。
- `EMERGING`：正在升温的新事件/技术/文化现象。

Scout 持有：Mission、query strategy、recency、source preference、authority requirement、novelty constraint、budget、policy version。

Scout 不绑定单一站点；SearchProvider 负责跨 Web 发现。

## 6. Targeted Retrieval

SearchProvider 主要负责发现来源与 URL；FetchProvider 负责读取页面正文、日期、作者、媒体、结构化元数据。

Search 与 Fetch 通过独立 Provider Contract 解耦，允许：
- 一个 Provider 同时实现两类能力；
- Search 与 Fetch 使用不同供应商/自建服务；
- Provider 失败时替换而不修改 Editorial Core。

## 7. Platform Research

社交平台采集主要用于两种场景：

1. Ambient Watch：低量观察特定账号/榜单/主题。
2. Opportunity Research：已经发现值得追的主题后，定向研究真实讨论、争议、评论、流传程度和素材可得性。

Legacy MediaCrawler 如继续使用，应包装为 `PlatformProvider` / `LegacyMediaCrawlerAdapter`，不得让新业务模型依赖其内部数据结构。

## 8. Research Acquisition

形成 Opportunity 后，可以按 Research Gap 再次获取资料：
- Primary / official sources；
- 反方证据；
- 普通用户真实讨论；
- 历史背景；
- 图片/视频/可视化素材；
- Knowledge Gateway 中已有内部资料。

因此 Acquisition 不是一次性流水线，而是：

```text
广泛发现 → 判断值得追 → 定向补证 → 重新评价
```

## 9. Provider 边界

V1 至少定义：
- `SearchProvider`
- `FetchProvider`
- `FeedProvider`
- `PlatformProvider`

KnowledgeProvider 属于 Knowledge Architecture，不混入 Acquisition Provider。

当前可作为 Spike 候选的实现包括语义 Web Search 服务、自建/托管 Web Fetch/Crawl 服务、RSS/RSSHub、Legacy MediaCrawler/custom connector；**候选实现不是冻结供应商决定**。

## 10. RawSignal Acquisition Provenance

所有采集结果必须能够回答“为什么、通过什么方式、在什么上下文中找到”。至少保存：

```text
acquisition_method
provider
mission / source scope
query / query variant（适用时）
result rank（适用时）
search/run id
source url / external id
collected_at
discovered_at
fetch provider / extractor version
policy/config version
```

敏感凭证和不必要的内部 Provider payload 不进入模型可见上下文。

## 11. Coverage & Quality

至少分别测量：
- Acquisition Coverage
- Source Diversity
- Authority / Primary-source Ratio
- Deduplication Rate
- Fetch Success Rate
- Editorial Discovery Yield
- Cost / Latency

禁止用“抓取条数”单独代表采集质量。