# Phase Acceptance Rules

任何 Phase 进入下一阶段前必须满足：

- 对应文档与 Contract 已更新。
- Domain invariants 有自动化测试。
- 数据迁移有 upgrade/downgrade 或明确不可逆说明。
- AI 输出有 schema validation 与 provenance。
- External provider（Harness/WeKnora/LLM/connector）有 timeout/error/unavailable 语义，不以 0 代替失败。
- 没有隐藏引入 Legacy Event-centric 强依赖。
- README/CURRENT_STATE 更新到准确状态。
- exact-head CI 通过后才可收口。

Phase 0 Acceptance：所有 Architecture Baseline 文档完成审阅，ADR Accepted，项目 skeleton 可启动 `/healthz`，且没有业务实现越界。
