# Harness Programming / Global Shell Hostability Spike

> Spike 编号：M6（仅代表 Harness UI 架构验证编号，不是产品正式里程碑）
>
> DeepSeek Harness exact pin：`99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` (`dsh@0.1.0-rc.7`)

## 1. 背景

M1–M4 已证明 Harness 可以稳定承载：

- 自然语言 → Editorial Tool；
- Stable ID 连续调用；
- 自定义 ToolView；
- Background Job；
- Research Result / Evidence / Unknown；
- Session Refresh / Cold Restart Replay。

M5（PR #8）进一步证明：

- `conversation.view` 可以无侵入挂载完整 Research Workspace；
- 三栏复杂业务页面可以正常运行；
- Research Workspace 可以从 durable Tool Result 重建；
- Harness 冷重启后仍可恢复；
- Agent Conversation 与复杂 Workspace 可以共存。

M5 同时暴露一个关键边界：`conversation.view` 是 **Session scoped**，且 exact-pin 没有公开的跨插件 `selectView()` / `navigateView()` seam。

因此 M6 不再重复证明“能不能画一个 Kanban”。真正需要回答的是：

> **Programming / Today / Opportunities / Publishing 等全局业务模块，能不能自然地成为 Harness 的一级产品页面和全局导航，而不替换 Harness core shell？**

---

## 2. 目标产品对 Programming 的要求

正式 UI/UX 规范中，Programming / 编排是一级业务模块，不属于某一次 Agent Session。

它需要长期存在并跨会话共享：

```text
Candidate Pool
Today Slate
Series
Evergreen Pool
Potential Pool
Watch / Researching
Pairwise Compare
Calendar / 排期
```

Today Slate 需要：

```text
主推
备选
观察
暂缓
```

这类状态的正确事实源应是 Editorial API / DB，而不是某一个 Harness Session 的聊天历史。

Programming 的产品语义因此要求：

1. 不依赖“先打开某个会话”才能进入；
2. 从全局一级导航直接访问；
3. 切换 Agent Session 不应改变看板业务事实；
4. 看板与 Research / Draft / Publication 通过稳定业务 ID 互相跳转；
5. 页面生命周期属于产品 Shell，而不是 Conversation View Ring。

---

## 3. exact-pin Root Shell 审计

### 3.1 AppFrame 的根级席位

`ui-layout` 在 `root` 中声明：

```text
sidebar       single / root
conversation  single / session-maybe
details       single / session
shell.overlay list / root
```

源码注释明确说明：

- 注册 `sidebar` 会 **替换整个左列**；
- 注册 `conversation` 会 **替换整个中心列和其内部所有 seat**；
- 注册 `details` 会 **替换整个右列**；
- `shell.overlay` 只是 frame-wide 浮层，不是页面路由 / 主内容区。

因此 exact-pin 没有类似以下的 additive root page seam：

```text
app.route
shell.page
workspace.page
navigation.item -> page
```

### 3.2 Sidebar 的可扩展面

stock `ui-sidebar` 在根 `sidebar` 内声明：

```text
sidebar.workspaces      single / root
sidebar.settings        single / root
sidebar.footer.action   list / root
```

这意味着：

- `sidebar.workspaces` 是整个 Workspace / Session 浏览区域，不是可追加的产品导航列表；
- 接管它会替换 Harness 原有 Workspace / Session 浏览器；
- `sidebar.footer.action` 可以追加小型底部动作，但不能承担 Today / Opportunities / Programming / Publishing 这种一级导航和页面路由。

### 3.3 Conversation 的 additive whole-page seam

`ui-conversation` 明确提供：

```text
conversation.view  list / session
```

并且说明这是“ADD rather than replace”的整页 Tab seam。

M5 已经验证它非常适合：

```text
Chat
Trajectory
Research Workspace
```

这类 **Session-scoped / Agent-heavy** 工作台。

但是它天然依赖一个当前 Session，因此如果把 Programming 放进去，会出现产品语义错误：

```text
Programming Board
    ↓
必须先有 Session
    ↓
看板被绑定到 Conversation View Ring
    ↓
全局编排状态看起来像某次对话的子页面
```

技术上“能渲染”不等于产品上“宿主模型正确”。

---

## 4. Programming Control 判断

M5 已证明 `conversation.view` 足以承载高密度三栏 Research Workspace，因此再做一个纯视觉 Kanban 不会新增关键证据。

M6 的关键对照结论是：

### Control A — 把 Programming 做成 `conversation.view`

**技术可行。**

但：

- Scope = Session；
- 没有全局一级导航；
- 业务状态容易误绑定 Session；
- Opportunity → Programming / Programming → Research 的跨模块导航缺少公开 seam；
- 用户必须先进入 Harness Conversation Shell 才能看到 Programming。

结论：**Hostability = PARTIAL，产品宿主模型不正确。**

### Control B — 注册 root `conversation`

可以拿到整个中心列，但会替换 stock ConversationRoot，并带走：

- stock Session body；
- view ring；
- composer；
- input seats；
- 现有 Chat / Trajectory / Research Workspace 组合。

这等价于开始重做 Harness Web Shell，不再是 additive plugin integration。

结论：**Reject。**

### Control C — 注册 `sidebar.workspaces`

可以把左侧区域改成产品导航，但会替换 stock Workspace / Session 浏览器。

这不是“加一个 Today / Programming 入口”，而是接管 Harness Sidebar 的主要业务区域。

结论：**Reject。**

### Control D — 使用 `shell.overlay`

它是浮层，不是页面和路由。

结论：**Not applicable。**

---

## 5. M6 Gate

### M6-A Global Page Seam

要求：不替换 stock `conversation`，新增一个与 Session 无关的一等业务页面。

**结果：FAIL WITH ARCHITECTURE FINDING。**

exact-pin 没有 additive root page/router seam。

### M6-B Global Primary Navigation

要求：无侵入加入：

```text
今日
机会
研究
编排
创作
发布
表现
知识
```

**结果：FAIL WITH ARCHITECTURE FINDING。**

stock sidebar 没有 primary-navigation list seam；`sidebar.workspaces` 是 single replacement seat。

### M6-C Programming Business Scope

要求：Programming 独立于 Agent Session 存在。

**结果：FAIL as native Harness page / PASS as external product-shell page。**

`conversation.view` 的 session scope 与 Programming 的业务 scope 不匹配。

### M6-D Agent / Research Workbench Hostability

要求：Research / Conversation 继续由 Harness 承载。

**结果：PASS。**

由 M1–M5 的真实运行验证覆盖。

### M6-E Cross-module Navigation

要求：Opportunity / Programming / Research 能通过稳定业务 ID 互相导航，而不使用私有 store、DOM query/click 或 patch core。

**结果：PARTIAL / ARCHITECTURE FINDING。**

exact-pin 可承载 Session view，但没有公开的全局 router + cross-plugin view selection seam。

---

## 6. 架构决策

M5 + M6 的组合证据已经足以区分两类 UI：

### Harness 最适合承载

```text
Agent Conversation
Tool orchestration
Background Job
ToolView
Research Workspace
Session-scoped high-density Agent workbench
Replay / Cold Restart
```

### 产品 Shell 应自己承载

```text
Today / Editorial Radar
Opportunities Library
Programming / Editorial Slate
Draft Studio
Publication
Performance & Learning
Knowledge
Acquisition
Editorial Configuration
System / Providers
全局搜索 / 一级导航 / 跨模块路由
```

因此正式推荐冻结为：

# Hybrid Web Shell + Harness-powered Agent / Research Workbench

不是：

```text
Full Harness Workbench
```

也不是：

```text
放弃 Harness，自研 Agent Runtime
```

而是明确分层：

```text
AI Editorial Desk Web Shell
├─ Global IA / Router
├─ Today / Opportunities / Programming / Draft / Publishing / Performance
├─ Product-level Inspector / Search / Navigation
└─ Harness Entry / Research Workbench

Harness
├─ Agent Conversation
├─ Editorial Tools
├─ Background Jobs
├─ ToolViews
├─ Research Workspace
└─ Session Replay

Editorial API / DB
└─ Opportunity / Research / Programming / Draft / Publication / Learning 的业务事实源
```

---

## 7. 下一阶段不是继续证明 Harness 能画页面

M6 完成后，不再继续把 Radar / Programming / Publishing 一个个塞进 `conversation.view` 做同类实验。

下一阶段应该转入 **Hybrid Shell Contract**：

1. 明确 Web Shell 与 Harness 的边界；
2. 定义 `opportunity_id / research_case_id / session_id` 映射；
3. 定义 Shell → Harness 的进入方式；
4. 定义 Harness → Shell 的返回 / 深链方式；
5. 定义哪些状态属于 Editorial API，哪些属于 Harness Session；
6. 冻结正式路由和页面 ownership；
7. 再开始真正的 Today / Programming / Draft 等产品页面实现。

---

## 8. Non-goals

本 Spike 不：

- patch / fork DeepSeek Harness；
- 用 DOM click hack 假装存在导航 API；
- 用 `conversation.view` 强行把所有产品模块包装成 Session Tab；
- 重新验证 M5 已证明的复杂 React 布局能力；
- 把 Programming 业务事实写进 Harness Session log。

M6 的价值不是得到一个新的 Demo 页面，而是避免把错误的宿主模型继续扩展成正式产品架构。
