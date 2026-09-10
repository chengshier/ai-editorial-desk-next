# S4 Harness-native Product Shell 正式迁移

## 决策

PR #15 已完成 exact-pin 自动化与 Windows 本地验收，正式证明以下路线可行：

```text
DeepSeek Harness Web
├─ official runtime
├─ stock Harness workbench
└─ AI Editorial Desk Product Shell Plugin

Editorial API / PostgreSQL
└─ canonical business truth
```

因此 S4 的正式方向为 **Harness-native Product Shell**。`apps/web -> iframe -> Harness` 不再作为最终产品架构。

活动 ADR：`../ADR/ADR-0010-harness-native-product-shell.md`  
活动 Contract：`../04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`

## 当前批次状态

```text
S4-N1 Product Shell Foundation           COMPLETE / CI PASS
S4-N2 Today / Opportunities Migration    COMPLETE / CI PASS
S4-N3 Research Runtime Adapter           COMPLETE / CI PASS
S4-N4 Scheduler / Headless Orchestration NEXT
S4-N5 Web Shell Retirement               NOT_STARTED
```

N3 收口验证 head：

```text
5fcc37dd1800087f564abb0dea5a70d8dbf9662a
```

该 head：CI / Harness Spike / Harness Editorial Shell / Harness Native Shell Spike 全部 PASS。

## 不变边界

1. AI Editorial Desk 是结构化业务产品；Harness 同时是 Product Shell Host、Agent Runtime 与 stock Agent workbench。
2. Opportunity / Research Case / Candidate / Draft / Publication 等业务对象由 Editorial API / PostgreSQL 持有。
3. Harness Session / Job / Replay / Workspace 是运行时对象，不得替代业务 ID。
4. 标准业务动作由 Product UI 或 Scheduler / Orchestrator 主动驱动 Harness，不要求用户进入 stock Chat 手工 prompt。
5. stock Harness workbench 继续保留，作为自由 Agent / Session 模式，并可与 AI Editorial Desk 双向切换。
6. 不修改 DeepSeek Harness upstream core；只使用公开 Client Plugin / Slot / Runtime / SDK / JSON-RPC seam。
7. `apps/web` 只在 S4-N5 前作为迁移 reference/regression baseline。

## PR #14 处理结论

PR #14 的 iframe 方向已被本决策 supersede，不直接合并。

继续吸收：

- `research_case_id ↔ harness_session_id` 是运行时绑定，不是业务主键替换；
- Session 丢失时允许创建/复用新 Session，并从 canonical Research Case rehydrate；
- 使用公开 `sessions / workspaces / Session.prompt()` outward API；
- bootstrap 必须幂等；
- Research Case 即使 runtime failure 也不得被视为业务对象丢失；
- launch/session/rebind/bootstrap 的测试思想。

明确废弃：

- `surface_url` 作为 Product UI 主接入；
- `embedded` transport；
- iframe Harness；
- `editorial_embed` / `editorial_launch` URL host 模式；
- 外部 `apps/web` 作为最终运行宿主。

## S4-N1 — Product Shell Foundation

**状态：COMPLETE / CI PASS**

已完成：

- 正式 `@ai-editorial-desk/harness-editorial-shell` 包；
- pinned Harness public root Slot Product Shell；
- stock AppFrame / workbench 保留；
- `sidebar.footer.action` 等公开 seam 双向切换；
- 统一 API Base `http://127.0.0.1:18000`；
- API failure/retry/runtime state；
- exact-pin typecheck / bundle / install / browser smoke。

## S4-N2 — Today / Opportunities Migration

**状态：COMPLETE / CI PASS**

已完成：

- Today / Opportunities 真实交互迁入 Product Shell；
- Opportunity 搜索、筛选、排序、卡片/紧凑列表；
- 概览 / 证据 / 研究 / 时间线 / 历史五 Tab Inspector；
- Research Case 创建/复用；
- `ed_*` namespaced Product state；
- Product ↔ stock Harness 往返后状态恢复；
- 不伪造缺失的 canonical Evidence / Timeline / Human Decision。

## S4-N3 — Research Runtime Adapter

**状态：COMPLETE / CI PASS**

正式链路：

```text
Product Shell Research Case
→ HarnessRuntimeAdapter
→ Research Case ↔ Harness Session runtime binding
→ public ctx.sessions / ctx.workspaces
→ Session.prompt()
→ get_editorial_research_result
→ durable Harness Tool Result / replay
```

已完成：

- runtime binding GET / bind / rebind / bootstrap-complete API；
- 已绑定 Session 存在则复用；丢失则获得新 Session 并 rebind；
- Product Shell 自动触发 Adapter，不要求用户去 Harness Chat 手工 prompt；
- 正式 Host Tool 只读取既有 Research Case，不重复创建 Case；
- bootstrap 只有 durable structured Tool Result 出现后才完成；
- Session ID 仅为 runtime metadata；
- Runtime failure 不删除 Research Case。

### N3 fresh-profile bootstrap

Browser Gate 暴露了真实问题：isolated Harness profile 可能没有任何 Workspace。

最终实现不要求用户手工准备，而是通过 pinned public `IWorkspaces`：

```text
listDirectory()
→ Host home
→ create/reuse ai-editorial-desk-runtime directory
→ create({path}) Workspace
→ connectWorkspace()
→ Session
→ bind Research Case
```

并包含并发创建目录后的 re-list/reuse 恢复逻辑。browser 侧不硬编码 Host filesystem path。

## S4-N4 — Scheduler / Headless Orchestration

**状态：NEXT**

目标：标准业务任务无需人工 Chat prompt。

正式执行图：

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

最低能力：

- enable / disable；
- schedule / interval；
- event trigger；
- manual run now；
- Catch-up；
- retry / backoff；
- Last Run / Next Run；
- run history；
- idempotency / duplicate-run protection；
- execution provenance；
- explicit failure state。

### N4 开始前必须先做

审计 exact-pinned Harness 当前公开的 SDK / JSON-RPC / ACP / headless execution API，明确：

- 如何创建/复用执行 Session；
- 如何发送 structured prompt/task；
- 如何等待 completion；
- Tool availability / profile selection；
- process/restart semantics；
- cancellation / timeout；
- error shape；
- 如何在服务端运行，而不依赖 browser private API。

不得凭经验猜测 upstream private contract。

## S4-N5 — Web Shell Retirement

**状态：NOT_STARTED**

在 Product Shell 达到所需功能等价前保留 `apps/web` 作为 migration reference/regression baseline。

达到 Gate 后：

- 删除；或
- 明确降级为 dev-preview/reference 壳。

禁止同时维护两套生产入口。

## Gate

每个 Harness 相关批次必须独立通过：

```text
Python / baseline CI
Harness exact-pin typecheck
Harness bundle
isolated profile install
browser smoke
business ID invariants
fresh-profile behavior where relevant
no upstream core patch
```

## 当前未被 S4 自动解决的事项

S4 是 Product Shell / Runtime migration，不等于完成全部产品数据层。

仍然不得宣称：

- PostgreSQL Opportunity / Research 正式 persistence 已完整落地；
- deterministic/in-memory Spike fixture 是 production data；
- 真实外部 Acquisition 已完成；
- production model/provider 的内容质量已经全面验收。

Phase 0.5-B Acquisition Provider Spike 继续独立推进。
