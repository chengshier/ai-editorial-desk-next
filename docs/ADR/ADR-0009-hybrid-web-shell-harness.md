# ADR-0009 — Hybrid Web Shell + Harness-powered Agent / Research Workbench

## Status
Accepted

## Context

ADR-0007 要求在 Harness Agent Runtime 技术可行之后，继续通过真实浏览器 / UI Spike 决定最终采用：

```text
HARNESS_FULL_WORKBENCH
或
HYBRID_WEB_HARNESS
```

PR #5–#9 已完成该 Gate 所需的关键验证：

- 稳定 Opportunity ID 可由 Agent 连续调用；
- 自定义 ToolView 可将 Editorial Tool 结果渲染为业务卡片；
- Research Job / Result / Replay / Cold Restart 可工作；
- `conversation.view` 可无侵入承载完整三栏 Research Workspace；
- 复杂 Session-scoped Workbench 与 Agent Conversation 可以共存；
- exact-pin Harness 的 root `sidebar / conversation / details` 是 replacement seat；
- `conversation.view` 是可追加 whole-page seam，但作用域是 Session；
- stock sidebar 没有适合产品级一级导航的 additive page/router seam；
- Programming / Today / Opportunities / Publishing 等全局业务模块若塞进 `conversation.view`，会错误地依附某个 Agent Session；
- 为获得全局业务导航而替换 root shell 或私有 store / DOM hack，不符合本项目“不 fork / 不 patch upstream core”的边界。

因此 Harness 的能力边界已经足够明确，不再需要继续为 Full Harness Workbench 增加 Spike。

## Decision

冻结最终产品 UI 形态为：

```text
HYBRID_WEB_HARNESS
```

即：

```text
AI Editorial Desk Web Shell
├─ Global IA / Router
├─ Today / Opportunities
├─ Programming / Creation / Publication
├─ Performance / Knowledge
├─ Management / Configuration
├─ Global Opportunity Inspector / Search / Human Submission
└─ Harness-powered Agent / Research surface

DeepSeek Harness
├─ Agent Conversation / Session / Replay
├─ Editorial Tools / ToolViews
├─ Background Jobs
├─ Research Workspace
└─ Agent-driven structured interaction

Editorial Intelligence API / PostgreSQL
└─ canonical business truth
```

Harness 继续是 V1 Agent Runtime 技术基线和 Agent/Research Workbench，但不再承担整个产品的全局 Router / Primary Navigation / 长期业务模块 Shell。

## Ownership

### Web Shell owns

- 产品一级导航与路由；
- P01 Today / P02 Opportunities；
- P04 Programming / P05 Creation / P06 Publication；
- P07 Performance / P08 Knowledge；
- 管理侧 Acquisition / Configuration / System；
- 全局 Opportunity Inspector；
- Global Search；
- Human Submission 全局入口；
- Shell ↔ Harness launch / return orchestration。

### Harness owns

- Agent Session；
- Agent Conversation；
- Tool call / result / ToolView；
- Background Job 与 Agent completion notification；
- Research Workspace 的 Agent-heavy interaction surface；
- Session replay / trajectory。

### Editorial API / PostgreSQL owns

- Subject / Discovery / Opportunity；
- Evaluation / Evidence / Unknown；
- Research Case；
- Candidate / Programming；
- Human Decision；
- Draft / Publication / Performance；
- Shell 与 Harness 都需要重建的 canonical business state。

## Stable Identity Rule

产品路由与业务链接必须以业务 ID 为中心：

```text
opportunity_id
research_case_id
candidate_id
draft_id
publication_id
```

`harness_session_id`、Harness Job ID、Workspace ID 等只属于 runtime / integration metadata，不得替代业务 ID，也不得成为产品 canonical URL 的唯一定位依据。

## Navigation Rule

Shell 不允许：

- 直接调用 Harness 私有 store；
- 依赖 DOM query/click hack；
- 从 Harness 页面文本反解析业务 ID；
- 拼接未经 compatibility layer 保证的 Harness 内部 URL；
- 将 Programming / Decision / Draft 等业务状态写进 Harness Session 作为唯一事实源。

Shell → Harness 必须经过稳定的 integration launch contract；Harness → Shell 必须返回业务 URL，而不是依赖 Harness 内部 view id。

具体 contract 见：

`docs/04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`

## Research Page Rule

P03 Research Workspace 在产品信息架构中仍是一级业务页面，但其 Agent-heavy inner surface 可以由 Harness 提供。

因此：

```text
Product route / entry / return / surrounding navigation = Web Shell
Research Agent session / tools / replay / structured research workspace = Harness
Research Case / Evidence / Unknown canonical state = Editorial API
```

“P03 是产品一级页面”与“Research Workspace 由 Harness-powered surface 承载”并不冲突。

## Transport Is Not Domain

Harness surface 最终通过：

- 同域 reverse proxy；
- embedded surface；
- same-tab / separate-tab launch；

哪种浏览器 transport 落地，不属于 Domain Contract。实现必须被 compatibility / launch adapter 隔离，不能改变业务路由、ID、ownership 或 API 语义。

## Consequences

1. 后续不再以“让整个产品塞进 Harness”为目标继续做 UI Spike。
2. 新增 `apps/web`（或等价 Shell app）时，首先实现 Global Shell / Router / Product IA，而不是复制 Harness UI。
3. Harness integration 继续保留 exact-pin compatibility CI。
4. Research 可以继续深度利用 Harness；Programming / Publishing / Performance 不因 Harness Session 生命周期而重建。
5. Shell 与 Harness 都调用同一 Editorial Intelligence API；禁止复制业务逻辑。
6. Harness 升级只影响 compatibility / launch adapter，不应要求产品路由或 PostgreSQL schema 跟随修改。
7. ADR-0007 的 Full-vs-Hybrid UI Gate 至此关闭。

## Supersedes / Refines

- 完成 ADR-0007 的最终 UI Gate。
- 保留 ADR-0002 中“Harness 不是业务真相层、承担 Agent Runtime / Workbench 能力”的部分；其“整个 Product Shell”范围由本 ADR 收敛为 Agent / Research Workbench subsystem。
