# Harness Runtime Topology v1

## 1. 两个独立运行时

AI Editorial Desk Next 与 DeepSeek Harness 不合并为一个进程。

```text
DeepSeek Harness
TypeScript / Node
Web UI + Agent Runtime + Session + Jobs + Tools
        │
        │ HTTPS / JSON
        ▼
AI Editorial Desk Next
Python / FastAPI
Editorial Intelligence API
        │
        ├─ PostgreSQL
        ├─ Knowledge Gateway → WeKnora
        ├─ Acquisition Providers
        └─ AI Gateway / Providers
```

Harness 不 import Python 包；Python 后端也不依赖 Harness 内部包。

## 2. Harness 侧组成

`integrations/harness` 计划承载：
- editorial profile / bundle configuration；
- model-facing Editorial Tools；
- API Client / auth / compatibility adapter；
- Conversation Nodes / Tool Card presentation；
- Research Job bridge；
- 必要的 session event types。

业务规则不得复制到插件中。插件负责“把 Harness 能力映射到 Backend Use Case”。

## 3. Backend 侧组成

`apps/editorial_api` 是稳定边界：
- 对 Harness 暴露 use-case oriented API；
- 做身份、权限、幂等、输入校验；
- 调用 Domain/Application Service；
- 返回结构化业务结果；
- 不把 ORM model 直接作为公开协议。

## 4. 短任务

```text
Agent
→ Harness Tool
→ HTTP API
→ Domain Service
→ JSON result
→ Tool canonical value
→ Card / Agent context
```

典型：list opportunities、inspect、compare、record decision。

## 5. 长任务

Research、批量发现、深度资料补全等采用异步任务：

```text
Harness Tool
→ POST /research-cases
→ 返回 research_case_id + task handle
→ Harness Job / UI Progress
→ GET/SSE task progress
→ completed result
```

长任务必须有稳定业务 id；Harness job id 只代表 Harness runtime task，不代替 backend research_case_id。

## 6. Session 与业务真相

Harness Session Event 用于：
- replayable interaction；
- tool call/result；
- research progress presentation；
- approval/action interaction。

PostgreSQL 用于：
- Subject / Discovery / Opportunity；
- Evaluation / Evidence / Decision；
- Research Case canonical state；
- Publication / Performance。

打开新 Harness Session 时，业务页面/卡片可通过 API 重建，不能假设旧 Session 是唯一数据来源。

## 7. 兼容隔离

Harness 当前为 Developer Preview，因此：
- pin upstream version/commit；
- `integrations/harness` 维护 compatibility layer；
- Domain API contract 不跟随 Harness 内部事件/类型变化；
- Harness breaking change 不应触发 PostgreSQL schema migration。

## 8. 部署形态

开发期可分别启动：
- Editorial API：如 `127.0.0.1:8000`；
- Harness Web：如 Harness 默认 Web 端口；
- PostgreSQL / WeKnora / Provider services 独立。

生产部署可以通过同域反向代理统一体验，但逻辑边界保持独立。