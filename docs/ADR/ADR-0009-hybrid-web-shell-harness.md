# ADR-0009 — Hybrid Web Shell + Harness-powered Agent / Research Workbench

## Status

**Superseded by ADR-0010 — Harness-native Product Shell.**

本 ADR 保留为历史决策记录。PR #5–#9 阶段基于当时已验证的 Harness UI seam，选择 `HYBRID_WEB_HARNESS` 是合理结论；PR #15 后新增的 root Slot Product Shell 证据改变了最终宿主结论。

## Historical Context

ADR-0007 要求在 Harness Agent Runtime 技术可行之后，继续通过真实浏览器 / UI Spike 决定：

```text
HARNESS_FULL_WORKBENCH
或
HYBRID_WEB_HARNESS
```

PR #5–#9 当时证明：

- stable Opportunity ID / Tool / ToolView；
- Research Job / Result / Replay / Cold Restart；
- `conversation.view` 可承载完整 Session-scoped Research Workspace；
- Agent Conversation 与 Research Workspace 可共存；
- stock sidebar 没有适合产品级一级导航的 additive router seam；
- Programming / Today / Opportunities / Publishing 等跨 Session 模块不应依附某个 Agent Session；
- private store / DOM hack / upstream patch 不可接受。

因此当时冻结：

```text
HYBRID_WEB_HARNESS
```

即独立 Web Shell 持有全局产品 IA，Harness 持有 Agent / Research inner surface。

## Historical Decision

当时的职责划分为：

```text
AI Editorial Desk Web Shell
→ Global IA / Today / Opportunities / Programming / Creation / Publication / Performance / Knowledge / Management

DeepSeek Harness
→ Agent Conversation / Tool / Job / Research Workspace / Session Replay

Editorial API / PostgreSQL
→ canonical business truth
```

并约束：

- business route 使用业务 ID；
- `harness_session_id` 仅为 runtime metadata；
- Shell 不访问 Harness private store；
- 不使用 DOM hack；
- Session 不是业务真相层；
- Shell 与 Harness 必须调用同一 Editorial API。

## 为什么被 supersede

PR #15 后验证了当时尚未验证的公开能力：

- pinned Harness root Slot 是 replacement seam；
- out-of-tree plugin 可在 editorial mode 下 shadow stock AppFrame；
- stock Harness workbench 在 Harness mode 下仍完整保留；
- 两个工作台可通过公开 additive slot 双向切换；
- 全过程无需 fork/patch upstream core。

因此“整个结构化 Product Shell 不能安全运行在 Harness Web 内”这一历史前提不再成立。

## Retained invariants

ADR-0010 继续保留本 ADR 的关键边界：

1. Editorial API / PostgreSQL 是 canonical business truth。
2. Harness Session / Job / Workspace ID 不得替代业务 ID。
3. Session 丢失必须支持业务 rehydrate。
4. 禁止 private store / DOM hack / upstream core patch。
5. Product UI 与 Harness Tool 不得复制 Domain Logic。
6. Harness compatibility 变化不得强迫业务 schema / semantics 跟随变化。

## Current decision

当前正式架构请阅读：

`ADR-0010-harness-native-product-shell.md`

活动 Contract：

`../04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`
