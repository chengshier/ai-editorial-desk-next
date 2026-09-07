# Harness Complex Workbench Hostability Spike

> 状态：M5 Spike / Research Workspace Hostability
>
> 本文中的 M5 仅是 Harness UI Spike 编号，不是产品正式里程碑编号。
>
> Harness pin：`99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` (`dsh@0.1.0-rc.7`)

## 1. 目的

M1–M4 已经验证：

- 自然语言可选择 Editorial Tool；
- Tool 可稳定传递 Opportunity ID；
- out-of-tree client plugin 可覆盖 ToolView；
- Harness Job 可承载后台 Research；
- Research Result / Evidence / Unknown 可通过标准 Tool Result + `presentationMeta` 持久化；
- Browser Refresh、Harness Cold Restart 与 Legacy Session Repair 均可工作；
- 不需要 patch / fork DeepSeek Harness core。

因此本轮不再验证“聊天里能不能画卡片”，而是验证更关键的问题：

> **DeepSeek Harness exact-pin 能否作为 AI Editorial Desk Next 的复杂业务工作台宿主，而不仅仅是 Agent Conversation 宿主。**

首个压力测试选择 P02 — Research Workspace。

---

## 2. exact-pin UI 扩展面审计

### 2.1 Root AppFrame 是三列 Shell

`packages/client/ui-layout/src/client/index.ts` 在 root slot 下声明：

```text
sidebar        single / root
conversation   single / session-maybe
details        single / session
shell.overlay  list / root
```

这说明 Harness 的浏览器 UI 不是一个不可扩展的固定 React 页面，而是 Slot Registry 驱动的 AppFrame。

但三个主列都是 `single`：

- 注册 `sidebar` 会替换整个左栏；
- 注册 `conversation` 会替换整个中栏；
- 注册 `details` 会替换整个右栏。

因此业务插件不应该为了增加一个业务页面就直接覆盖主列，否则会连带移除原 occupant 所声明的内部 seats。

### 2.2 `conversation.view` 是复杂业务页最有价值的扩展点

`ui-conversation` 在 `conversation.session` 下声明：

```text
conversation.view  list / session
```

每个 entry 对应一个完整 Session View Tab。

`ui-conversation` 会动态枚举该 slot 的 entries，并将其投影成 Header Tab；active view ID 又保存在 per-session `dsh.conversation.chat` store 中，因此：

- 新增 view 不需要 patch Header；
- view 选择会随 Session 独立保存；
- Refresh / Session switch 可以保持 active view；
- 一个 view 可以拥有自己的复杂 React 树、滚动区域、筛选、选择状态等。

exact-pin 自己的 `ui-trajectory` 就是直接证据：它以 `conversation.view` 的一个 entry 形式挂载大型 Trajectory 页面，并包含复杂表格、时间线、搜索、折叠、筛选等 UI，而没有替换整个 Conversation shell。

**结论：P02 Research Workspace 应优先作为 `conversation.view` 实现，而不是 Tool Card，也不是覆盖 `conversation` 主列。**

### 2.3 Sidebar 有扩展能力，但不适合直接承载我们的完整产品 IA

stock `ui-sidebar` 占据整个 `sidebar` slot，并在内部只声明：

```text
sidebar.workspaces     single
sidebar.settings       single
sidebar.footer.action  list
```

因此：

- 可以无侵入增加 footer action；
- 不能无侵入插入“今日 / 机会 / 研究 / 编排 / 创作 / 发布 / 表现 / 知识”这种完整产品主导航；
- 替换 `sidebar.workspaces` 会替换 stock Workspace/Session browser；
- 替换整个 `sidebar` 会连 stock workspace/settings seats 一并拿走。

这意味着我们设计稿里的完整左侧产品菜单目前**不是 exact-pin 的自然 additive seam**。

这是 Full Harness Workbench 与 Hybrid Web Shell 决策中的重要压力点。

### 2.4 `details` 适合 Tool Detail，不适合作为我们的常驻 Research Context Inspector

root `details` 是 `single`，stock occupant `ui-conversation` 又在里面声明 `conversation.details.tool`。

直接替换 `details` 会改变 stock Tool inspect 行为。

因此本轮 P02 的右侧 Research Context Inspector 先作为 Research Workspace 内部第三列实现，而不是占用 Harness root details panel。

正式产品是否要把右侧 Inspector 提升到 Shell 级，需要后续单独验证。

### 2.5 exact-pin 缺少一个干净的“业务卡 → 指定 conversation.view”跨插件导航 seam

`ui-conversation` 的 active view 由内部 `chatStore.actions.setView()` 控制。

exact-pin 中 Chat 自己可通过该 action 跳转 Trajectory，但这个 bound action 属于 `ui-conversation` 自己的 registration/store，不是一个公开的 `ctx.layout.navigateView()` 或 `ctx.conversation.selectView()` 服务。

因此我们的 Opportunity ToolView 目前可以：

- 展示按钮；
- 知道 `opportunity_id / research_case_id`；

但**不能在不依赖内部实现、不做 DOM hack、不替换 stock owner 的前提下，直接切换到 `editorial-research-workspace` tab**。

本 Spike 明确不使用“找 DOM 然后 `.click()`”之类 workaround。

这项在 M5 中记为独立 Gate，而不是掩盖掉。

---

## 3. 本轮实现

新增 `editorial-research-workspace` conversation view：

```text
对话 | 轨迹 | 研究工作台
```

研究工作台采用与正式 P02 相同的三域结构：

```text
Research Plan / Unknowns
        |
Claim & Evidence Workspace
        |
Sources / Observable Agent Activity / Context
```

### 数据来源

本轮不新增 Browser → Editorial API 的直连请求，也不引入 CORS / 第二套状态同步。

Research Workspace 直接从当前 Session 已经持久化的标准 Tool Result / `presentationMeta` 中重新投影：

- `start_editorial_research`；
- `get_editorial_research_result`；
- `inspect_editorial_opportunity` / list result。

因此只要 M4 的 durable Tool Result 在，Workspace 就可以跟随 Session Replay 重建。

当前 Spike 为降低改动范围，用一个 bounded recursive projection 从 Session Snapshot 中寻找已持久化的 Editorial presentation metadata。

如果 M5 证明方向成立，正式实现应升级成专用 `conversationViews` projection / builder，像 stock `ui-trajectory` 一样按 Event/Node 构建 typed Research Workspace snapshot，而不是长期保留递归扫描。

---

## 4. M5 Acceptance Gates

### M5-A — Full Business View Mount

PASS 条件：

- Header 自动出现“研究工作台” Tab；
- 点击后是完整页面，不是 Chat Tool Card；
- 不替换 `conversation` root occupant；
- 不修改 Harness core。

### M5-B — Three-zone Workspace

PASS 条件：

- 左：Research Plan / Unknown；
- 中：Claim / Evidence / Contradiction；
- 右：Sources / Observable Agent Activity / Context；
- 能在正常 desktop viewport 中独立滚动和工作。

### M5-C — Durable Session Projection

PASS 条件：

- 已完成 M4 Research 的 Session 打开 Research Workspace 后能读取相同 4 Evidence / 1 Unknown；
- F5 后仍然存在；
- Harness stop/start 后仍能重建；
- 不重新调用 Research API 才能看到已有结果。

### M5-D — Agent Coexistence

PASS 条件：

- 从 Research Workspace 切回“对话”后可继续让 Agent 调 Tool；
- 再回 Research Workspace 能看到 Session 中新增的 durable result；
- Workspace 与 Conversation 不是两个互相断开的状态孤岛。

### M5-E — Opportunity → Workspace Context Handoff

目标：从 Opportunity UI 一次操作进入对应 Research Workspace，并携带 stable context。

exact-pin 审计发现当前缺少公开 cross-plugin `setView` seam，因此本项当前预期可能是：

```text
PARTIAL / FAIL WITH ARCHITECTURE FINDING
```

如果只能通过：

- patch ui-conversation；
- 访问私有 store；
- DOM query/click hack；

才能实现，则不应为了“让 Spike 全绿”强行绕过。

### M5-F — Shell Navigation Fit

评估而非强制 PASS：

- Research Workspace 作为 session view 是否自然；
- 我们完整产品左侧 IA 是否能在不替换 stock sidebar 的前提下实现；
- 如果不能，记录 Hybrid Shell 信号。

---

## 5. 当前预判

基于源码审计，在运行 M5 人工 UI 前的预判是：

### Harness 强项

- Agent Conversation；
- Tool / Job；
- Business ToolView；
- Session-scoped complex view；
- Research / Trajectory 这类“围绕一次 Agent Session 的深工作台”；
- Durable replay。

### Harness exact-pin 压力点

- 全产品级左侧导航；
- Session 外的全局 Radar / Programming / Publishing IA；
- Tool Card 到任意业务 View 的公开 programmatic navigation；
- 将 root details 当作业务常驻 inspector 而又不影响 stock tool details。

因此 M5 真正要回答的不是“能不能画三栏 UI”，而是：

> **Research Workspace 能否自然成为 Harness Session 的一个业务 View；以及这种 View 模式是否足以支撑整个产品，还是只适合 Agent-heavy 子工作台。**

如果 P02 PASS 但 M5-E / M5-F 明显受限，则最可能的最终架构不是“Harness 不可用”，而是：

```text
Hybrid Web Shell
  ├─ Today / Radar
  ├─ Opportunities
  ├─ Programming
  ├─ Publishing / Performance
  └─ Research entry
          ↓
Harness-powered Agent / Research Workbench
```

如果后续又能找到稳定的 navigation/sidebar extension seam，则再提高 Full Harness Workbench 的权重。
