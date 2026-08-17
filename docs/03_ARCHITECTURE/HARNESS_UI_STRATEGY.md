# Harness UI Strategy v1

## 1. 当前决定

DeepSeek Harness 是 V1 首选 Product Runtime / Agent Workbench，但当前不承诺“所有复杂业务页面永远只使用 Harness”。

原因：Harness 已明确支持 Tool、Jobs、Session Replay、Conversation Node、UI presentation 等扩展点，但本项目需要的全局 Radar、复杂候选池、长期库、筛选/排序、Performance Dashboard 仍需技术验证。

## 2. 必须优先用 Harness 承担的交互

- Agent 对话与任务编排；
- Editorial Tools 调用；
- Opportunity / Evidence / Decision 的结构化 Tool Card；
- Research 进度与完成状态；
- Approval / guarded action；
- Session replay；
- 需要 Agent 解释、比较、继续研究的交互。

## 3. 需要 Spike 验证的 UI

- Today / Editorial Radar 独立页面；
- Opportunities 大列表 + 多维筛选；
- Programming / Slate 编排；
- Evergreen / Series 长期池；
- Publication / Performance Dashboard；
- 跨 Session 的全局业务导航与查询。

## 4. 两种允许的最终形态

### Option A — Harness-first Full Workbench

Harness extension 能满足复杂页面：

```text
AI Editorial Desk
└─ Harness Web/Profile
   ├─ Radar
   ├─ Opportunity Workspace
   ├─ Agent / Research
   ├─ Programming
   └─ Performance
```

### Option B — Hybrid Product Shell

Harness 擅长 Agent 工作台，但复杂业务页面扩展成本过高：

```text
AI Editorial Desk Web Shell
├─ Radar
├─ Opportunity Pool
├─ Programming
├─ Performance
└─ Harness Workspace
   ├─ Agent
   ├─ Research
   └─ Tool/Approval/Replay
```

两种形态必须共享 Editorial Intelligence API；禁止因为 UI 选择复制业务逻辑。

## 5. Conversation Node 使用边界

适合：
- Research start/progress/end；
- 长任务状态；
- Opportunity review summary；
- structured decision confirmation。

Conversation Node 的状态必须由 durable event 构建，可 replay；不得依赖当前页面内存或扫描数据库。

业务 canonical state 仍由 Backend API 提供。

## 6. Tool Card 使用边界

Tool canonical value 与 UI presentation 分离：
- canonical value 返回稳定结构化 JSON；
- presentation/render 负责用户可读卡片；
- 不能为了 UI 让 Agent 从自然语言结果里反解析 id。

## 7. 决策 Gate

在 Foundation 进入大规模 UI 开发之前必须通过 `HARNESS_INTEGRATION_SPIKE.md`。

Spike 结论必须明确：
- `HARNESS_FULL_WORKBENCH`；或
- `HYBRID_WEB_HARNESS`。

没有 Spike 证据时不得自行 fork Harness core 来补 UI 能力。