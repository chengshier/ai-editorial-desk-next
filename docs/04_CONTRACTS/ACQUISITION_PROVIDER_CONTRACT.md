# Acquisition Provider Contract v1

## 1. 目标

Acquisition Provider 只负责“发现/获取资料”，不负责决定最终编辑价值。Editorial Core 不依赖具体供应商 SDK。

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

## 4. FeedProvider

职责：稳定轮询/订阅低成本更新源。

必须支持：
- stable source scope；
- checkpoint/cursor；
- idempotency；
- published/collected timestamp；
- coverage/failure audit。

## 5. PlatformProvider

职责：面向具体平台的轻量 Watch 或 Targeted Research。

V1 不要求所有 Provider 具有同等能力。能力通过 capability 声明，例如：

```text
search_posts
fetch_post
fetch_comments
watch_account
watch_topic
fetch_metrics
```

缺失能力应返回 `unsupported`，不得由上层猜测。

## 6. Normalization

所有 Provider 结果最终规范化为 RawSignal 或 AcquisitionCandidate，不得让领域层依赖 Exa/Firecrawl/Crawl4AI/MediaCrawler 等私有字段。

## 7. Provenance

每次 acquisition run 必须记录：
- provider + implementation version；
- method；
- mission/source scope；
- query/query variant（适用时）；
- rank/cursor（适用时）；
- started/finished/collected_at；
- budget consumption；
- result count / failure summary；
- config/policy version。

## 8. Budget / Risk

Provider 调用必须受统一预算和风险策略约束：
- max requests/items/concurrency；
- provider rate limit；
- platform risk guard；
- cancellation/deadline。

禁止为了提高覆盖率实现验证码破解、指纹伪造、自动换号、代理轮换等绕过平台限制的机制。

## 9. Provider 可替换性测试

每个 Provider Adapter 至少通过同一组 contract tests：
- deterministic normalization；
- idempotency/canonical URL；
- unavailable semantics；
- timeout/cancellation；
- provenance completeness；
- no secret leakage。

## 10. 当前候选不是正式选型

语义 Search 服务、托管 Search+Scrape、自建 Web Fetch/Crawl、RSS/RSSHub、Legacy MediaCrawler/custom connectors 都可以进入 Spike。最终选型以 `ACQUISITION_PROVIDER_SPIKE.md` 的 Editorial Discovery Yield、成本、稳定性和可维护性结果为准。