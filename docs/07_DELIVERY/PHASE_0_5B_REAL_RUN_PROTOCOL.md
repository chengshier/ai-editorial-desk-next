# Phase 0.5-B Real Provider Run Protocol

## 状态

`D1_HN_REAL_RUN_PASS_WITH_LIMITATIONS / D2_A_KEYED_RUN_NEXT`

D1 no-key live runner 与 Mission SourceRole coverage assessment 已通过 CI #341；真实 HN topstories artifact 已完成审计，详见 `PHASE_0_5B_D1_NO_KEY_RUN_AUDIT.md`。

本协议只用于 Phase 0.5-B Provider Spike 的真实运行。目标是产生可审计 benchmark artifact，不把 Provider 请求成功、Provider score、榜单 rank 或抓取数量伪装成 Editorial Value。

## 1. 运行顺序

```text
D1 No-key live baseline                       COMPLETE / PASS WITH LIMITATIONS
→ Hacker News official ranked snapshot
→ Mission required SourceRole coverage assessment
→ RSS/Atom configured live baseline           NOT_RUN / NON-BLOCKING

D2-A Keyed Search comparison                  NEXT
→ Exa semantic Search
→ Tavily integrated Search+Fetch

D2-B Independent Fetch comparison             DEFERRED UNTIL D2-A
→ only if Exa Search-only seam is worth keeping
→ Exa result URLs → Firecrawl independent Fetch

D3 Curated benchmark evidence
→ cross-Mission dedupe / provenance
→ Opportunity conversion
→ Human Editorial Acceptance
```

## 2. D1 真实运行结论

本次 HN 真实运行：17 个 Mission，7 success，10 explicit unsupported；只有 Ambient Mission 满足 required SourceRole。6 个 Momentum Mission 虽 transport success，但全部缺 `TREND_SIGNAL`；emerging-tech 还缺 `EVIDENCE_SOURCE`。

7 个 success run 产生 70 个 candidate occurrence，但只有 10 个唯一 HN item。因此后续计数必须先做跨 Mission 去重，HN rank 仍只代表 snapshot rank，不代表 velocity。

HN 结论：

```text
可做：Community / Audience / Ambient discovery baseline
不可直接做：semantic Potential search / Trend velocity / Evidence provider
```

## 3. D2-A — Exa vs Tavily

先只申请 / 配置两个 Key：

```powershell
$env:EXA_API_KEY="..."
$env:TAVILY_API_KEY="..."
```

暂时不要申请 Firecrawl Key。D2-A 先验证 Search-only 与 integrated Search+Fetch 谁能在相同 Potential Mission 下提供更好的真实候选与 provenance。

建议先跑单 Mission smoke：

```powershell
.\.venv\Scripts\python.exe -m benchmarks.acquisition.run_keyed_search_fetch `
  --mission potential-common-belief-contradiction `
  --fetch-limit 3 `
  --output .local-benchmark\phase-0.5b-search-fetch-smoke.json
```

当前 runner 在缺 Firecrawl Key 时会把 independent fetch 明确记录为 unavailable / absent，不应影响 Exa 与 Tavily Search 结果本身的审计。若 runner 实际实现因此阻塞 D2-A，则先修改 runner 支持 `--skip-firecrawl` / provider selection，再执行真实调用。

D2-A smoke 通过后，再选择 3–5 个代表性 Mission 扩大真实比较，不直接全跑 17 个 Mission，先控制预算与噪声。

## 4. D2-B — Firecrawl 条件进入

只有当 D2-A 证明 Exa Search-only 有保留价值，才配置：

```powershell
$env:FIRECRAWL_API_KEY="..."
```

再比较：

```text
Exa Search → Firecrawl Fetch
vs
Tavily Search+Fetch
```

这样独立验证 Search 与 Fetch 解耦是否值得额外复杂度和成本。

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
- 如进入 Firecrawl，Search-only+Fetch 与 integrated Search+Fetch 能按相同预算比较；
- 真实结果足够进入 0.5B-E Human Editorial Acceptance。
