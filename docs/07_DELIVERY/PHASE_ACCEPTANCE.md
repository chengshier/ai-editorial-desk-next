# Phase Acceptance Rules

任何 Phase 进入下一阶段前必须满足：

- 对应 Product/Domain/Architecture/Contract 文档已更新。
- Domain invariants 有自动化测试。
- 数据迁移有 upgrade/downgrade 或明确不可逆说明。
- AI 输出有 schema validation 与 provenance。
- External provider（Harness/WeKnora/LLM/acquisition）有 timeout/error/unavailable 语义，不以 0 代替失败。
- 没有隐藏引入 Legacy Event-centric / Platform-first 强依赖。
- README/CURRENT_STATE 更新到准确状态。
- exact-head CI 通过后才可收口。
- 未验证能力必须明确写 `NOT_TESTED / DEFERRED / HYPOTHESIS`，不得包装成 PASS。

## Phase 0 Acceptance — Architecture + Functional Baseline

必须满足：
- Product Vision / Functional Spec / User Journeys / Workbench UX 完成审阅。
- Domain / Editorial Value / State / Provenance contracts 完成。
- Harness Runtime / API / UI Strategy 完成。
- Acquisition Architecture / Provider Contract 完成。
- WeKnora/Knowledge boundary 与 Legacy reuse map 完成。
- ADR Accepted，AGENTS 执行规则可用。
- 项目 skeleton 可启动 `/healthz`。
- CI 通过。
- 没有提前固化完整业务表、Provider 供应商或 Harness UI 实现。

## Phase 0.5-A Acceptance — Harness Integration Spike

必须提供：
- Tool → FastAPI 可运行验证；
- Opportunity structured card；
- Research Job/Conversation Node replay 验证；
- 复杂 UI capability matrix；
- pinned Harness upstream ref；
- compatibility risks；
- 最终 ADR：`HARNESS_FULL_WORKBENCH` 或 `HYBRID_WEB_HARNESS`。

## Phase 0.5-B Acceptance — Acquisition Provider Spike

必须提供：
- 统一 Discovery Mission 数据集；
- Legacy Platform-first baseline；
- Search-first / Search+Fetch / Feed-Ambient 候选对比；
- Editorial Discovery Yield、来源质量、成本、延迟、稳定性结果；
- V1 Provider 组合与 fallback；
- Legacy MediaCrawler 最终保留范围；
- Provider 选型 ADR。

## Phase 1+ 通用要求

进入持久化和业务实现后，任何新 canonical entity 都必须具备：schema、repository port、provenance、versioning、contract tests 与明确生命周期，不得只依据当前 UI 需要临时加字段。