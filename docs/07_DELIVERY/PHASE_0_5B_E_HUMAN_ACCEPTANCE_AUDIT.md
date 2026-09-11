# Phase 0.5-B E — Human Editorial Acceptance Audit

## 状态

`IN_PROGRESS / ROUND_1_CONTEXT_BLOCKED`

本文件记录 Phase 0.5-B-E 的真实人工编辑反馈。只有 `context_sufficient=true` 的判断才进入最终 20/20 Gate；上下文不足的暂定反馈用于改进 acceptance packet，不计入最终 Editorial Discovery Yield。

## 1. 第一轮 Momentum 暂定反馈

首轮向人工编辑展示了 5 条 Google Trends Momentum 样本，但展示层基本只有标题与简单趋势信号，没有提供足够的事实摘要、相关报道脉络或正文上下文。

人工反馈如下：

| Sample | 候选 | 暂定判断 | 会点开 | 编辑投入 | 位置 | 补证 | 上下文充分 | 理由 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| momentum-01 | Aster / 秋季花卉替代常见菊花 | 观察 | 会 | 有条件 | 栏目 | 需要 | 否 | 只有简单标题，什么都看不出来 |
| momentum-02 | Downdetector / Fidium Fiber 网络故障 | 观察 | 不会 | 有条件 | 栏目 | 需要 | 否 | 只有简单标题，什么都看不出来 |
| momentum-03 | Covid / 流感 / RSV 疫苗指南 | 观察 | 会 | 有条件 | 栏目 | 需要 | 否 | 只有简单标题，什么都看不出来 |
| momentum-04 | Maryland 2026–2027 疫苗指南 | 观察 | 不会 | 有条件 | 栏目 | 需要 | 否 | 只有简单标题，什么都看不出来 |
| momentum-05 | Josh Hartnett / Netflix《Below》预告 | 观察 | 会 | 有条件 | 栏目 | 需要 | 否 | 只有简单标题，什么都看不出来 |

这些反馈保留为 **provisional / context blocked**，不映射成最终 `MAYBE` 统计，也不据此评价 Google Trends 的 Editorial Discovery Yield。

## 2. 暴露的问题

首轮实际证明：

```text
Candidate title + trend traffic/rank
!= enough editorial review context
```

人工编辑无法仅凭标题判断：

- 事件/发现究竟发生了什么；
- 哪个事实或反常点构成 Angle；
- 是否已经有可靠来源；
- 是短热点、解释型内容还是长期题；
- 是否只是标题看起来有趣但正文空洞。

因此这不是“5 条 Momentum 都只能 MAYBE”，而是 acceptance presentation 本身不合格。

## 3. 已采取的工程修复

acceptance packet 升级为 schema v2：

- 每条 sample 增加 `review_context`；
- Momentum 优先带 related news 标题 / 来源；
- Potential 优先把 Exa candidate 与 Firecrawl fetched description / content excerpt 合并；
- Control 优先带 Tavily integrated content excerpt；
- Community 若仍只有标题/信号，必须允许 `context_sufficient=false`；
- `human_review` 新增 `context_sufficient`；
- `context_sufficient=false` 不计入最终 20/20 Gate。

## 4. 下一步

重新构建 schema v2 acceptance packet，并从 Potential bucket 开始使用“标题 + 摘要/正文上下文 + 来源”呈现给人工编辑。完成剩余 bucket 后，再回到 Momentum 5 条补上下文重新确认，使全部 20 条达到 `context_sufficient=true`。
