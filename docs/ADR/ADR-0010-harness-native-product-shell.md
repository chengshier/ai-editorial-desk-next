# ADR-0010 — Harness-native Product Shell

## Status
Accepted

## Context

ADR-0009 在 PR #5–#9 的证据下选择了 `HYBRID_WEB_HARNESS`：独立 AI Editorial Desk Web Shell 负责全局产品 IA，DeepSeek Harness 负责 Agent / Research surface。该决策当时是正确的，因为已验证的 additive seam 主要是 Session-scoped `conversation.view`，不足以证明 Harness 能无侵入承载整个结构化产品 Shell。

随后 PR #15 继续验证了另一条不修改 upstream core 的路径：利用 pinned Harness 已公开的 root Slot replacement seam，由 out-of-tree Product Shell Plugin 在 editorial 模式下 shadow stock AppFrame；在 Harness 模式下继续保留 stock workbench，并通过公开 additive slot 提供双向切换。Windows 本地验收与 exact-pin CI 均通过。

PR #16 进一步把 Today / Opportunities / Opportunity Inspector / Research Runtime Adapter 迁入正式 Product Shell，并验证 fresh Harness profile 在没有预建 Workspace 的情况下也能通过公开 `IWorkspaces` outward API 自举专用 runtime Workspace、创建/复用 Session 并完成 Research Case runtime binding。

这些新证据改变了“最终宿主”的技术事实，但没有改变业务真相与运行时真相的边界。

## Decision

当前最终产品宿主冻结为：

```text
DeepSeek Harness Web
├─ official Agent Runtime
├─ stock Harness workbench
└─ AI Editorial Desk Product Shell Plugin

Editorial API / PostgreSQL
└─ canonical business truth
```

具体规则：

1. AI Editorial Desk 的结构化产品 UI 以 out-of-tree Harness Product Shell Plugin 形式运行。
2. Product Shell 可通过公开 root Slot replacement seam 承载 Today / Opportunities / Research / Programming / Creation / Publication / Performance / Knowledge / Management 等全局业务模块。
3. stock Harness workbench 必须保留，用于自由 Agent / Session / Tool / Replay 工作，并与 Product Shell 双向切换。
4. 不修改 DeepSeek Harness upstream core；默认禁止 fork / private store / DOM hack。
5. `apps/web` 在 S4-N5 之前仅作为迁移参考与回归基线，不再是最终生产 Shell。
6. iframe、`surface_url`、`embedded` transport、`editorial_embed` / `editorial_launch` URL 宿主模式不再属于正式产品架构。
7. Product Shell 与 stock Harness workbench 都通过稳定 Editorial API / Tool contract 访问业务能力，不直接持有 PostgreSQL 真相。

## Identity and state

Canonical business IDs 仍为：

```text
opportunity_id
research_case_id
candidate_id
draft_id
publication_id
human_submission_id
```

Harness runtime IDs 仍仅为运行时 metadata：

```text
harness_session_id
harness_job_id
harness_workspace_id
```

业务对象不得以 Harness Session 生命周期作为创建、删除或唯一恢复条件。Research Case 在 Session 丢失时必须能重新绑定新 Session 并从 Editorial API rehydrate。

Product UI 的浏览器状态使用 `ed_*` namespaced state，不能把 Harness private route / view id 当成业务 URL 或业务主键。

## Research Runtime rule

正式 Research 链路为：

```text
Product Shell Research Case
→ HarnessRuntimeAdapter
→ Research Case ↔ Harness Session runtime binding
→ public ctx.sessions / ctx.workspaces
→ Session.prompt()
→ get_editorial_research_result
→ durable Harness Tool Result / replay
```

fresh Harness profile 不要求用户先进入 stock workbench 手工创建 Workspace。Runtime Adapter 必须只使用 pinned Harness 公开 outward API 完成可重复的 runtime bootstrap。

## Scheduler / headless rule

标准业务动作不能依赖用户进入聊天框手工 prompt。

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

Scheduler / Orchestrator 是 S4-N4 的正式下一 Gate。

## Consequences

1. `HYBRID_WEB_HARNESS` 保留为历史 Gate 结论，但不再是当前最终宿主。
2. ADR-0009 标记为 Superseded；其中 business ID、canonical truth、no-private-store/no-DOM-hack 等不变量继续有效。
3. 新的活动 Contract 为 `docs/04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`。
4. `docs/04_CONTRACTS/HYBRID_SHELL_CONTRACT.md` 仅保留为历史设计证据，不再指导新实现。
5. Harness 升级仍必须通过 exact-pin / compatibility Gate；breaking change 应收敛在 `integrations/harness`，不得推动 Domain/API schema 跟随变化。
6. Product Shell 功能达到等价后，S4-N5 必须收口 `apps/web`，避免双生产入口。

## Supersedes / Refines

- Supersedes ADR-0009 的“独立 Web Shell + Harness surface”最终宿主决定。
- Retains ADR-0009 的 canonical business truth、business ID、Session runtime metadata、public seam、no upstream patch 等边界。
- Refines ADR-0002：Harness 同时承载 Agent Runtime、stock Agent workbench 与 out-of-tree AI Editorial Desk Product Shell，但仍不是业务真相层。
