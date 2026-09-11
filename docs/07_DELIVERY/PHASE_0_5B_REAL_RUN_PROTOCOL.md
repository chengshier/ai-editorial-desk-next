# Phase 0.5-B Real Provider Run Protocol

## 状态

`D1_HN_REAL_RUN_PASS_WITH_LIMITATIONS / D2_COMPLETE_WITH_LIMITATIONS / D3_COMPLETE_WITH_LIMITATIONS / E_HUMAN_ACCEPTANCE_IN_PROGRESS`

D1 no-key live runner 与 Mission SourceRole coverage assessment 已通过 CI #341；真实 HN topstories artifact 已完成审计，详见 `PHASE_0_5B_D1_NO_KEY_RUN_AUDIT.md`。

D2 已完成：

- D2-A Exa vs Tavily single-Mission smoke；
- D2-A 4 Mission bounded comparison；
- D2-B Exa → Firecrawl vs Tavily real comparison。

D3 Google Trends no-key Momentum baseline 也已完成真实运行。

审计见：

- `PHASE_0_5B_D2A_KEYED_SMOKE_AUDIT.md`
- `PHASE_0_5B_D2A_BOUNDED_RUN_AUDIT.md`
- `PHASE_0_5B_D2B_FIRECRAWL_RUN_AUDIT.md`
- `PHASE_0_5B_D3_GOOGLE_TRENDS_RUN_AUDIT.md`

本协议只用于 Phase 0.5-B Provider Spike 的真实运行。目标是产生可审计 benchmark artifact，不把 Provider 请求成功、Provider score、榜单 rank、raw content、trend volume 或抓取数量伪装成 Editorial Value / Evidence。

## 1. 运行顺序

```text
D1 No-key live baseline                       COMPLETE / PASS WITH LIMITATIONS
→ Hacker News official ranked snapshot
→ Mission required SourceRole coverage assessment
→ RSS/Atom configured live baseline           NOT_RUN / NON-BLOCKING

D2-A Keyed Search comparison                  COMPLETE / PASS WITH LIMITATIONS
→ Exa semantic Search
→ Tavily integrated Search+Fetch
→ multi-query provenance + bounded Search budget

D2-B Independent Fetch comparison             COMPLETE / PASS WITH LIMITATIONS
→ Exa result URLs → Firecrawl independent Fetch
→ compare against Tavily integrated Search+Fetch

D3 Momentum baseline                          COMPLETE / PASS WITH LIMITATIONS
→ Google Trends public RSS / Trending Now surface
→ generic search-attention TREND_SIGNAL
→ unsupported mission shapes remain explicit

0.5B-E Curated Human Editorial Acceptance     IN_PROGRESS
→ Potential + Momentum + Community + Control
→ human Do / Maybe / Drop + rationale
```

## 2. D1 真实运行结论

本次 HN 真实运行：17 个 Mission，7 success，10 explicit unsupported；只有 Ambient Mission 满足 required SourceRole。6 个 Momentum Mission 虽 transport success，但全部缺 `TREND_SIGNAL`；emerging-tech 还缺 `EVIDENCE_SOURCE`。

7 个 success run 产生 70 个 candidate occurrence，但只有 10 个唯一 HN item。因此后续计数必须先做跨 Mission 去重，HN rank 仍只代表 snapshot rank，不代表 velocity。

HN 结论：

```text
可做：Community / Audience / Ambient discovery baseline
不可直接做：semantic Potential search / Trend velocity / Evidence provider
```

## 3. D2-A — Exa vs Tavily 结论

D2-A bounded run 使用 4 个 Potential Mission、每 Mission `max_results=3`、每 Mission 两个 query seeds。

观察：

```text
Exa
4 / 4 success
12 / 12 retrieved
avg latency ~2889 ms
observed cost $0.056
search-only

Tavily
4 / 4 success
12 / 12 retrieved
9 / 12 raw content available
avg latency ~5287 ms
16 credits
integrated search+fetch
```

Editorial observation：Exa 在 everyday-why、protective-scam、open-curiosity 三类 bounded Mission 上给出更具体、更适合后续 Research 的候选；Tavily 的 integrated content 能减少独立 Fetch 步骤，但 discovery surface 更杂，且 raw content availability 不等于 fetch correctness / Evidence。

因此 D2-A 已满足“Exa Search-only seam 值得保留”的进入条件。

## 4. D2-B — Firecrawl Independent Fetch 结论

真实 D2-B bounded artifact：

```text
Exa Search
4 / 4 success
12 / 12 retrieved
avg latency ~3642 ms
observed cost $0.056

Firecrawl
4 probes
3 success + 1 partial
12 requested
10 fetched
2 failed
avg probe latency ~10028 ms
usage/cost unavailable in artifact

Tavily
4 / 4 success
12 / 12 retrieved
8 / 12 raw content available
avg latency ~2321 ms
16 credits
```

结论：`Exa Search → Firecrawl Fetch` 真实链路可用并保留 Exa 较好的 discovery precision，但 latency/复杂度高于 Tavily；Tavily integrated seam 继续保留 comparator/fallback。最终 Provider winner 仍不得提前决定。

D2-B 只验证 Fetch seam 与组合成本/复杂度，不把 Firecrawl 成功正文自动升级成 `EVIDENCE_SOURCE` / `PRIMARY_SOURCE`。

Firecrawl adapter 后续运行已增加 non-secret per-URL failure provenance，避免只记录 failure count 而无法解释失败 URL。

## 5. D3 — Google Trends Momentum baseline 结论

真实 D3 artifact：

```text
provider                   google-trends-rss-us
geo                        US
momentum missions          6
transport success          1
explicit unsupported       5
retrieved                  10
required SourceRole PASS   1 / 6
```

`momentum-search-attention-surge` 满足 `TREND_SIGNAL + DISCOVERY_SIGNAL`。其他 5 类 Momentum Mission 保持 `UNSUPPORTED`，因为单一 RSS snapshot 无法证明 community acceleration、cross-platform spread、culture-only breakout、resurfacing history 或 emerging-tech Evidence coverage。

D3 还证明 trend surface 本身存在噪声：`geo=US` 的 snapshot 仍可出现语言/地域不一致候选；高 traffic 也不意味着编辑部应该做。因此 Google Trends 只作为 attention feature 输入，不能替代 Human Decision。

Provenance hardening：Google Trends RSS `pubDate` 代表 trend observation/feed time，不是 linked source publication time。adapter 已将其改记为 `provider_metadata.trend_observed_at`，不再写入 `AcquisitionCandidate.published_at`。

至此 0.5B-D 通过标准满足：

- Potential Search/Fetch 真实比较；
- independent Fetch vs integrated Search+Fetch 真实比较；
- Community/Ambient baseline 真实运行；
- 至少一个真正 `TREND_SIGNAL` baseline 真实运行；
- unsupported/unavailable 与 success 分离；
- provenance / SourceRole 语义可审计。

因此：

```text
0.5B-D = COMPLETE / PASS WITH LIMITATIONS
```

## 6. 0.5B-E Human Editorial Acceptance

当前从三份本地 artifact 构建 20 条平衡 acceptance packet：

```text
D1  .local-benchmark\phase-0.5b-no-key.json
D2B .local-benchmark\phase-0.5b-d2b-firecrawl.json
D3  .local-benchmark\phase-0.5b-d3-google-trends.json
```

构建命令：

```powershell
.\.venv\Scripts\python.exe -m benchmarks.acquisition.build_human_acceptance_packet `
  --d1 .local-benchmark\phase-0.5b-no-key.json `
  --d2b .local-benchmark\phase-0.5b-d2b-firecrawl.json `
  --d3 .local-benchmark\phase-0.5b-d3-google-trends.json `
  --output .local-benchmark\phase-0.5b-e-human-acceptance.json
```

固定 bucket：

```text
Momentum   5
Potential  5
Community  5
Control    5
```

每条 `human_review` 必须填写：

```text
decision: DO | MAYBE | DROP
would_read: true | false
would_make: true | false
placement: MAIN | COLUMN | LONG_TERM | RESEARCH_ONLY | NONE
rationale: 非空
evidence_followup_needed: true | false
```

完整规则见 `PHASE_0_5B_E_HUMAN_ACCEPTANCE_PROTOCOL.md`。

## 7. Secret 与结果边界

Provider secret 只放当前 PowerShell 进程环境变量，不写 `.env`、fixture、浏览器状态或 Git。D3 与 E packet 构建本身不需要 key。

`.local-benchmark/` 保存本地原始 artifact 与人工 acceptance artifact；原始第三方文本、动态 URL 与 provider metadata 不直接提交 Git。仓库只保留经过审计的 summary / acceptance evidence。

## 8. 下一 Gate

0.5B-E 20 条全部人工标注完成后：

```text
→ 生成 Human Acceptance audit
→ 计算 Potential / Momentum / Community 的真实编辑接受结果
→ 再进入 0.5B-F Provider Decision + ADR
```

在 Human Acceptance 完成前，不形成最终 V1 Provider 组合。
