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

若 Headless 验收通过，则未来 Today / Opportunity 等周期任务应由 AI Editorial Desk 自己的 Scheduler / Orchestrator 发起，而不是要求用户进入 Harness 手工输入。

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

## 当前状态

`AUTOMATED_ACCEPTANCE_PASS / LOCAL_WINDOWS_ACCEPTANCE_PENDING`

自动化 Spike 已证明该路线在固定 Harness 基线上技术可行；在 Windows 本地真实安装、启动和人工工作台切换验收完成前，不把本路线标记为最终正式架构，也不替换当前正式 S4。
