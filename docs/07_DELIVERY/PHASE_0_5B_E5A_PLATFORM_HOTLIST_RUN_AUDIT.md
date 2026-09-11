# Phase 0.5-B E5-A — 中文平台热榜真实运行审计

## 状态

`COMPLETE / PASS WITH LIMITATIONS`

本轮验证中文平台热榜能否作为 `DISCOVERY_SIGNAL + TREND_SIGNAL` 的 no-key snapshot baseline。使用自部署 NewsNow 读取微博、抖音、知乎、B 站热搜；不把热榜排名解释为长期速度，也不把热榜项升级为 Evidence。

## 1. 两次真实运行

### 1.1 公共 demo 首轮

公共实例：

```text
https://newsnow.busiyi.world/api/s
```

微博 / 抖音 / 知乎 / B 站四个平台均返回 HTTP 403。该结果仅说明公共 demo 对本次 benchmark 不可用，不能推导平台能力失败。

因此 Spike 已把公共 demo 降级为 `probe-only / explicit opt-in`，默认 endpoint 改为自部署：

```text
http://127.0.0.1:4444/api/s
```

### 1.2 自部署重跑

```text
mission_count   1
mission_id      momentum-search-attention-surge
platform_count  4
platforms       weibo / douyin / zhihu / bilibili-hot-search
max_results     10
```

结果：

```text
weibo                 SUCCESS   10 retrieved   39 ms
douyin                SUCCESS   10 retrieved   1219 ms
zhihu                 SUCCESS   10 retrieved   399 ms
bilibili-hot-search   SUCCESS   10 retrieved   369 ms

TOTAL                  40 candidates
required roles PASS    4 / 4
```

四个平台均观测到：

```text
DISCOVERY_SIGNAL
TREND_SIGNAL
```

且全部 `required_roles_satisfied=true`。

## 2. 热榜语义验证

本轮证明自部署 NewsNow 可稳定提供四个平台的当前热榜 / 热搜快照，但语义必须保持：

```text
hotlist rank snapshot
!= longitudinal attention velocity
!= Editorial Value
!= Confirmed Evidence
```

单次快照只回答“当前平台正在关注什么”。若要回答“正在快速上升”，必须持久化多次 `observed_at` 并比较排名 / 热度变化。

## 3. 不同平台的数据丰富度差异

### 3.1 微博

10/10 有热搜标题、微博热搜 URL、rank 与 observed_at，但本轮没有正文、发布时间、作者或可比较的互动数。

代表样本：

- `男子编造停捐遭威胁事件被抓`，rank 1；
- `香蕉地喷3天农药毒死隔壁5万斤牛蛙`，rank 4；
- `罚了51.79亿携程为何还在杀熟`，rank 6；
- `7岁半性早熟女童家里是开炸鸡店的`，rank 8。

这些题材与“每日信息差 / 社会事件 / 风险提醒”方向高度相关，但标题本身仍不足以进入人工编辑判断，必须接 Search/Fetch/Research。

### 3.2 抖音

10/10 有 hot topic URL、rank 与 observed_at，但本轮聚合结果基本只有标题，没有原视频作者、发布时间、点赞/播放/评论等 item metrics。

代表样本：

- `国家对成品油价格实施调控`，rank 1；
- `当中式审美回到下颌角时代`，rank 7；
- `入秋第一口肉太野了`，rank 10。

说明 E5-A 可承担热点发现，但不能冒充 E5-B 的原视频 / metrics seam。

### 3.3 知乎

本轮数据最丰富。10/10 都带 `info` 热度文本，9/10 带较长 `hover` 上下文。

代表样本：

- `武汉一小学学生不订奶就后排罚站，教育局称系误解...`，1056 万热度；
- `老人拨打120误触手机“魔法画报”功能难退出...`，532 万热度；
- `影视飓风给全员发万元 iPhone Duo...`，282 万热度；
- `中国博主伦敦直播遭外籍青年殴打抢劫...`，177 万热度。

这说明 Platform/Community 层不仅能补“热”，还可能直接提供事件上下文。但这些 `hover` 仍属于聚合展示材料，不自动成为 Evidence。

### 3.4 B 站热搜

10/10 有搜索标题、搜索 URL、rank 与 observed_at；部分有 icon，但没有具体命中的视频 item、UP 主、发布时间、播放 / 点赞 / 评论等指标。

代表样本：

- `UP主自制Macbook Duo`，rank 1；
- `周杰伦西西里MV`，rank 4；
- `国家对成品油价格实施调控`，rank 5；
- `为什么电视还在死磕LCD`，rank 6。

所以 B 站 E5-A 当前只是“热搜词”能力，不是原视频能力。

## 4. 跨平台重合

40 条候选中存在 1 条精确标题重合：

```text
国家对成品油价格实施调控
Douyin rank 1
Bilibili rank 5
```

这证明同一事件可在近同时刻进入多个平台注意力面。

但单次横截面只能形成：

```text
cross-platform presence signal
```

不能直接形成：

```text
cross-platform acceleration / velocity
```

后者仍需要多时点历史。

## 5. 本轮对产品目标的意义

E5-A 的真实结果明显补足了此前 Web Search 的盲区：

```text
Web Search/Fetch
→ 找背景、媒体报道、正式资料

Platform Hotlist
→ 告诉系统“此刻大家正在看什么”
```

特别是知乎首屏已经出现“学校争议 + 官方回应”“老人紧急呼叫与手机设计”“公司福利反差”等非常接近人工参考博主的内容形态，证明多频道编辑部确实需要 Platform/Community 输入，而不是只靠 Web Search。

## 6. 仍然存在的正式缺口

E5-A 通过后仍未解决：

```text
P2 original platform item
- 原微博 / 原视频 / 原回答
- 作者 / 发布者
- platform published_at
- 原始文本 / 视频描述 / 素材 URL

P3 engagement snapshot
- 点赞 / 评论 / 转发 / 播放
- observed_at
- 多时点变化

P4 comments / community reaction
- 原评论及 provenance
- 讨论方向
- 评论速度
```

NewsNow hotlist 不应承担这些能力。

## 7. E5-B 方向

E5-B 先选择抖音官方能力做第一个正式 platform-item seam，因为官方开放平台当前提供“抖音视频搜索”，能够返回 item_id、视频标题、作者昵称、发布时间、播放页链接、文本与点赞统计；搜索 rank 只作为 query relevance，不作为 Trend。

Spike 已开始实现：

```text
DouyinVideoSearchProvider
run_douyin_official_probe.py
```

其语义边界：

```text
official platform item
→ DISCOVERY_SIGNAL + AUDIENCE_SIGNAL + MATERIAL_SOURCE

search rank
→ query relevance only

likes / future metrics
→ point-in-time audience snapshot

platform item claims
→ not automatically Confirmed Evidence
```

## 8. 下一 Gate

1. E5-A 标记 COMPLETE / PASS WITH LIMITATIONS；
2. 完成 E5-B 抖音官方 adapter / runner / contract tests；
3. 只有本地具备官方 token / device_id 时再做真实 keyed probe；
4. 微博官方 CLI / trend capability 作为第二条 official seam 评估，不要求与抖音同时阻塞；
5. 将 Hotlist Trend Signal 与 Exa/Firecrawl 上下文拼接，补做 Momentum Human Acceptance；
6. 完成 capability matrix 后进入 0.5B-F Provider Decision + ADR。
