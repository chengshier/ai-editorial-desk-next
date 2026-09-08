# Harness Runtime Topology v1

## 1. 三个独立运行时

AI Editorial Desk Next 的 Web Shell、DeepSeek Harness 与 Editorial API 不合并为一个进程。

```text
AI Editorial Desk Web Shell
Global IA / Router / Product Workspaces
        │
        │ HTTPS / JSON
        ▼
AI Editorial Desk Next
Python / FastAPI
Editorial Intelligence API
        ▲
        │ Editorial Tools
        │ HTTPS / JSON (+ SSE/轮询)
DeepSeek Harness
TypeScript / Node
Agent UI + Session + Jobs + Tools + Research Workspace
```

Harness 不 import Python 包；Python 后端不依赖 Harness 内部包；Web Shell 不 import Harness 内部 TypeScript 包。

生产部署可以通过同域反向代理提供统一用户体验，但逻辑边界保持独立。

## 2. Web Shell 侧组成

Web Shell 计划承载：

- Global IA / Router；
- Today / Opportunities；
- Programming / Creation / Publication；
- Performance / Knowledge；
- Management / Configuration；
- Opportunity Inspector / Global Search；
- Human Submission；
- Harness launch / return orchestration。

Shell 通过 Editorial API 读取/修改业务状态，不直连 PostgreSQL。

## 3. Harness 侧组成

`integrations/harness` 承载：

- editorial profile / bundle configuration；
- model-facing Editorial Tools；
- API Client / auth / compatibility adapter；
- Tool Card presentation；
- Research Job bridge；
- Research Workspace；
- Session replay / compatibility；
- Hybrid launch adapter。

业务规则不得复制到插件中。插件负责“把 Harness 能力映射到 Backend Use Case”。

## 4. Backend 侧组成

`apps/editorial_api` 是稳定边界：

- 对 Web Shell / Harness 暴露 use-case oriented API；
- 做身份、权限、幂等、输入校验；
- 调用 Domain/Application Service；
- 返回结构化业务结果；
- 不把 ORM model 直接作为公开协议。

## 5. 短任务

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

Shell 的短交互同样调用对应 Use Case API，不在浏览器复制业务规则。

## 6. 长任务

Research、批量发现、深度资料补全等采用异步任务：

```text
Harness Tool or Shell action
→ POST /research-cases
→ 返回 research_case_id + task handle
→ Harness Job / UI Progress
→ GET/SSE task progress
→ completed result
```

长任务必须有稳定业务 id；Harness job id 只代表 Harness runtime task，不代替 backend `research_case_id`。

## 7. Session 与业务真相

Harness Session Event / Tool Result 用于：

- replayable interaction；
- tool call/result；
- research presentation；
- approval/action interaction；
- Agent trajectory。

PostgreSQL 用于：

- Subject / Discovery / Opportunity；
- Evaluation / Evidence / Decision；
- Research Case canonical state；
- Candidate / Programming；
- Draft / Publication / Performance。

Web Shell 的 URL / local state 只保存产品导航与非 canonical UI state。

打开新 Harness Session 时，业务页面/Research context 必须能通过 API 重建，不能假设旧 Session 是唯一数据来源。

## 8. Shell ↔ Harness launch

Web Shell 不直接解析 Harness 内部 route/store。

```text
Shell product route
→ Editorial integration launch contract
→ opaque Harness surface URL / Session association
→ Harness resolves business context by opportunity_id / research_case_id
```

产品 canonical URL 始终以业务 route / business id 为中心，例如：

```text
/research/:research_case_id
```

而不是：

```text
/harness/session/:id   ← 不能成为产品业务真相定位
```

详细 contract：

`../04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`

## 9. 兼容隔离

Harness 当前为 Developer Preview，因此：

- pin upstream version/commit；
- `integrations/harness` 维护 compatibility layer；
- Domain API contract 不跟随 Harness 内部事件/类型变化；
- Harness breaking change 不应触发 PostgreSQL schema migration；
- Harness breaking change 不应迫使 Web Shell product route 跟随变化。

## 10. 部署形态

开发期分别启动：

- Web Shell：独立 dev server；
- Editorial API：如 `127.0.0.1:18000`；
- Harness Web：如 `127.0.0.1:3080`；
- PostgreSQL / WeKnora / Provider services 独立。

生产部署可采用：

```text
same-origin reverse proxy
+ Web Shell main product URL
+ Harness internal surface path/origin
+ Editorial API path
```

具体 browser transport 可演化，但 ownership / business IDs / API semantics 不变。
