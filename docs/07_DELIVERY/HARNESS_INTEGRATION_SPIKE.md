# Harness Integration Spike

## 1. 目的

在正式大规模开发 Harness Workbench 之前，用最小代码验证官方扩展点是否足以支撑本项目，而不是先假设“所有 UI 都能无痛做出来”。

## 2. 必须验证的最小链路

### Spike A — Tool → FastAPI
- 注册一个 out-of-tree editorial tool。
- Tool 调用本项目 FastAPI `/healthz` 与一个 mock opportunity endpoint。
- 返回 typed canonical JSON。
- 验证错误、取消、超时与 provider/API unavailable 的表现。

### Spike B — Opportunity Card
- 后端返回 OpportunitySummary。
- Harness Tool 使用独立 presentation/card 显示：Angle、Theme、Audience Promise、Recommendation、Unknown。
- Agent/代码可以直接使用 canonical id，不从人类文案中解析。
- replay 后 Card 仍可正确重建。

### Spike C — Research Job / Conversation Node
- `start_research` 创建 backend mock Research Case。
- Harness Job/Conversation Node 展示 start → progress → completed。
- 重启/刷新后可 replay。
- backend `research_case_id` 与 Harness job/session id 严格区分。

## 3. 第二层 UI 验证

在 A/B/C 通过后，再验证：
- 自定义 Radar/独立业务区域；
- 50~200 条 Opportunity 的列表、筛选、分组；
- Sidebar / Navigation 的产品化扩展；
-跨 Session 读取业务状态；
- Programming Slate；
- Performance Dashboard 的基本图表/筛选体验。

## 4. 决策输出

Spike 最终必须写出 ADR，二选一：

### `HARNESS_FULL_WORKBENCH`
Harness 的 out-of-tree profile/plugin/client extension 足以承担主要 Radar + Agent + Programming 工作台。

### `HYBRID_WEB_HARNESS`
Harness 保持 Agent/Research/Tool/Approval/Replay 核心工作台；复杂全局业务页面由本项目 Web Shell 承担。

## 5. 失败条件

出现以下任一情况不得直接 fork Harness core 继续：
- 关键 UI 只能通过长期维护 upstream core patch 实现；
- 业务状态必须塞进 Harness Session 才能工作；
- 插件需要直接读取 PostgreSQL；
- breaking changes 会直接迫使 Domain/API schema 跟随变化。

应先评估 Hybrid 方案。

## 6. 验收产物

- Spike branch / PR；
- 可运行 demo；
- pinned Harness commit/version；
- compatibility risk list；
- UI capability matrix；
- 性能/开发复杂度记录；
- 最终 ADR。