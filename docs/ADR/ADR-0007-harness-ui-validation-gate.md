# ADR-0007 — Harness UI Validation Gate

## Status
Accepted

## Decision
DeepSeek Harness 继续作为 V1 首选 Product Runtime / Agent Workbench，但在完成技术 Spike 前，不承诺所有复杂业务 UI 都必须由 Harness 单独承担。

## Rationale
Harness 已提供 plugin/profile/tool/jobs/session replay/Conversation Node/UI presentation 等扩展能力，但本项目还需要全局 Radar、复杂候选池、长期库、Programming、Performance Dashboard。为了避免为了“统一 UI”而 fork/魔改 upstream core，需要先验证扩展能力和维护成本。

## Gate
必须先完成 `docs/07_DELIVERY/HARNESS_INTEGRATION_SPIKE.md`，再选择：

- `HARNESS_FULL_WORKBENCH`；或
- `HYBRID_WEB_HARNESS`。

## Consequences
- Harness 与 Backend 始终通过稳定 API/Tool Contract 连接。
- UI 形态变化不得复制 Domain Logic。
- Spike 失败时优先评估 Hybrid，而不是直接 patch upstream core。
- 最终选择需要新的 ADR 记录。