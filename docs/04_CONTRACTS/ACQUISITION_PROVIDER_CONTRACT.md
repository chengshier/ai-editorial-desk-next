# Acquisition Provider Contract v1

## 1. 目标

Acquisition Provider 只负责“发现/获取资料”，不负责决定最终编辑价值。Editorial Core 不依赖具体供应商 SDK。

**Provider 不得把“热度”当作进入 Discovery 的硬门槛。** V1 同时支持 Potential-driven 与 Momentum-driven 两类机器发现。

HumanSubmission 不属于外部 Provider；它是产品自身的 Human Acquisition ingress，但会复用 Fetch/Search/Platform Provider 完成读取和后续 Research。

## 2. SearchProvider

职责：根据 Mission / Query Strategy 返回候选来源。

最小输入：

```text
query
mission
recency
source preferences
language
limit
budget/context
```

最小输出：

```text
provider_result_id
url / canonical_url
title/snippet
published_at（若可得）
source/domain
rank / provider score（若可得）
provider metadata
```

Provider score 只能作为 provider feature，不能直接等于 Editorial Value。

## 3. FetchProvider

职责：对已知 URL 做定向读取与规范化。

输出至少区分：
- canonical URL；
- title/body；
- author/published_at；
- structured metadata；
- media refs；
- extraction/fetch status；
- extractor/provider version。

正文不可获取时必须明确 `unavailable_reason`，不能返回空正文并当作成功。

HumanSubmission 若包含第三方 URL，应复用同一个 FetchProvider Contract，不建立专门的“人工投喂抓取器”。

## 4. FeedProvider

职责：稳定轮询/订阅低成本更新源。

必须支持：
- stable source scope；
- checkpoint/cursor；
- idempotency；
- published/collected timestamp；
- coverage/failure audit。

## 5. PlatformProvider

职责：面向具体平台/社区的轻量 Watch、Trend Observation 或 Targeted Research。

V1 不要求所有 Provider 具有同等能力。能力通过 capability 声明，例如：

```text
search_posts
fetch_post
fetch_comments
watch_account
watch_topic
fetch_metrics
observe_trend
```

缺失能力应返回 `unsupported`，不得由上层猜测。

## 6. TrendProvider

职责：提供“注意力如何变化”的客观 Feature，不负责判断内容值不值得做。

最小输入可包括：

```text
subject/query/topic hint
region
language
window
source scope
```

最小输出：

```text
provider_result_id
subject/topic hint
signal_type
observed_at
window
velocity / delta / normalized attention（若可得）
source/platform scope
region/language
supporting refs
provider metadata
```

必须允许 `unavailable / insufficient_history / unsupported`。禁止用 `0` 代替不可用。

TrendProvider 的任何数值都只能进入 Trend/Attention Feature；不能直接等于 Editorial Value，也不能成为 Candidate 的强制前置条件。

## 7. SourceRole Contract

AcquisitionResult / RawSignal 应允许声明一个或多个 `source_role`：

```text
DISCOVERY_SIGNAL
TREND_SIGNAL
AUDIENCE_SIGNAL
PRIMARY_SOURCE
EVIDENCE_SOURCE
CONTRADICTION_SOURCE
MATERIAL_SOURCE
```

规则：
- 非官方社区内容可以成为 Discovery/Audience/Trend Signal。
- `DISCOVERY_SIGNAL` 不等于事实已确认。
- `TREND_SIGNAL` 不等于内容值得做。
- `PRIMARY_SOURCE` 也不自动等于该来源里的所有说法都为真；仍需 Evidence 规则。
- 同一来源可承担多个角色。
- 用户提交一个来源不会改变它的 source role 或 source origin；HumanSubmission 只改变 acquisition origin。

## 8. Discovery Lane

每次 acquisition / ingestion 至少标记：

```text
ambient
potential
momentum
human
research
```

其中：
- `potential` 用于寻找尚未明显升温、但可能有编辑价值的内容；
- `momentum` 用于寻找注意力快速变化；
- `human` 表示由 HumanSubmission 触发；
- `research` 表示围绕已有 Opportunity 的定向补证；
- 各 lane 可以独立形成 Discovery。

`human` lane 不是 Provider 类型，也不代表正偏好标签。

## 9. Normalization

所有 Provider 结果最终规范化为 RawSignal、TrendObservation 或 AcquisitionCandidate，不得让领域层依赖 Exa/Firecrawl/Crawl4AI/MediaCrawler 等私有字段。

HumanSubmission 也必须通过统一 normalization 进入 RawSignal；不得建立平行的 HumanSignal 事实模型。

## 10. Provenance

每次 acquisition run / ingestion 必须记录：
- `source_origin`；
- `acquisition_origin`；
- provider + implementation version（适用时）；
- method / discovery lane；
- mission/source scope（适用时）；
- source role(s)；
- query/query variant（适用时）；
- rank/cursor（适用时）；
- run id / submission id；
- started/finished/collected_at；
- budget consumption（适用时）；
- result count / failure summary；
- config/policy/normalization version。

对于 HumanSubmission：

```text
source_origin      = 原始第三方来源或 HUMAN_ASSERTION
acquisition_origin = HUMAN_SUBMISSION
```

禁止用 `source=human` 覆盖第三方真实来源。

## 11. Budget / Risk

Provider 调用必须受统一预算和风险策略约束：
- max requests/items/concurrency；
- provider rate limit；
- platform risk guard；
- cancellation/deadline。

禁止为了提高覆盖率实现验证码破解、指纹伪造、自动换号、代理轮换等绕过平台限制的机制。

HumanSubmission 不能绕过同样的 Fetch/Research/Risk Policy。

## 12. Provider 可替换性测试

每个 Provider Adapter 至少通过同一组 contract tests：
- deterministic normalization；
- idempotency/canonical URL；
- unavailable semantics；
- timeout/cancellation；
- provenance completeness；
- no secret leakage。

TrendProvider 额外验证：
- window/observed_at 语义一致；
- unavailable 不伪装成 0；
- provider 内部分数不被上层误当 Editorial Value。

HumanSubmission ingress 单独验证：
- URL 与 text 最小输入；
- source_origin / acquisition_origin 不混淆；
- duplicate submission 可追溯；
- submission 不自动生成 Candidate/Decision；
- 用户直接 assertion 保持 unverified。

## 13. 当前候选不是正式选型

语义 Search 服务、托管 Search+Scrape、自建 Web Fetch/Crawl、RSS/RSSHub、社区/平台 API 或合法数据入口、Trend 数据服务、Legacy MediaCrawler/custom connectors 都可以进入 Spike。最终选型以 `ACQUISITION_PROVIDER_SPIKE.md` 的 Editorial Discovery Yield、Potential/Momentum 覆盖、成本、稳定性和可维护性结果为准。

HumanSubmission 不参加 Provider 胜负比较；它属于 V1 产品能力，并使用 Spike 选定的 Provider 进行 URL fetch / verification / research。
