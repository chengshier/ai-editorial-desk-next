# Harness UI Strategy v1

## 1. 最终决定

Harness UI Gate 已由 PR #5–#9 完成。

最终形态冻结为：

```text
HYBRID_WEB_HARNESS
```

即：

```text
AI Editorial Desk Web Shell
├─ Today / Opportunities
├─ Programming / Creation / Publication
├─ Performance / Knowledge
├─ Management / Configuration
├─ Global Inspector / Search / Human Submission
└─ Harness-powered Agent / Research surface

DeepSeek Harness
├─ Agent Conversation / Session / Replay
├─ Editorial Tools / ToolViews
├─ Background Jobs
└─ Research Workspace
```

详细决策见：

- `../ADR/ADR-0009-hybrid-web-shell-harness.md`
- `../04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`

## 2. Spike 事实

Pinned exact baseline：

```text
DeepSeek Harness 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release dsh@0.1.0-rc.7
```

已验证：

- Agent Runtime / Tool / Job / Session Replay；
- stable business ID continuity；
- Opportunity / Research custom ToolView；
- Research Result / Evidence / Unknown durable replay；
- `conversation.view` 无侵入承载三栏 Research Workspace；
- refresh / Harness cold restart 后 Research Workspace 可重建；
- Agent Conversation 与 Research Workspace 可共存。

同时确认：

- root `sidebar / conversation / details` 是 replacement seat；
- `conversation.view` 是 additive whole-page seam，但 scope 是 Session；
- stock sidebar 缺少适合“今日 / 机会 / 研究 / 编排 / 创作 / 发布 / 表现 / 知识”的 additive primary-navigation seam；
- Programming / Publishing / Performance 若放入 `conversation.view` 会错误依赖某个 Agent Session；
- exact-pin 没有需要的公开 global router + cross-plugin page navigation seam。

因此 Full Harness Workbench 不再作为 V1 目标。

## 3. Harness 必须优先承担的交互

- Agent 对话与任务编排；
- Editorial Tools 调用；
- Opportunity / Evidence / Research 的结构化 Tool Card；
- Background Research Job；
- Approval / guarded action；
- Session replay / trajectory；
- Research Workspace；
- 需要 Agent 解释、比较、继续研究的交互。

## 4. Web Shell 必须承担的交互

- 全局产品 Router / Primary Navigation；
- Today / Editorial Radar；
- Opportunities Library；
- Programming / Slate；
- Creation / Draft Studio；
- Publication Center；
- Performance & Learning；
- Knowledge / Management；
- Global Opportunity Inspector；
- Human Submission 全局入口；
- Shell ↔ Harness launch / return orchestration。

## 5. Research Workspace 特殊边界

P03 Research 在产品信息架构中仍是一级业务页面，但其 Agent-heavy inner surface 可以由 Harness 提供：

```text
Web Shell
→ owns /research/:research_case_id product route + entry/return

Harness
→ owns Agent session / tools / replay / Research Workspace interaction

Editorial API
→ owns Research Case / Evidence / Unknown canonical state
```

因此不需要把 Research UI 在 Shell 中重新实现一份，也不需要让 Harness 接管全局产品 Shell。

## 6. Conversation View 使用边界

`conversation.view` 适合：

- Chat；
- Trajectory；
- Research Workspace；
- 其他明确属于当前 Agent Session 的完整 view。

不适合：

- Programming；
- Today；
- Opportunities corpus；
- Publication queue；
- Performance Dashboard；

因为这些对象必须跨 Session 长期存在。

## 7. Tool Card / durable result 使用边界

Tool canonical value 与 UI presentation 分离：

- canonical value 返回稳定结构化 JSON；
- presentation/render 负责用户可读卡片；
- Agent 不从自然语言结果反解析业务 id；
- replay source 可以使用 Harness 标准 durable Tool Result；
- backend business truth 仍由 Editorial API / PostgreSQL 提供。

## 8. 禁止项

- 为全局导航 patch/fork Harness core；
- 通过 `document.querySelector(...).click()` 实现跨模块导航；
- 直接访问私有 Harness store action；
- 用 Harness Session ID 代替 `opportunity_id / research_case_id`；
- 把 Candidate / Programming / Decision / Publication 真相写进 Harness Session；
- 在 Shell 与 Harness 中各实现一套相同业务规则。

## 9. Browser transport

Harness surface 未来可以通过 reverse proxy / embedded / same-tab / separate-tab 等方式接入。

Transport 是 integration detail，不允许改变：

- product route；
- business ID；
- ownership；
- Tool/API contract；
- PostgreSQL source-of-truth。

## 10. 后续 Gate

Harness UI 的 Full-vs-Hybrid Gate 已关闭。

后续需要验证的是 **Hybrid integration transport**，不是重新争论产品 ownership：

```text
Shell foundation
→ Harness launch adapter
→ /research/:research_case_id integration
```

任何 Harness 升级仍需重跑 exact-pin compatibility CI，但不重新打开 Full Harness Workbench 假设，除非未来正式 ADR 明确改变架构。
