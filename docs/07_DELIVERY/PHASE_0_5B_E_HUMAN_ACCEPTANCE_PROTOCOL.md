# Phase 0.5-B E — Human Editorial Acceptance Protocol

## 状态

`IN_PROGRESS`

0.5B-D 已具备真实 Potential / Momentum / Community 输入，可以进入人工编辑验收。此阶段不再比较“谁返回更多”，而是验证真实候选能否产生编辑价值。

## 1. Acceptance 样本

固定抽取 4 个 bucket，每类 5 条：

```text
Momentum     5
Potential    5
Community    5
Control      5
Total       20
```

来源：

```text
Momentum
→ D3 Google Trends real TREND_SIGNAL artifact

Potential
→ D2-B Exa Search real candidates

Community
→ D1 Hacker News community-first / AUDIENCE_SIGNAL candidates

Control
→ D2-B Tavily integrated results 中较低精度/正文缺失等对照样本
```

Control bucket 只是抽样对照，不预先等于 DROP。

## 2. 构建命令

```powershell
cd F:\newWorkSpace\ai-editorial-next\editorial-next

git checkout spike/phase-0.5b-acquisition-providers
git pull --ff-only origin spike/phase-0.5b-acquisition-providers

.\.venv\Scripts\python.exe -m benchmarks.acquisition.build_human_acceptance_packet `
  --d1 .local-benchmark\phase-0.5b-no-key.json `
  --d2b .local-benchmark\phase-0.5b-d2b-firecrawl.json `
  --d3 .local-benchmark\phase-0.5b-d3-google-trends.json `
  --output .local-benchmark\phase-0.5b-e-human-acceptance.json
```

原始 benchmark artifact 与人工填写后的 acceptance artifact 都保持本地，不提交 Git；仓库只提交验收后的统计/审计摘要。

## 3. 每条人工判断字段

每个 sample 的 `human_review` 必须填写：

```text
decision
  DO | MAYBE | DROP

would_read
  true | false

would_make
  true | false

placement
  MAIN | COLUMN | LONG_TERM | RESEARCH_ONLY | NONE

rationale
  必填；说明为什么值得/不值得做

evidence_followup_needed
  true | false
```

解释：

- `would_read`：如果它作为成品出现在信息流里，编辑本人是否愿意点开/看完；
- `would_make`：是否值得投入编辑部资源继续研究和制作；
- `decision`：最终编辑取舍，不由 Provider score / trend / traffic 决定；
- `placement`：如果保留，最适合的编辑位置；
- `evidence_followup_needed`：是否必须先补 Primary/Evidence 才能继续。

## 4. 不允许的捷径

人工验收时不得把以下字段直接当答案：

```text
Google approx_traffic
Google rank
HN score / comments
Exa result rank
Tavily provider score
Firecrawl fetch success
raw content available
```

这些只能作为 provenance / feature。Human Decision 必须基于“是否真的值得看、值得做、可形成 Angle/Audience Promise、证据是否可补”。

## 5. Gate 指标

完成 20 条人工判断后，统计：

- 总体 `DO / MAYBE / DROP`；
- `would_read` 比例；
- `would_make` 比例；
- Potential bucket 的 `DO + MAYBE`；
- Momentum bucket 的 `DO + MAYBE`；
- Community bucket 的 `DO + MAYBE`；
- Control bucket 是否确实表现更弱；
- Provider / acquisition seam 对编辑判断的实际贡献；
- 需要 Evidence follow-up 的比例；
- Community-first 能否追到可验证来源。

`Editorial Discovery Yield` 必须以后续真正进入 Opportunity/Decision 的数量计算，不能用 retrieved_count 替代。

## 6. 0.5B-E 完成条件

至少满足：

```text
20 / 20 samples reviewed
每条 rationale 非空
Potential/Momentum/Community/Control 四类都完成
Do/Maybe/Drop 可追溯到原始 provider + mission + URL
Trend/Audience/Provider score 没有被当作人工决定
Community/非官方来源的 Evidence follow-up 缺口被明确记录
```

完成后输出 `PHASE_0_5B_E_HUMAN_ACCEPTANCE_AUDIT.md`，再进入 0.5B-F Provider Decision + ADR。
