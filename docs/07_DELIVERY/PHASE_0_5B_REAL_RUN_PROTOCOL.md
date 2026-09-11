# Phase 0.5-B Real Provider Run Protocol

## 状态

`D1_RUNNER_READY / CI PASS / LOCAL REAL RUN PENDING`

D1 no-key live runner 与 Mission SourceRole coverage assessment 已通过 CI #341。当前下一 Gate 是执行一次真实本地 no-key run，生成未经伪造的 live artifact，再进入 D2 keyed Search / Fetch benchmark。

本协议只用于 Phase 0.5-B Provider Spike 的真实运行。目标是产生可审计 benchmark artifact，不把 Provider 请求成功、Provider score、榜单 rank 或抓取数量伪装成 Editorial Value。

## 1. 运行顺序

```text
D1 No-key live baseline
→ RSS / Atom configured feeds
→ Hacker News official ranked snapshot
→ Mission required SourceRole coverage assessment

D2 Keyed Search / Fetch benchmark
→ Exa semantic Search
→ Exa result URLs → Firecrawl independent Fetch
→ Tavily integrated Search+Fetch

D3 Curated benchmark evidence
→ 去重 / provenance 检查
→ Opportunity conversion
→ Human Editorial Acceptance
```

D1 不需要 secret；D2 才需要 Provider API key。

## 2. D1 No-key live baseline

在项目根目录运行：

```powershell
.\.venv\Scripts\python.exe -m benchmarks.acquisition.run_no_key_baselines `
  --hn-list topstories `
  --max-results 10 `
  --output .local-benchmark\phase-0.5b-no-key.json
```

如要加入 RSS/Atom Feed，重复传入：

```powershell
--rss-feed provider-id=https://example.com/feed.xml
```

示例结构：

```powershell
.\.venv\Scripts\python.exe -m benchmarks.acquisition.run_no_key_baselines `
  --rss-feed source-a=https://example.com/feed.xml `
  --rss-feed source-b=https://example.org/atom.xml `
  --hn-list topstories `
  --max-results 10 `
  --output .local-benchmark\phase-0.5b-no-key.json
```

真实 feed URL 必须在执行前确认可访问与使用边界；本协议不把示例 URL 当作正式 Provider 配置。

输出同时保存：

- normalized Provider runs；
- candidate provenance；
- Mission `required_source_roles`；
- observed / missing SourceRole；
- `required_roles_satisfied`；
- HN `rank_only_not_velocity` 语义。

因此 HN 请求可以是 `success`，但 Momentum Mission 如果缺 `TREND_SIGNAL`，assessment 仍必须是未满足。

## 3. D2 Keyed Search / Fetch benchmark

Provider secret 只放在当前 PowerShell 进程环境变量，不写 `.env`、fixture、浏览器状态或 Git：

```powershell
$env:EXA_API_KEY="..."
$env:FIRECRAWL_API_KEY="..."
$env:TAVILY_API_KEY="..."
```

然后执行：

```powershell
.\.venv\Scripts\python.exe -m benchmarks.acquisition.run_keyed_search_fetch `
  --fetch-limit 5 `
  --output .local-benchmark\phase-0.5b-search-fetch.json
```

可以先用单 Mission 控制预算：

```powershell
.\.venv\Scripts\python.exe -m benchmarks.acquisition.run_keyed_search_fetch `
  --mission potential-common-belief-contradiction `
  --fetch-limit 3 `
  --output .local-benchmark\phase-0.5b-search-fetch-smoke.json
```

运行结束后清理当前 shell 的 secret：

```powershell
Remove-Item Env:EXA_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:FIRECRAWL_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:TAVILY_API_KEY -ErrorAction SilentlyContinue
```

## 4. 结果文件边界

`.local-benchmark/` 是本地原始 artifact 位置。原始结果在人工检查前不要直接提交 Git，因为其中可能包含：

- 大量第三方文本；
- Provider-specific metadata；
- 动态 URL；
- 尚未完成人工分类的候选。

正式进入仓库的应是经过审计的 summary / acceptance evidence，而不是未经筛选的整包抓取结果。

## 5. 通过标准

0.5B-D 不能因为“接口都返回 200”就 PASS。至少要满足：

- no-key 和 keyed runner 均能产生结构化 artifact；
- unsupported / unavailable / error 不被改写成空 success；
- Search-only、Fetch-only、Search+Fetch 能按相同 Mission 预算比较；
- SourceRole coverage 与 Provider transport status 分离；
- provenance 可回溯；
- latency / cost 在 Provider 可提供时被记录；
- 真实结果足够进入 0.5B-E 的人工样本抽取。

## 6. 当前人工配合点

D1 runner 已通过 CI。现在只需要执行一次 D1 no-key live baseline，并把 `.local-benchmark\phase-0.5b-no-key.json` 上传用于审计。若 runner 报错，提供终端最后一段即可。

D1 通过后，再决定是否申请/配置 Exa、Firecrawl、Tavily 对应 API key 执行 D2；不要求一次性准备全部 secret。