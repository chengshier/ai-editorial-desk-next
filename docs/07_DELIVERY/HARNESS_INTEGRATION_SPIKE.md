# Harness Integration Spike

> 状态：`AUTOMATED_RUNTIME_PASS / MANUAL_UX_PENDING / LATEST_MAIN_REVALIDATION_PENDING`  
> 分支：`spike/harness-integration`

## 1. 目的

在正式大规模开发 Harness Workbench 之前，用最小真实代码验证官方扩展点是否足以支撑本项目，而不是先假设“所有 UI 都能无痛做出来”。

本 Spike **不是正式业务开发**：Backend 使用稳定 mock Opportunity / Research Case，不创建 Subject/Discovery/Opportunity 正式表。

## 2. Exact upstream baseline

```text
Repository: deepseek-ai/deepseek-harness
Commit:     99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
Release:    dsh@0.1.0-rc.7
Node:       22.19.0
pnpm:       11.7.0
```

Pin 记录见 `integrations/harness/HARNESS_PIN.json`。

## 3. 已验证的最小链路

### Spike A — Tool → FastAPI

实现：
- out-of-tree package 注册 `list_editorial_opportunities`；
- 注册 `inspect_editorial_opportunity`；
- Tool 调用 FastAPI mock Opportunity API；
- typed canonical JSON；
- stable `opportunity_id`；
- request timeout / cancellation；
- missing id 显式 Tool error。

自动化运行时状态：**PASS**。

CI 不只 `curl` 后端，而是在 Harness 已加载 profile/plugin 后通过 pinned Harness 的 `ctx.tools.execute()` 真实执行：

```text
list_editorial_opportunities
→ Harness Tool registry/execution
→ FastAPI
→ Tool render

inspect_editorial_opportunity
→ Harness Tool registry/execution
→ FastAPI
→ Tool render

missing opportunity
→ FastAPI 404
→ Harness Tool isError
```

注意：这证明 Tool runtime 边界，不等于证明模型能从自然语言稳定选择 Tool；后者仍为 Manual Gate。

### Spike B — Opportunity Card

实现：
- Backend 返回 `OpportunitySummary`；
- Tool output schema/render/presentationMeta 分离 canonical value 与 presentation；
- generic Tool Card 包含 Angle、Theme、Audience Promise、Recommendation、Unknown；
- replay 展示不需要从自然语言反解析业务 id。

编译/profile/runtime compatibility：**PASS**。  
真实浏览器卡片可读性/信息密度：**MANUAL_UI_PENDING**。

### Spike C — Research Job / Conversation Node

实现：
- `start_editorial_research` 创建 backend mock Research Case；
- backend `research_case_id` 与 Harness `job_id` 分离；
- Harness Job 后台轮询 canonical Research Case；
- Session 写入 replayable `editorial/research-start/progress/end`；
- Conversation Node 从 durable events fold 研究状态。

exact-pin build/profile activation：**PASS**。  
真实 Agent Session 下的 start/live progress/cancel/replay：**MANUAL_REPLAY_PENDING**。

## 4. 架构边界

```text
Harness Tool / Job / Conversation Node
              │
              │ HTTPS / JSON
              ▼
      FastAPI Editorial API
              │
              └─ Spike mock domain state
```

业务真相仍位于 Backend；Harness Session event 只保存 replay 所需展示事实，不保存模型隐藏推理，也不替代 PostgreSQL canonical truth。

## 5. Exact-pin 自动化 Gate

当前 workflow 的真实顺序为：

```text
Checkout Next
→ Checkout exact pinned Harness
→ Python dev install
→ Ruff
→ Spike API pytest
→ pnpm install --frozen-lockfile on pristine upstream
→ pnpm run build on pristine upstream
→ prepare out-of-tree spike package
→ pnpm install --no-frozen-lockfile
→ Spike TypeScript project build
→ host/client bundle
→ artifact assertions
→ dsh plugin --profile web add spike
→ isolated profile dependency/bundle assertion
→ boot FastAPI
→ boot Harness Web
→ Harness ctx.tools.execute list/inspect/error self-test
→ HTTP readiness smoke
→ upload diagnostics artifact
```

关键发现：完整 `web` profile 不能只依赖局部 `build:lib:host`。产品级 Web smoke 前必须先对 **pristine exact pin** 执行 root `pnpm run build`，随后再准备 out-of-tree package。

## 6. Manual Runtime Gate

以下必须真实浏览器 + 可用 Harness Model 才能验收：

| ID | Scenario | Status |
|---|---|---|
| M1 | 自然语言 → Agent 选择 list Tool | PENDING |
| M2 | follow-up inspect，稳定传递 `opportunity_id` | PENDING |
| M3 | Opportunity Tool Card 真实可读性 | PENDING |
| M4 | start research，创建 backend case + Harness job | PENDING |
| M5 | Research live progress Conversation Node | PENDING |
| M6 | refresh / session replay | PENDING |
| M7 | 新 Session 从 Backend 重建 Opportunity | PENDING |
| M8 | API unavailable/error，不伪装为空结果 | PENDING |
| M9 | cancel research job + terminal event | PENDING |

其中 list/inspect/error 的 **Harness Tool execution 本身已自动化 PASS**；M1/M2 仍验证模型选择与对话上下文行为。

## 7. 第二层 UI 验证

A/B/C 核心链路人工通过后，再判断是否需要验证：
- 50~200 Opportunity Radar；
- 列表/筛选/分组；
- Sidebar / Navigation 产品化扩展；
- Programming Slate；
- Performance Dashboard。

不允许为了证明 Full Harness 可行而 patch upstream core。

## 8. 当前 Capability Matrix

| Capability | Code/API | Exact-pin/Runtime | Manual UX | 结论 |
|---|---|---|---|---|
| Tool registration/profile activation | Implemented | PASS | N/A | PASS |
| Tool → FastAPI list/inspect | Implemented | PASS (`ctx.tools.execute`) | Model pending | Runtime PASS |
| Tool error propagation | Implemented | PASS | Browser pending | Runtime PASS |
| Structured canonical output | Implemented | PASS | N/A | PASS |
| Generic Opportunity Tool Card | Implemented | PASS | Pending | Pending |
| Background Research Job | Implemented | Build PASS | Pending | Pending |
| Durable research events | Implemented | Build PASS | Pending | Pending |
| Custom Conversation Node | Implemented | Build PASS | Pending | Pending |
| Refresh/replay | Event model implemented | Build PASS | Pending | Pending |
| Radar / large list | Not implemented | N/A | Pending | Pending |
| Programming Slate | Not implemented | N/A | Pending | Pending |
| Performance Dashboard | Not implemented | N/A | Pending | Pending |

## 9. Compatibility risks

- Harness 是 Developer Preview，Tool/Jobs/Client/Conversation contracts 可能 breaking；
- out-of-tree client package 需要针对 pinned upstream 构建；升级 Harness 必须重跑 compatibility CI；
-完整 Web runtime smoke 依赖 pristine pinned upstream full root build；
- profile loader 的 out-of-tree dependency 解析依赖官方 profile/plugin seam；
- Compatibility 变化必须收敛在 `integrations/harness`，不能向 Domain/API schema 泄漏；
- Generic Tool Card 是否足够支撑最终信息密度仍需 UX 实测；
- Radar/Programming/Performance 是否适合完全放在 Harness 内仍无证据。

## 10. 决策状态

```text
HARNESS_AS_AGENT_RUNTIME: TECHNICALLY_VALIDATED
HARNESS_FULL_WORKBENCH:   NOT_DECIDED
HYBRID_WEB_HARNESS:       NOT_DECIDED
```

当前不再需要回答“Harness 能不能跑/能不能调用我们的 Tool”；下一 Gate 是真实 Agent/Card/Research/Replay UX，并据此决定 Full Harness Workbench 或 Hybrid。
