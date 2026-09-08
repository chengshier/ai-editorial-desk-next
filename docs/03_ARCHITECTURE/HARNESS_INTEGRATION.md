# DeepSeek Harness Integration

## 官方 / pin 基线

DeepSeek Harness 当前作为本项目 V1 Agent Runtime exact-pin：

```text
DeepSeek Harness 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release dsh@0.1.0-rc.7
Node 22.19.0
pnpm 11.7.0
```

Harness 仍处于 Developer Preview，因此 compatibility-breaking changes 必须被 `integrations/harness` 隔离。

## 本项目最终定位

Harness 不是一个“额外聊天框”，也不是 Editorial Intelligence Core。

PR #5–#9 已完成 UI Gate，最终架构为：

```text
HYBRID_WEB_HARNESS
```

Harness 承担：

- Agent Runtime / Session / Replay；
- Tool / Job / Approval orchestration；
- Opportunity / Research / Evidence 等结构化 Agent 交互；
- Research Workspace；
- Agent-heavy workbench surface。

Web Shell 承担：

- Global IA / Router；
- Today / Opportunities；
- Programming / Creation / Publication；
- Performance / Knowledge / Management；
- Global Inspector / Search / Human Submission；
- Harness launch / return orchestration。

Editorial API / PostgreSQL 继续承担全部 canonical business truth。

## 物理连接方式

三个逻辑运行时保持分离：

```text
AI Editorial Desk Web Shell
            │
            │ HTTPS / JSON
            ▼
apps/editorial_api (Python / FastAPI)
            ▲
            │ Editorial Tools / HTTPS + JSON
            │ (+ SSE/轮询用于长任务)
DeepSeek Harness (TypeScript / Node)
Web UI / Agent / Session / Jobs
```

Web Shell 不 import Harness 内部 TypeScript 包；Harness Plugin 不直接访问 PostgreSQL、WeKnora、SQLAlchemy 或 Provider SDK。

详细运行拓扑见 `HARNESS_RUNTIME_TOPOLOGY.md`，API 边界见 `../04_CONTRACTS/HARNESS_API_CONTRACT.md`，Shell ↔ Harness 边界见 `../04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`。

## Harness Plugin

`integrations/harness` 提供 out-of-tree profile/plugin：

- Editorial API Client；
- model-facing tools；
- tool cards/presentation；
- research job bridge；
- Research Workspace；
- legacy compatibility / session repair；
- upstream compatibility adapter；
- 后续 Hybrid launch adapter。

业务规则不得复制到插件中。插件负责“把 Harness 能力映射到 Backend Use Case”。

Tool 返回 canonical structured JSON，UI presentation 与业务返回值分离；禁止要求 Agent 从自然语言文案中反解析业务 id。

## 长任务

Research 等任务采用 Backend canonical business id + Harness runtime job：

```text
start_research
→ POST Backend
→ research_case_id
→ Harness Job / UI Progress
→ SSE/轮询读取业务状态
→ completed result
```

Harness job/session id 不能代替 backend `research_case_id`。

## Session / Replay 边界

Session log 保存运行轨迹与 replayable interaction，不保存唯一业务真相。

业务 canonical state 包括 Subject、Discovery、Opportunity、Evaluation、Evidence、Research Case、Decision、Programming、Draft、Publication、Performance，仍由 PostgreSQL/domain service 管理。

已验证：标准 Tool Result / presentation metadata 可以支持 Research Workspace refresh / cold restart replay。

但即使旧 Session 丢失，Research Case 仍必须能通过 API 重建；新 Session 可以重新 hydrate 当前业务上下文。

## Hybrid navigation

产品 canonical route 由 Web Shell 持有，例如：

```text
/today
/opportunities
/research/:research_case_id
/programming
```

Shell 不得：

- 拼接 Harness 未承诺的私有内部 route；
- 调用 Harness private store action；
- 使用 DOM click hack；
- 用 `harness_session_id` 取代业务 ID。

Shell → Harness 和 Harness → Shell 必须经过稳定 launch / return contract。

详见 `../04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`。

## UI Strategy 结论

Harness UI Spike 已验证：

### PASS

- Agent Tool selection / stable ID；
- custom Editorial ToolViews；
- Background Research Job / Result；
- durable replay / cold restart；
- Session-scoped complex Research Workspace；
- Agent Conversation coexistence。

### Architecture boundary

- root shell 的 `sidebar / conversation / details` 为 replacement seat；
- additive `conversation.view` 是 Session scoped；
- Programming / Today / Publishing / Performance 是跨 Session 的全局业务模块；
- exact-pin 缺少适合整个产品 Primary Navigation / Router 的 additive seam。

因此：

```text
HARNESS_FULL_WORKBENCH = REJECTED_FOR_V1
HYBRID_WEB_HARNESS = ACCEPTED
```

详见 `HARNESS_UI_STRATEGY.md` 与 ADR-0009。

## 集成规则

1. 优先 out-of-tree plugin/profile/bundle/tool，不 patch upstream core。
2. 固定 upstream commit/version，并保留 compatibility adapter。
3. Harness tool 只调用 Editorial Intelligence API；不得绕过 domain service 直接写数据库。
4. Harness approval 不是服务端权限/风险校验的替代品。
5. Session log 是运行轨迹，不是 Subject/Candidate/Decision 的唯一事实源。
6. Harness breaking change 只能影响 adapter，不得迫使业务表或产品 route 迁移。
7. Web Shell 与 Harness 禁止复制同一套 Domain Logic。
8. 后续 Harness Spike 只用于 compatibility / transport 等明确集成问题，不再为了 Full Workbench 无限扩展。
