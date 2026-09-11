# Phase 0.5-B Real Provider Run Protocol

## 状态

`D1_HN_REAL_RUN_PASS_WITH_LIMITATIONS / D2_A_BOUNDED_COMPLETE / D2_B_FIRECRAWL_NEXT`

D1 no-key live runner 与 Mission SourceRole coverage assessment 已通过 CI #341；真实 HN topstories artifact 已完成审计，详见 `PHASE_0_5B_D1_NO_KEY_RUN_AUDIT.md`。

D2-A 已完成单 Mission keyed smoke 与 4 Mission bounded comparison，审计见：

- `PHASE_0_5B_D2A_KEYED_SMOKE_AUDIT.md`
- `PHASE_0_5B_D2A_BOUNDED_RUN_AUDIT.md`

本协议只用于 Phase 0.5-B Provider Spike 的真实运行。目标是产生可审计 benchmark artifact，不把 Provider 请求成功、Provider score、榜单 rank、raw content 或抓取数量伪装成 Editorial Value / Evidence。

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

D2-B Independent Fetch comparison             NEXT
→ Exa result URLs → Firecrawl independent Fetch
→ compare against Tavily integrated Search+Fetch

D3 / 0.5B-E Curated Human Editorial Acceptance
→ cross-Mission dedupe / provenance
→ Opportunity conversion candidates
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

因此 D2-A 已满足“Exa Search-only seam 值得保留”的进入条件，D2-B 不再 deferred。

## 4. D2-B — Firecrawl Independent Fetch

下一步配置：

```powershell
$env:EXA_API_KEY="..."
$env:TAVILY_API_KEY="..."
$env:FIRECRAWL_API_KEY="..."
```

继续使用同一 bounded Mission set：

```powershell
.\.venv\Scripts\python.exe -m benchmarks.acquisition.run_keyed_search_fetch `
  --mission potential-common-belief-contradiction `
  --mission potential-everyday-why `
  --mission potential-protective-scam `
  --mission potential-open-curiosity `
  --max-results 3 `
  --fetch-limit 3 `
  --output .local-benchmark\phase-0.5b-d2b-firecrawl.json
```

比较维度：

```text
Exa Search quality
+ Firecrawl fetched_count / failure_count / latency / content usability
vs
Tavily integrated retrieved/fetched/latency/credit/content usability
```

注意：D2-B 只验证 Fetch seam 与组合成本/复杂度，不把 Firecrawl 成功正文自动升级成 `EVIDENCE_SOURCE` / `PRIMARY_SOURCE`。

## 5. Secret 与结果边界

Provider secret 只放当前 PowerShell 进程环境变量，不写 `.env`、fixture、浏览器状态或 Git。运行结束后：

```powershell
Remove-Item Env:EXA_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:FIRECRAWL_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:TAVILY_API_KEY -ErrorAction SilentlyContinue
```

`.local-benchmark/` 保存本地原始 artifact；原始第三方文本、动态 URL 与 provider metadata 不直接提交 Git。仓库只保留经过审计的 summary / acceptance evidence。

## 6. 0.5B-D 通过标准

不能因为接口返回 200 就 PASS。至少要满足：

- real artifact 可重复产生；
- unsupported / unavailable / error 不伪装成空 success；
- SourceRole coverage 与 transport status 分离；
- provenance 可回溯；
- cross-Mission duplicate 不被重复当成独立 Discovery；
- Exa / Tavily 能按相同 Mission / result budget 比较；
- Search-only+Fetch 与 integrated Search+Fetch 能按相同 bounded Mission set 比较；
- 真实结果足够进入 0.5B-E Human Editorial Acceptance。
