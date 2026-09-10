# S4 Harness-native Product Shell 正式迁移

## 决策

PR #15 已完成自动化与 Windows 本地验收，正式证明以下路线可行：

```text
DeepSeek Harness
├─ official runtime
├─ stock Harness workbench
└─ AI Editorial Desk Product Shell Plugin

Editorial API / PostgreSQL
└─ canonical business truth
```

因此 S4 的正式方向切换为 **Harness-native Product Shell**。`apps/web -> iframe -> Harness` 不再作为最终产品架构。

## 不变边界

1. AI Editorial Desk 是结构化业务产品；Harness 是 Agent Runtime + 原生自由 Agent 工作台。
2. Opportunity / Research Case / Candidate / Draft / Publication 等业务对象由 Editorial API / PostgreSQL 持有。
3. Harness Session / Job / Replay 是运行时对象，不得替代业务 ID。
4. 标准业务动作由 Product UI 或 Scheduler / Orchestrator 主动驱动 Harness，不要求用户进入原生聊天页手工 prompt。
5. Harness 原生工作台继续保留，作为自由 Agent / Session 模式，并可与 AI Editorial Desk 双向切换。
6. 不修改 DeepSeek Harness upstream core；优先使用公开 Client Plugin / Slot / Runtime / SDK seam。

## PR #14 处理结论

PR #14 的 iframe 方向被本决策 supersede，不直接合并。但以下设计思想应吸收到正式实现：

- `research_case_id <-> harness_session_id` 是运行时绑定，不是业务主键替换；
- Session 丢失时允许创建新 Session，并从 canonical Research Case 重新 hydrate；
- 使用公开 `sessions / workspaces / Session.prompt()` outward API；
- bootstrap 必须幂等，避免重复 prompt；
- Research Case 即使 Harness runtime 失败也不得视为业务对象丢失；
- launch/session/rebind/bootstrap 的测试思路继续保留。

以下实现明确废弃：

- `surface_url` 作为 Product Shell -> Harness UI 的主要接入；
- `embedded` transport；
- iframe Harness；
- `editorial_embed` / `editorial_launch` URL 参数驱动的嵌入模式；
- 外部 `apps/web` Shell 作为最终运行宿主。

## 正式迁移批次

### S4-N1 Product Shell Foundation

- 建立正式 `@ai-editorial-desk/harness-editorial-shell` 包；
- 复用已验收的 `root` shadow 与 `sidebar.footer.action` 双向切换；
- 提供统一 API Base / runtime configuration；
- 提供 API 失败重试与运行状态，不依赖整页手工刷新；
- exact-pin typecheck / bundle / install / browser smoke。

### S4-N2 Today / Opportunities Migration

- 将现有 `TodayRadarPage` 与 `OpportunitiesLibraryPage` 的真实交互迁入 Product Shell；
- 保留 Opportunity Inspector、Research Case 创建/恢复等业务行为；
- 不复制 mock 数据，不把 Session 状态当业务状态。

### S4-N3 Research Runtime Adapter

- 建立正式 `HarnessRuntimeAdapter`；
- Product UI 的“开始研究 / 继续调查”直接驱动 Harness Session / Agent；
- 吸收 PR #14 的 Session rebind / bootstrap / rehydrate 设计；
- Research Workspace 消费 Editorial API canonical result + Harness activity/replay。

### S4-N4 Scheduler / Headless Orchestration

- 建立 Editorial Scheduler / Orchestrator；
- 支持 Schedule / Event / Manual 三类触发；
- 配置化启停、时间/频率、Catch-up、失败重试、Last Run / Next Run、运行历史；
- Today / Opportunity / Watch 等任务无需人工聊天触发；
- 通过 Harness SDK / JSON-RPC 主动执行 Agent。

### S4-N5 Web Shell Retirement

- 在 Product Shell 达到功能等价前保留 `apps/web` 作为迁移参考与回归基线；
- 达到 Today / Opportunities / Research 主链等价后，再决定删除或转为开发预览壳；
- 不允许同时维护两套生产入口。

## Gate

每个批次必须独立通过：

```text
Python / Web baseline CI
Harness exact-pin typecheck
Harness bundle
isolated profile install
browser smoke
business ID invariants
no upstream core patch
```

正式迁移期间，PR #15 的 Spike 包与验收文档保留为架构证据，不继续承载生产功能。
