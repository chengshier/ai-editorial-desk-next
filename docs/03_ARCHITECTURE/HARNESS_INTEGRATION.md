# DeepSeek Harness Integration

## 官方现状基线（2026-08-17）

DeepSeek Harness 官方仓库说明其为 open-source agent harness，采用“everything is a plugin”的 Cordis 架构；当前处于 **Developer Preview**，官方明确提醒会出现 compatibility-breaking changes。官方 Architecture 文档提供 profile、bundle、tool registry、session log、agent loop、jobs、goals、Conversation Node 与 capability seam 等扩展点。

官方参考：
- https://github.com/deepseek-ai/deepseek-harness
- https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md
- https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md
- https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-conversation-node.md

## 本项目定位

Harness 不是一个“额外聊天框”，也不是 Editorial Intelligence Core。它承担：

- Agent Runtime / Session / Replay。
- Tool / Job / Goal / Approval / Subagent orchestration。
- Opportunity、Research、Evidence、Decision 等 Agent-driven 交互。
- V1 首选 Workbench Shell；复杂全局 Dashboard 是否全部由 Harness 承担，须经过 UI Spike。

## 物理连接方式

Harness 与本项目 Backend 是两个独立运行时：

```text
DeepSeek Harness (TypeScript / Node)
  Web UI / Agent / Session / Jobs
            │
            │ Editorial Tools
            │ HTTPS + JSON (+ SSE/轮询用于长任务)
            ▼
apps/editorial_api (Python / FastAPI)
            │
            ▼
Domain / Application Services
            │
     PostgreSQL / Knowledge Gateway /
     Acquisition Providers / AI Gateway
```

Harness Plugin 不直接访问 PostgreSQL、WeKnora、SQLAlchemy 或 Provider SDK。

详细运行拓扑见 `HARNESS_RUNTIME_TOPOLOGY.md`，API 边界见 `../04_CONTRACTS/HARNESS_API_CONTRACT.md`。

## Harness Plugin

`integrations/harness` 预期提供 out-of-tree profile/plugin：
- Editorial API Client；
- model-facing tools；
- tool cards/presentation；
- research job bridge；
- Conversation Nodes；
- upstream compatibility adapter。

方向示例：
`list_opportunities`、`inspect_opportunity`、`generate_angles`、`start_research`、`evaluate_opportunity`、`compare_candidates`、`build_daily_slate`、`record_editorial_decision`、`create_draft`。

Tool 返回 canonical structured JSON，UI presentation 与业务返回值分离；禁止要求 Agent 从自然语言文案中反解析业务 id。

## 长任务

Research 等任务采用 Backend canonical business id + Harness runtime job：

```text
start_research
→ POST Backend
→ research_case_id
→ Harness Job / Conversation Node 显示进度
→ SSE/轮询读取业务状态
→ completed
```

Harness job/session id 不能代替 backend `research_case_id`。

## Session / Replay 边界

Session log 保存运行轨迹与 replayable UI facts，不保存唯一业务真相。

业务 canonical state 包括 Subject、Discovery、Opportunity、Evaluation、Evidence、Research Case、Decision、Publication、Performance，仍由 PostgreSQL/domain service 管理。

需要在新 Session 展示的业务状态必须能通过 API 重建；需要 replay 的交互进度才进入 Harness durable session event。

## UI Strategy

Harness 必须优先承担 Agent/Tool/Research/Approval/Replay 交互；Today Radar、复杂候选池、长期库、Programming、Performance Dashboard 是否全部采用 Harness extension，需要完成 `HARNESS_INTEGRATION_SPIKE.md`。

允许两种最终结果：
- `HARNESS_FULL_WORKBENCH`
- `HYBRID_WEB_HARNESS`

详见 `HARNESS_UI_STRATEGY.md`。

## 集成规则

1. 优先 out-of-tree plugin/profile/bundle/tool，不 patch upstream core。
2. 固定 upstream commit/version，并保留 compatibility adapter。
3. Harness tool 只调用 Editorial Intelligence API；不得绕过 domain service 直接写数据库。
4. Harness approval 不是服务端权限/风险校验的替代品。
5. Session log 是运行轨迹，不是 Subject/Candidate/Decision 的唯一事实源。
6. Harness breaking change 只能影响 adapter，不得迫使业务表迁移。
7. Spike 未证明能力前，不允许为了复杂 UI 直接 fork/魔改 Harness core。