# Acquisition Architecture v1

## 1. 核心决定

Next 版本不再把某一个固定平台爬虫作为 Acquisition Core。

旧版的 `Platform-first Crawling` 调整为：

```text
Mission-driven Discovery
+ Search-first Acquisition
+ Ambient Feed Sensing
+ Potential Scouting
+ Momentum Radar
+ Human Acquisition
+ Targeted Retrieval
+ Targeted Platform Research
```

平台 Connector 是 Provider 之一，不是系统入口。

**热度不是进入 Discovery 的门槛。** 系统既要发现“正在迅速升温的东西”，也要主动寻找“尚未形成明显热度、但本身有趣、有用、反常识、有故事性、具保护价值或未来编辑潜力的东西”。

**机器不是唯一发现入口。** 用户在真实信息流中偶遇的 URL、帖子、问题、想法和观察，也必须能够低摩擦进入同一 Acquisition / RawSignal / Discovery 主链。

## 2. 目标

Acquisition 的目标不是最大化抓取量，也不是最大化热点命中，而是提高 **Editorial Discovery Yield**：单位采集/检索/人工投喂成本能够产生多少值得进入 Editorial Opportunity 的真实素材。

因此至少要同时覆盖三类价值入口：

1. **Attention-driven Discovery**：因为搜索量、讨论量、跨平台传播或社区活动突然变化而值得注意。
2. **Potential-driven Discovery**：即使当前没有明显升温，只要其 Intrinsic Value / Audience Connection / Editorial Tension / Utility / Story / Rediscovery Potential 等足够强，也可以进入 Discovery Pool。
3. **Human-seeded Discovery**：用户在日常浏览、聊天、工作或生活中注意到一个东西，交给系统继续验证、追问、组织和评价。

同时必须保留 Coverage / Provenance 数据，以区分：
- 系统没有看到；
- 系统看到了但没有形成 Discovery；
- 用户主动投喂但系统判断价值不足/事实不成立；
- 形成 Discovery 但 Value 较弱；
- Value 高但因 Research/Production 问题暂未采用。

## 3. Acquisition Mesh

```text
                                      Acquisition Network

       Ambient Sensing          Potential Scouts           Momentum Radar
       常驻环境监听               主动找“值得看”              发现“正在变热”
              │                       │                          │
       Feed / RSS / API          SearchProvider              TrendProvider
       Platform Watch            Query Strategy              Community/Platform Signals
              │                  Mission / Budget            Search/Attention Velocity
              │                       │                          │
              └──────────────┬───────────────┬──────────────────┘
                             │
                             │              Human Acquisition
                             │              用户主动投喂
                             │                    │
                             │         URL / Text / Question / Idea
                             │              HumanSubmission
                             │                    │
                             └──────────────┬─────┘
                                            ▼
                                      Candidate Sources
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

四个入口互补：
- Ambient Sensing 保证持续覆盖；
- Potential Scouts 主动寻找尚未热门但值得讲的东西；
- Momentum Radar 捕捉突然上升的社会注意力；
- Human Acquisition 捕捉用户真实浏览过程中的偶遇、异常感、跨领域联想和个人问题。

任何一条都可以独立产生 Discovery，不要求必须同时出现。

## 4. Ambient Sensing

负责低成本回答“最近有哪些新东西出现/更新”。

适用来源：
- RSS / Atom / RSSHub 类转换源；
- 官方 API；
- 新闻/机构/科研网站 Feed；
- Reddit、论坛、社区、博客等公开更新入口（须遵守对应访问政策）；
- 指定账号或主题的轻量 Watch；
- GitHub / Release / Newsletter 等结构化更新。

Ambient Sensor 不负责判断最终选题价值，只提供覆盖与新鲜信号。

## 5. Potential Scout

Potential Scout 是围绕 Editorial Mission 的主动价值侦察单元，重点解决“还没火，但可能值得讲”的内容发现。

示例 Mission：
- `COMMON_BELIEF_CONTRADICTION`：寻找大众常见认知与证据反差。
- `WHY_EXPLAINER`：寻找普通人常见但很少理解原因的现象。
- `STORY_BEHIND_THINGS`：寻找熟悉事物背后的陌生故事。
- `PROTECTIVE_VALUE`：诈骗、食品、消费、安全等保护性内容。
- `HUMAN_STORY`：寻找不依赖人物知名度、但故事本身具有普遍情绪或反差的素材。
- `CULTURE_DISCOVERY`：寻找电影、书、音乐、游戏等即使未升温但有故事、差异性或再解释价值的内容。
- `REDISCOVERY`：因当前语境或新角度重新值得讲的老内容。
- `OPEN_CURIOSITY`：允许探索性发现“只是因为它足够有趣/奇怪/值得问为什么”的内容。

Scout 持有：Mission、query strategy、recency、source preference、authority requirement、novelty constraint、budget、policy version。

**Scout 不需要证明趋势上涨才能保留结果。** 无 Trend 的内容可以进入 Opportunity Evaluation；`Trend = unavailable` 不等于 `Editorial Value = low`。

## 6. Momentum Radar

Momentum Radar 专门回答：
- 什么正在突然被更多人关注？
- 上升速度如何？
- 是单平台噪声还是跨平台扩散？
- 是新品/上映/新闻触发，还是旧内容重新翻红？

适合观察：
- 搜索趋势变化；
- Reddit / 论坛 / 社区讨论增速；
- 电影、剧集、歌曲、游戏、人物、网络梗的注意力变化；
- 平台榜单、Watchlist、互动/评论速度；
- 跨平台传播。

Momentum Radar 只产生 Attention / Trend Feature，不直接决定 Editorial Value。热点可以很弱；非热点也可以很强。

当 `momentum = high` 但 `explanation_confidence = low` 时，系统应优先建议 Research 来回答“为什么现在突然上升”；这是一条 Research Recommendation，不是机械 Gate。

## 7. Human Acquisition / HumanSubmission

Human Acquisition 是一等发现入口，不是后台“手工录入选题”。它解决的是：用户在真实信息流中已经注意到了一个值得系统继续看的东西，系统负责把低结构化线索变成可验证、可研究、可判断的编辑机会。

首版允许：

```text
URL
Text
Question
Idea
Observation
```

用户操作应尽量接近：

```text
“刚看到这个，感觉有意思 / 帮我看看。”
                 ↓
           HumanSubmission
                 ↓
         Fetch / Normalize
                 ↓
             RawSignal
                 ↓
     Subject / Discovery(HUMAN_SEED)
                 ↓
       Research / Evaluation
                 ↓
      Editorial Opportunity
```

关键规则：

- `HumanSubmission` 是 Acquisition 入口，不建立第二套 `HumanSignal` 模型。
- 用户粘贴第三方 URL 时，Source Origin 仍然是第三方；Acquisition Origin 才是 `HUMAN_SUBMISSION`。
- 用户直接陈述但无外部来源支持的说法，应以 unverified human assertion 进入 Evidence/Research。
- Submission 只表示“值得系统看一眼”，不等于用户已经认定内容真实或值得做。
- Submission 本身不是偏好正标签；后续 Adopt/Watch/Drop + reason 才是 Calibration 的有效信号。
- Machine 与 Human 两类入口共享相同事实核验、风险和 provenance 标准。

## 8. Source Role：发现来源与证据来源分离

来源是否“官方”不能决定是否值得采集。一个非官方帖子可以是优秀的发现信号，但不能自动成为事实依据。

同一来源在不同上下文可承担不同角色：

```text
DISCOVERY_SIGNAL       告诉系统“这里可能有东西值得看”
TREND_SIGNAL           告诉系统“注意力正在变化”
AUDIENCE_SIGNAL        反映普通人的理解、争论、情绪或真实经历
PRIMARY_SOURCE         第一手来源
EVIDENCE_SOURCE        可支持具体事实判断的资料
CONTRADICTION_SOURCE   提供反方/冲突证据
MATERIAL_SOURCE        提供图片、视频、历史材料或可视化线索
```

例如 Reddit 帖子可以是 `DISCOVERY_SIGNAL + AUDIENCE_SIGNAL`，后续再通过 Primary/Official/Research Source 验证其中事实。禁止因为来源非官方就完全忽略，也禁止因为热度高或用户主动投喂就直接当作已证实事实。

## 9. Targeted Retrieval

SearchProvider 主要负责发现来源与 URL；FetchProvider 负责读取页面正文、日期、作者、媒体、结构化元数据。

HumanSubmission 中如果包含 URL，也应优先复用 FetchProvider，而不是另建一套人工入口抓取器。

Search 与 Fetch 通过独立 Provider Contract 解耦，允许：
- 一个 Provider 同时实现两类能力；
- Search 与 Fetch 使用不同供应商/自建服务；
- Provider 失败时替换而不修改 Editorial Core。

## 10. Platform Research

社交平台采集主要用于三种场景：

1. Ambient Watch：低量观察特定账号/榜单/主题。
2. Momentum Radar：识别社区或平台内异常上升的注意力。
3. Opportunity Research：已经发现值得追的主题后，定向研究真实讨论、争议、评论、流传程度和素材可得性。

Legacy MediaCrawler 如继续使用，应包装为 `PlatformProvider` / `LegacyMediaCrawlerAdapter`，不得让新业务模型依赖其内部数据结构。

## 11. Research Acquisition

形成 Opportunity 后，可以按 Research Gap 再次获取资料：
- Primary / official sources；
- 反方证据；
- 普通用户真实讨论；
- 历史背景；
- 图片/视频/可视化素材；
- Knowledge Gateway 中已有内部资料。

因此 Acquisition 不是一次性流水线，而是：

```text
广泛发现 / 用户投喂 → 判断值得追 → 定向补证 → 重新评价
```

发现阶段可以从非官方、社区、趋势、开放探索或 Human Seed 开始；事实确认阶段必须回到 Evidence/Provenance 规则。

## 12. Provider 边界

V1 至少定义：
- `SearchProvider`
- `FetchProvider`
- `FeedProvider`
- `PlatformProvider`
- `TrendProvider`

HumanSubmission 不是外部 Provider；它是产品自身的 Acquisition ingress，并复用 Provider 完成 URL fetch / research。

KnowledgeProvider 属于 Knowledge Architecture，不混入 Acquisition Provider。

当前可作为 Spike 候选的实现包括语义 Web Search 服务、自建/托管 Web Fetch/Crawl 服务、RSS/RSSHub、社区/平台 API 或合法数据入口、趋势数据服务、Legacy MediaCrawler/custom connector；**候选实现不是冻结供应商决定**。

## 13. RawSignal Acquisition Provenance

所有采集结果必须能够回答“为什么、通过什么方式、在什么上下文中找到”。至少保存：

```text
source_origin
acquisition_origin
acquisition_method
provider（适用时）
mission / source scope（适用时）
discovery_lane: ambient | potential | momentum | human | research
source_role(s)
query / query variant（适用时）
result rank（适用时）
search/run/submission id
source url / external id
collected_at
discovered_at
fetch provider / extractor version
policy/config version
```

敏感凭证和不必要的内部 Provider payload 不进入模型可见上下文。

## 14. Editorial Advantage

Acquisition 只负责“看见”，不能把“抓到了”冒充产品价值。

每个最终进入 Candidate 的 Opportunity 必须能够回答：

> 系统相对于原始信息新增了什么编辑价值？

增量可以是更早发现、跨源连接、趋势解释、事实验证、认知纠偏、背景补充、Angle 转换、Theme 提升、受众连接、Actionability 或未来回访钩子。

这条规则追求的是 **Editorial Advantage**，而不是要求原始信息具有独家性或普通用户无法直接看到。

## 15. Coverage & Quality

至少分别测量：
- Acquisition Coverage
- Source Diversity
- Community / Non-official Coverage
- Authority / Primary-source Ratio
- Potential Discovery Yield
- Momentum Discovery Yield
- Human Submission Processing / Yield
- Deduplication Rate
- Fetch Success Rate
- Editorial Discovery Yield
- Cost / Latency

禁止用“抓取条数”“热点命中数”“官方来源占比”或“用户投喂数量”单独代表采集质量。
