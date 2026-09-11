# Hybrid Web Shell ↔ Harness Contract v1

> **Status: SUPERSEDED / HISTORICAL**
>
> 该 Contract 记录 PR #5–#14 阶段的 Hybrid Web Shell 设计，不再作为当前实现依据。
>
> 当前活动架构：`HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL`（ADR-0010）。
>
> 当前活动 Contract：`HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`。

## 为什么保留本文件

PR #5–#9 当时只证明了 Session-scoped `conversation.view` 等 Harness UI seam，尚未证明整个结构化产品 Shell 可以通过公开插件机制无侵入托管。因此当时冻结：

```text
AI Editorial Desk Web Shell
+
Harness-powered Agent / Research surface
```

并设计了 launch / return、`surface_url`、embedded / iframe / same-tab 等 transport contract。

PR #15 后续证明 pinned Harness 的公开 root Slot replacement seam 可以由 out-of-tree plugin 承载完整 Product Shell，同时保留 stock Harness workbench，不需要 upstream core patch。于是 ADR-0010 supersede 了本 Contract 的最终宿主决定。

## 历史设计核心

旧 Contract 曾规定：

```text
Web Shell owns global product IA / routes
Harness owns Agent / Tool / Job / Replay / Research Workspace
Editorial API / PostgreSQL owns canonical business truth
```

旧的拟议 integration seam 包括：

```http
POST /api/v1/integrations/harness/launches
```

以及：

```text
surface_url
return_url
transport = embedded / same-tab / separate-tab
```

这些字段与 iframe/embedded browser transport **不得继续作为正式 Product Shell 实现依据**。

## 仍然有效的不变量

虽然宿主方式已 supersede，下列边界继续有效并已迁入 ADR-0010 / 新 Contract：

1. `research_case_id` 等业务 ID 是 canonical identity。
2. `harness_session_id` / Job / Workspace ID 只是 runtime metadata。
3. Session 丢失不得导致 Research Case、Evidence、Decision、Draft 丢失。
4. Product 和 Harness Tool 都调用稳定 Editorial API，不复制 Domain Logic。
5. 禁止 private Harness store、DOM click hack、message-text ID parsing。
6. Harness Session log 是 replay/runtime trajectory，不是唯一业务数据库。
7. Editorial API / PostgreSQL 是 canonical business truth。
8. Harness breaking change 应隔离在 integration/compatibility layer。

## 当前替代链路

当前 Research integration 不再经过 browser launch descriptor：

```text
Harness-native Product Shell
→ HarnessRuntimeAdapter
→ Research Case ↔ Harness Session binding
→ public ctx.sessions / ctx.workspaces
→ Session.prompt()
→ get_editorial_research_result
→ durable Tool Result / replay
```

fresh Harness profile 也由 Product Shell 通过公开 `IWorkspaces` outward API 自动建立 dedicated runtime Workspace。

## 历史查询

如需查看本 Contract 被 supersede 前的完整 launch/return/iframe 设计，请使用 Git 历史中 ADR-0010 之前的版本。不要把历史文本复制回当前实现。

当前实现必须阅读：

- `../ADR/ADR-0010-harness-native-product-shell.md`
- `HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`
- `../03_ARCHITECTURE/HARNESS_INTEGRATION.md`
- `../07_DELIVERY/S4_HARNESS_NATIVE_PRODUCT_SHELL_MIGRATION.md`
