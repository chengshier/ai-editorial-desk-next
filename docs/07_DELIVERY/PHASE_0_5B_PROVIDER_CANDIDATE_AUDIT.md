# Phase 0.5-B Search / Fetch Candidate Audit

审计日期：2026-09-11

本文件只冻结进入真实 benchmark 前的 API seam，不形成 Provider 胜负结论。价格、配额、访问条件和响应字段均可能变化；0.5B-D 真实 run 前必须再次核对官方资料。

## 1. Semantic Search candidate — Exa Search

官方 Search endpoint：

```text
POST https://api.exa.ai/search
x-api-key: <server-side key>
```

当前 Spike adapter：

```text
packages/acquisition/providers/exa.py
provider_id = exa-search
capability = SEARCH
```

机械验证范围：

- mission query → Search request；
- `numResults` 对齐 mission budget；
- `startPublishedDate` 映射 recency window；
- title/url/publishedDate/id 规范化；
- `costDollars.total` 若返回则记录为 observed cost；
- Search result 默认只标 `DISCOVERY_SIGNAL`，不会因为 provider 排名自动升级为 Evidence；
- API key 缺失时显式 `UNAVAILABLE`，不会访问网络或泄漏 secret。

## 2. Independent Fetch candidate — Firecrawl Scrape

官方 Scrape endpoint：

```text
POST https://api.firecrawl.dev/v2/scrape
Authorization: Bearer <server-side key>
```

当前 Spike adapter：

```text
packages/acquisition/providers/firecrawl.py
provider_id = firecrawl-fetch
capability = FETCH
```

机械验证范围：

- 已知 URL → markdown main-content extraction；
- per-URL success/failure 显式统计；
- canonical/source URL 与 metadata 规范化；
- 抓取成功不等于事实已确认，默认仍只标 `DISCOVERY_SIGNAL`；
- API key 缺失时显式 `UNAVAILABLE`。

## 3. Integrated Search+Fetch candidate — Tavily Search

官方 Search endpoint：

```text
POST https://api.tavily.com/search
Authorization: Bearer <server-side key>
```

当前 Spike adapter：

```text
packages/acquisition/providers/tavily.py
provider_id = tavily-search-fetch
capabilities = SEARCH + FETCH
```

Spike 使用 `include_raw_content=markdown` 比较“一次调用同时得到 ranked source + extracted content”的能力，并记录 provider relevance score、credit usage 与 raw-content availability。

关键边界：

- provider `score` 仅保留为 relevance feature，不映射为 Editorial Value；
- raw content available 不自动升级 SourceRole；
- momentum mission 可以请求 news/topic + recency window，但这不是 Trend velocity；
- API key 缺失时显式 `UNAVAILABLE`。

## 4. 为什么当前同时保留三个候选

0.5B-C 需要比较三种 seam，而不是预先押注某个厂商：

```text
semantic Search only
independent Fetch
integrated Search + Fetch
```

真实胜负必须由 0.5B-D/E 的相同 Mission、相同预算与人工 Editorial Acceptance 决定。机械单元测试只证明 contract/normalization/secret boundary，不代表质量胜出。

## 5. 真实 benchmark 前的 Gate

进入 0.5B-D 前必须满足：

1. exact-head CI 全绿；
2. 三类 adapter mock contract tests 全绿；
3. server-side key 注入路径明确；
4. benchmark runner 不写入 secret；
5. provider price/access/rate-limit 再次核对；
6. 用户只在真实 run 即将开始时提供必要 key；
7. 真实结果必须保留 `unsupported / unavailable / partial`，不得为了生成排名而补零。
