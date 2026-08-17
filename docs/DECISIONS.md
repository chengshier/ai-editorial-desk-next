# Frozen Decisions

本文件是关键决定索引；详细原因见 `docs/ADR/`。

| ID | 决定 | 状态 |
|---|---|---|
| ADR-0001 | 新建独立仓库，不在 Legacy MVP 原地重构 | Accepted |
| ADR-0002 | DeepSeek Harness = Product Runtime / Workbench Shell，不是业务真相层 | Accepted |
| ADR-0003 | PostgreSQL = System of Record | Accepted |
| ADR-0004 | WeKnora = Knowledge Provider，经 Knowledge Gateway 接入 | Accepted |
| ADR-0005 | Editorial Opportunity = 主要评价/候选单位 | Accepted |
| ADR-0006 | Acquisition Core 采用 Mission-driven / Search-first / Ambient / Targeted Platform Research | Accepted |
| ADR-0007 | Harness 复杂 UI 必须经过 Spike，再决定 Full Workbench 或 Hybrid | Accepted |

## 业务不变量

1. Unknown != Fact。
2. `single_source != confirmed`。
3. `Unavailable != 0`。
4. AI 不得静默确认 Claim。
5. Human Decision append-only，独立于算法排名。
6. Adopt 不等于 Draft，不等于 Publication。
7. Publication 冻结 provenance。
8. Performance snapshot append-only；NULL 不等于 0。
9. Performance 不自动反向改写历史 score/evaluation/decision/evidence。
10. Hook 必须通过事实一致性检查，不允许标题党式事实扭曲。
11. Trend 是 Feature，不是进入 Candidate 的必经 Gate。
12. Acquisition Provider 的 rank/score 不等于 Editorial Value。
13. 固定平台 crawler 是 Provider，不是产品核心发现逻辑。
14. Harness Session / WeKnora 不得成为 canonical business truth。
15. UI 形态可以演化，但 Domain/API 业务语义不得复制或分叉。

## 当前待 Spike 后冻结的决定

- V1 Acquisition Provider 具体组合与 fallback。
- Harness 最终采用 `HARNESS_FULL_WORKBENCH` 还是 `HYBRID_WEB_HARNESS`。

在 Spike 前不得把候选实现或 UI 假设写成已验证事实。