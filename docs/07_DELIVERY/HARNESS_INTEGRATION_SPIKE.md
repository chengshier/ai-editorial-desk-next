# Harness Integration Spike

> 状态：`IMPLEMENTATION_IN_PROGRESS`  
> 分支：`spike/harness-integration`

## 1. 目的

在正式大规模开发 Harness Workbench 之前，用最小代码验证官方扩展点是否足以支撑本项目，而不是先假设“所有 UI 都能无痛做出来”。

本 Spike **不是正式业务开发**：Backend 使用稳定 mock Opportunity / Research Case，不创建 Subject/Discovery/Opportunity 正式表。

## 2. Exact upstream baseline

当前固定：

```text
Repository: deepseek-ai/deepseek-harness
Commit:     99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
Release:    dsh@0.1.0-rc.7
Node:       22.19.0
pnpm:       11.7.0
```

Pin 记录见 `integrations/harness/HARNESS_PIN.json`。

## 3. 必须验证的最小链路

### Spike A — Tool → FastAPI

实现目标：
- out-of-tree package 注册 `list_editorial_opportunities`；
- 注册 `inspect_editorial_opportunity`；
- Tool 调用本项目 FastAPI mock opportunity API；
- 返回 typed canonical JSON；
- 不从渲染文案反解析业务 id；
- request 支持 timeout / cancellation。

当前实现：**CODE_COMPLETE / EXACT-PIN_BUILD_PENDING**。

### Spike B — Opportunity Card

实现目标：
- 后端返回 `OpportunitySummary`；
- Harness Tool 的 presentation/card 显示 Angle、Theme、Audience Promise、Recommendation、Unknown；
- canonical value 与 UI presentation 分离；
- Tool result replay 不依赖实时 Backend I/O。

当前实现：**CODE_COMPLETE / MANUAL_UI_PENDING**。

说明：当前 Spike 先使用 Harness 的 replay-safe generic Tool Card 验证业务信息密度。是否需要独立 Opportunity Card kind 属于后续 UI 能力判断，不在本 Spike 通过修改 upstream core 实现。

### Spike C — Research Job / Conversation Node

实现目标：
- `start_editorial_research` 创建 backend mock Research Case；
- backend `research_case_id` 与 Harness `job_id` 严格分离；
- Harness Job 后台轮询 canonical Research Case；
- Session 写入 replayable `editorial/research-start/progress/end`；
- Conversation Node 从 durable events 重建 start → progress → completed；
- 刷新/重新打开后 replay 一致。

当前实现：**CODE_COMPLETE / EXACT-PIN_BUILD_PENDING / MANUAL_REPLAY_PENDING**。

## 4. 已实现代码边界

```text
Harness Tool
    │
    │ HTTPS/JSON
    ▼
FastAPI spike endpoints
    │
    ├─ /api/v1/spike/opportunities
    ├─ /api/v1/spike/opportunities/{id}
    └─ /api/v1/spike/research-cases/*
```

Research：

```text
start_editorial_research
        ↓
POST backend Research Case
        ↓
research_case_id
        ↓
ctx.jobs.start(editorial-research)
        ↓
poll canonical backend progress
        ↓
append durable Session events
        ↓
Editorial Research Conversation Node
```

业务真相仍位于 Backend；Session event 只保存 replay 所需展示事实，不保存模型隐藏推理。

## 5. 自动化验证 Gate

`.github/workflows/harness-spike.yml` 必须对 exact pin 完成：

1. checkout Next；
2. checkout pinned Harness；
3. 复制 `spike-package` 到临时 Harness workspace；
4. pnpm install；
5. TypeScript project build；
6. host/client bundle；
7. artifact assertion；
8. 启动 FastAPI；
9. 使用 `cordis.patch.yml` 启动 Harness Web overlay；
10. 确认 Backend 与 Harness Web 均成功响应。

只有 exact-head CI success 后，才能把 Compatibility/Boot 项标记 PASS。

## 6. Manual Runtime Gate

自动化无法替代以下真实产品验收。必须在浏览器 + 可用 Harness Model 下实际执行：

### M1 — Agent Tool Selection

输入自然语言“今天有什么值得做”，确认 Agent 正确调用 list Tool。

### M2 — Opportunity Inspect

从 list 结果继续询问某条，确认 stable `opportunity_id` 正确传递，且卡片可读。

### M3 — Research Live Progress

发起研究，确认：
- Research Case 创建；
- Harness Job 创建；
- 两个 id 不混淆；
- Conversation Node 可见；
- progress 逐步更新到 completed。

### M4 — Replay

刷新页面、重新进入 Session，确认 Research Node 的最终状态由 session events 重建，而不是依赖内存中的 live task。

### M5 — Backend Reconstruction

新建另一个 Session 后，再次 list/inspect，确认业务 Opportunity 来自 Backend，不依赖旧 Session 才能存在。

## 7. 第二层 UI 验证

A/B/C 通过后再验证：
- 自定义 Radar/独立业务区域；
- 50~200 条 Opportunity 的列表、筛选、分组；
- Sidebar / Navigation 的产品化扩展；
- 跨 Session 读取业务状态；
- Programming Slate；
- Performance Dashboard 的基本图表/筛选体验。

这部分决定 Harness 是否承担全部复杂产品 UI，不应为了“证明 Harness 可行”而 patch upstream core。

## 8. UI capability matrix（待实测）

| Capability | Code/API | Exact-pin build | Manual UX | 结论 |
|---|---|---|---|---|
| Tool → FastAPI | Implemented | Pending | Pending | Pending |
| Structured canonical output | Implemented | Pending | Pending | Pending |
| Generic Opportunity Tool Card | Implemented | Pending | Pending | Pending |
| Background Research Job | Implemented | Pending | Pending | Pending |
| Durable research events | Implemented | Pending | Pending | Pending |
| Custom Conversation Node | Implemented | Pending | Pending | Pending |
| Refresh/replay | Implemented by event model | Pending | Pending | Pending |
| Radar / large list | Not implemented | N/A | Pending | Pending |
| Programming Slate | Not implemented | N/A | Pending | Pending |
| Performance Dashboard | Not implemented | N/A | Pending | Pending |

## 9. Compatibility risks

当前已知：
- Harness 是 Developer Preview，Tool/Client/Conversation API 可能 breaking；
- out-of-tree client package 需要针对 pinned upstream 构建，不能假设 npm release 永远保持当前 workspace contract；
- client plugin 使用 `dsh.client` manifest 与 Cordis service injection，升级时重点检查 client loading model；
- Conversation Node 依赖 durable Session event schema；事件 contract 应由本项目 compatibility layer 拥有；
- Generic Tool Card 足以验证信息传递，但复杂 Dashboard 能力仍未知。

## 10. 决策输出

Spike 最终必须形成 ADR，二选一：

### `HARNESS_FULL_WORKBENCH`
Harness 的 out-of-tree profile/plugin/client extension 足以承担主要 Radar + Agent + Programming 工作台。

### `HYBRID_WEB_HARNESS`
Harness 保持 Agent/Research/Tool/Approval/Replay 核心工作台；复杂全局业务页面由本项目 Web Shell 承担。

在第二层 UI 验证以前，不允许提前写 Accepted。

## 11. 失败条件

出现以下任一情况不得直接 fork Harness core 继续：
- 关键 UI 只能通过长期维护 upstream core patch 实现；
- 业务状态必须塞进 Harness Session 才能工作；
- 插件需要直接读取 PostgreSQL；
- breaking changes 会直接迫使 Domain/API schema 跟随变化。

应先评估 Hybrid 方案。

## 12. 验收产物

- Spike branch / PR；
- 可运行 demo；
- pinned Harness commit/version；
- exact-pin CI；
- compatibility risk list；
- UI capability matrix；
- Manual Validation Report；
- 最终 ADR。
