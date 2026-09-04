# ADR-0007 — Harness UI Validation Gate

## Status
Accepted

## Decision
DeepSeek Harness 继续作为 V1 首选 Product Runtime / Agent Workbench，但不预先承诺所有复杂业务 UI 都必须由 Harness 单独承担。

Phase 0.5-A 技术 Spike 已证明 Harness 可以作为 V1 **Agent Runtime 技术基线**；Full Harness Workbench 与 Hybrid Web + Harness 的最终选择仍由浏览器/模型 UX Gate 决定。

## Rationale
Harness 提供 plugin/profile/tool/jobs/session replay/Conversation Node/UI presentation 等扩展能力，但本项目还需要全局 Radar、复杂候选池、长期库、Programming、Performance Dashboard。为了避免为了“统一 UI”而 fork/魔改 upstream core，需要把“Runtime 技术可行”与“复杂 Workbench UX 可行”分开验证。

## Technical Spike Result

Pinned baseline：

```text
DeepSeek Harness 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release dsh@0.1.0-rc.7
Node 22.19.0
pnpm 11.7.0
```

PR #2 同步最新 `main` 后 exact head `3681e4e3e5161cf6716eaf9436a1e0161d8d4681`：

```text
Harness Spike run 33725911984 : SUCCESS
Standard CI  run 33725911979 : SUCCESS
```

已实际验证：
- pristine exact-pin full Harness Web build；
- official out-of-tree profile/plugin installation；
- FastAPI + Harness Web concurrent boot；
- Harness `ctx.tools.execute()` → Editorial Tool → FastAPI；
- typed canonical output / presentation separation；
- Tool error propagation；
- 无需 patch/fork upstream core。

因此：

```text
HARNESS_AS_AGENT_RUNTIME = ACCEPTED_AS_V1_TECHNICAL_BASELINE
```

## Remaining UI Gate

PR #2 合并后继续人工验证：
- model-driven Tool selection；
- Opportunity Card 信息密度与交互；
- Research Job live progress；
- Conversation Node refresh/replay；
- error/cancel UX；
- 大规模 Radar / Programming / Performance 的承载能力。

这些人工项目决定：

- `HARNESS_FULL_WORKBENCH`；或
- `HYBRID_WEB_HARNESS`。

它们不再作为 PR #2 技术集成代码的 merge blocker。

## Consequences
- Harness 与 Backend 始终通过稳定 API/Tool Contract 连接。
- UI 形态变化不得复制 Domain Logic。
- Harness Developer Preview 升级必须重跑 exact-pin compatibility CI。
- Spike/UX 失败时优先评估 Hybrid，而不是直接 patch upstream core。
- PR #2 合并代表 Agent Runtime 技术路线成立，不代表 Full Harness Workbench 已验收。
- 最终 Full/Hybrid 选择仍需要新的 ADR 记录。
