# Harness-native Editorial Shell Spike

## 目的

验证 AI Editorial Desk 是否可以作为 **DeepSeek Harness 的 out-of-tree Product Shell 插件**运行，而不是通过外部 Web Shell + iframe 嵌入 Harness。

本 Spike 同时验证两个彼此独立的关键问题：

1. **UI Hostability**：插件是否能接管 Harness Web 的产品 Shell，并与原生 Harness 工作台双向切换；
2. **Headless Orchestration**：没有浏览器、没有人工聊天输入时，后台是否可以主动驱动 Harness Agent 执行任务。

## 固定 Harness 基线

```text
commit: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release: dsh@0.1.0-rc.7
```

不得通过修改 upstream core 来让 Spike 通过。

## 目标拓扑

```text
DeepSeek Harness
├─ official runtime
│  ├─ Agent
│  ├─ Session
│  ├─ Tool
│  ├─ Job
│  ├─ Replay
│  └─ Model
│
├─ stock Harness workbench
│  └─ free-form Agent / Session UI
│
└─ AI Editorial Desk Plugin
   └─ structured editorial product shell
      ├─ Today
      ├─ Opportunities
      ├─ Research
      ├─ Programming
      ├─ Creation
      ├─ Publication
      └─ Performance

Editorial API / PostgreSQL
└─ canonical business truth
```

## UI 验收

必须由真实浏览器证明：

1. 安装插件后默认可以显示 AI Editorial Desk Shell；
2. AI Editorial Desk Shell 直接运行在 Harness Web 页面中，不包含 iframe；
3. 插件可从 Editorial API 读取业务数据；
4. 切换到 Harness 原生工作台后，插件不占用 `root`，stock AppFrame 恢复；
5. 原生 Harness 工作台提供返回 AI Editorial Desk 的入口；
6. 再次切回 AI Editorial Desk 后业务 Shell 恢复；
7. 不修改 `AppFrame.tsx`、`SidebarRoot.tsx`、`ConversationRoot.tsx` 等 upstream 文件。

## Headless 验收

必须证明：

```text
caller / scheduler
→ Harness SDK / JSON-RPC
→ prompt accepted
→ Agent runtime
→ model request
→ Agent idle
```

这个验证不能依赖 Harness Web UI，也不能依赖人工在输入框发送消息。

CI 使用 pinned Harness SDK Server 的 mock OpenAI-compatible endpoint 测试，避免依赖真实 API Key，同时仍走真实 Agent runtime / session prompt 路径。

## 自动运行架构含义

Headless 验收通过后，未来 Today / Opportunity 等周期任务应由 AI Editorial Desk 自己的 Scheduler / Orchestrator 发起，而不是要求用户进入 Harness 手工输入。

```text
Schedule / Event / Manual Command
→ Editorial Orchestrator
→ Harness Runtime Adapter
→ Harness Agent
→ Editorial Tools
→ Editorial API / PostgreSQL
→ Product UI
```

运行时间、频率、启停、Catch-up 与运行历史均属于 Editorial 配置，不属于 Harness Session。

## 自动化验证结果

最新 Spike head 已通过三套 CI：

```text
CI                         PASS
Harness Spike              PASS
Harness Native Shell Spike PASS
```

`Harness Native Shell Spike` 已在固定 DeepSeek Harness 基线上完成并通过：

```text
pristine Harness build                 PASS
headless agent execution without Web   PASS
native shell plugin typecheck          PASS
native shell plugin bundle             PASS
isolated profile plugin install        PASS
real Harness Web boot                  PASS
AI Editorial Desk root takeover        PASS
Editorial API data read                PASS
AI Editorial Desk → stock Harness      PASS
stock Harness → AI Editorial Desk      PASS
```

其中原生 Harness 首次进入时的 `Internal Testing Notice` 与 API Key onboarding 均按真实用户流程处理，不通过 force click、DOM hack 或修改 upstream core 绕过。

## Windows 本地人工验收结果

已在 Windows 本地按固定 Harness commit 完成真实安装与人工验收：

```text
Editorial API       http://127.0.0.1:18000
Harness Web         http://127.0.0.1:3080
apps/web            未启动 / 不参与本 Spike
```

本地验收结果：

```text
AI Editorial Desk 直接接管 3080 root        PASS
无 iframe / 无 4173 外部 Shell             PASS
Editorial API 读取 3 条 Opportunity          PASS
AI Editorial Desk → stock Harness           PASS
stock Harness → AI Editorial Desk           PASS
Editorial 模式刷新后保持当前工作台           PASS
Harness 模式刷新后保持当前工作台             PASS
```

本地验收过程中曾发现插件 profile 仍加载旧的 `8000` 端口产物；重新执行 prepare / bundle / profile reinstall 后已恢复为项目统一端口 `18000`。该问题属于本地已安装插件产物未刷新，不构成架构阻断。

## 架构结论

本 Spike 已证明以下构想在固定 DeepSeek Harness 基线上成立：

```text
DeepSeek Harness
= Agent Runtime + stock free-form workbench

AI Editorial Desk Plugin
= 默认 structured product workbench

两者
= 同一 Harness Web 中双向切换
```

因此：

- AI Editorial Desk 不需要通过 iframe 嵌入完整 Harness UI；
- AI Editorial Desk 可以作为 out-of-tree Client Plugin 接管 Harness `root`；
- 原生 Harness 工作台可以保留，作为自由 Agent / Session 工作区；
- 结构化业务工作流由 AI Editorial Desk 页面驱动；
- Scheduler / Orchestrator 可以在无浏览器、无人工聊天输入的情况下主动驱动 Harness；
- Editorial API / PostgreSQL 继续作为业务事实源；
- Harness Session / Job / Replay 继续作为执行与追溯运行时对象，不替代业务 ID 与业务持久化。

## 当前状态

`ACCEPTED / AUTOMATED_PASS / WINDOWS_LOCAL_PASS`

该架构 Spike 已完成并通过。后续不再继续扩展本 Spike 页面；正式实施应转入 Harness-native Product Shell 迁移工作，将现有 AI Editorial Desk 业务页面逐步迁入正式插件，并建设 Scheduler / Orchestrator 与 Harness Runtime Adapter。

PR #14 的 external Web Shell + iframe Harness 路线不再作为最终产品方向，仅保留其 Runtime Integration 验证价值；是否关闭、保留或摘取其中可复用代码，应在正式迁移批次中处理。
