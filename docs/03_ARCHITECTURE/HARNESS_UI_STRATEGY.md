# Harness UI Strategy v2

## 1. 当前最终决定

PR #15 的 exact-pin CI 与 Windows 本地验收证明，AI Editorial Desk 可以不修改 DeepSeek Harness upstream core，直接以 out-of-tree Product Shell Plugin 的方式承载完整结构化产品工作台。

因此当前正式 UI 宿主冻结为：

```text
HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL
```

对应拓扑：

```text
DeepSeek Harness Web
├─ AI Editorial Desk Product Shell
└─ stock Harness workbench
```

ADR-0009 的 `HYBRID_WEB_HARNESS` 是 PR #5–#9 阶段基于当时证据作出的历史 Gate 结论，已由 ADR-0010 supersede。

## 2. 为什么决策发生变化

PR #5–#9 当时确认：

- `conversation.view` 可承载 Session-scoped Research Workspace；
- stock sidebar 缺少适合整个编辑产品一级导航的 additive seam；
- 不允许为了全局 IA 使用 private store / DOM hack / upstream patch。

所以当时选择外部 Web Shell 是合理的。

PR #15 随后验证了不同的公开 seam：

- pinned Harness `root` 是 replacement Slot；
- out-of-tree plugin 可以在 editorial mode 下以更高优先级/稳定优先级替换 stock AppFrame；
- Harness mode 仍保留 stock AppFrame；
- `sidebar.footer.action` 等 additive slot 可以承载双向工作台切换；
- 整个方案无需 fork/patch upstream core。

这条新证据消除了 ADR-0009 当时最大的宿主限制。

## 3. Product Shell 必须承担的交互

- Global IA / Primary Navigation；
- Today / Editorial Radar；
- Opportunities Library；
- Opportunity Inspector；
- Research business entry / status；
- Scheduler / Headless Task/Run status；
- Programming / Slate；
- Creation / Draft Studio；
- Publication Center；
- Performance & Learning；
- Knowledge / Management；
- Global Search / Human Submission；
- structured Product Commands。

这些模块属于跨 Session 的长期业务工作台，不能把 active Harness Session 当成它们的唯一生命周期。

## 4. stock Harness workbench 必须保留

stock Harness 继续承担：

- 自由 Agent 对话；
- Session / Replay / Trajectory；
- Tool / ToolView；
- Background Job；
- Approval / guarded action；
- 调试和非结构化 Agent 任务。

Product Shell 与 stock workbench 是同一 Harness Web 下的两个一等表面，不是互相 iframe。

## 5. Research 特殊边界

Research 的业务身份仍是：

```text
research_case_id
```

Harness 负责 runtime interaction：

```text
Harness Session
Tool / Job
Session.prompt()
durable Tool Result / replay
```

Editorial API / PostgreSQL 负责：

```text
Research Case
Evidence
Unknown
Conclusion / canonical result
Scheduler Task / Run / Attempt
```

Product Shell 通过 `HarnessRuntimeAdapter` 把两层连接起来；Scheduler 状态由 Editorial API 的只读投影提供，不从 Harness transcript 推断。

## 6. Conversation View 使用边界

`conversation.view` 仍然是有效的 Session-scoped UI seam，适合：

- Research replay；
- Agent trajectory；
- 明确属于当前 Session 的复杂视图。

但它不再被用来决定整个产品是否能够运行在 Harness 内。全局 Product Shell 由 root Slot replacement seam 承载。

## 7. Fresh profile UX

用户首次打开一个完全新的 Harness profile 时，不应被要求先进入 stock workbench 手工创建 Workspace。

Research Runtime Adapter 只使用 exact-pin Harness 的公开 `IWorkspaces` outward API，但必须尊重 Host 实际组合的目录选择能力。`browse` 与 `native` 是互斥能力，不能假设所有 Host 都支持 `listDirectory()` / `createDirectory()`。

优先自动路径：

```text
fresh profile + browse capability
→ Host home
→ ai-editorial-desk-runtime directory
→ Workspace registration
→ Session
→ Research Case runtime binding
```

Windows 等只组合 native picker 的 Host：

```text
fresh profile + native capability
→ browse API 返回 directory-picker-unavailable
→ Product Shell 调用公开 pickDirectory()
→ 用户在系统目录选择器中选择一个已有目录
→ Workspace registration
→ Session
→ Research Case runtime binding
```

因此“无需手工准备 Workspace”的含义是：用户不需要先切到 stock Harness 建 Workspace，也不需要知道 Harness 的 Workspace 配置流程。native-only Host 允许 Product Shell 在首次 Research 时主动弹出一次系统目录选择器；取消选择必须显式失败，并保留已经创建的 Research Case。

不得为绕过 native/browse 差异而硬编码本机路径、访问 Harness private API、使用 DOM 自动化或修改 upstream core。

## 8. 禁止项

- iframe 作为正式 Product Shell Host；
- `surface_url` / `embedded` transport 作为正式 UI seam；
- `editorial_embed` / `editorial_launch` URL 宿主模式；
- `document.querySelector(...).click()` 跨模块导航；
- 直接访问 Harness private store；
- 为 Product Shell fork/patch Harness upstream core；
- 用 Harness Session ID 替代业务 ID；
- 把 Candidate / Decision / Draft / Publication 真相只写进 Session；
- 用 browser/localStorage/Harness transcript 作为 Scheduler Task / Run truth；
- 在没有 durable Scheduler 状态时伪造后台执行结果；
- 把 `apps/web` 恢复为第二个 production Product Shell。

## 9. 当前 Gate

```text
S4-N1 Product Shell Foundation           COMPLETE
S4-N2 Today / Opportunities Migration    COMPLETE
S4-N3 Research Runtime Adapter           COMPLETE
S4-N4 Scheduler / Headless Orchestration COMPLETE / CI PASS
  N4-A exact-pin audit + Contract        COMPLETE
  N4-B Manual Run vertical slice         COMPLETE
  N4-C Durable Task / Run model          COMPLETE
  N4-D Interval / Schedule trigger       COMPLETE
  N4-E Retry / Catch-up / History        COMPLETE
  N4-F Event trigger + Product status UI COMPLETE
S4-N5 Web Shell Retirement               COMPLETE / CI PASS
S4 Engineering                           COMPLETE / CI PASS
Windows final local smoke                PENDING
```

N4 已在 head `06ca19f629d22b39f28948c11ac10744feafa04b` 完成四套 Gate；N5 / S4 工程收口已在 head `280e7c9b2ba3a9bf7019b94b85e4acf0d4c213f6` 完成 CI #268、Harness Spike #222、Harness Editorial Shell #130、Harness Native Shell Spike #136 四套 Gate。

Windows final smoke 随后发现 fresh profile 在 native directory-picker composition 下仍错误调用 browse-only `listDirectory()`，现已作为 S4 合并前兼容性修复处理；S4 架构决策本身不重开，最终 smoke 在该修复通过 CI 后继续。

`apps/web` 当前定义为：

```text
RETIRED_AS_PRODUCTION_HOST
MIGRATION_REFERENCE_ONLY
```

正式 Product acceptance 继续由 exact-pin Harness Product Shell browser / native-shell Gate 承担。PR #16 合并前仍需完成 Windows 本地最终 smoke。

## 10. 依据

- `../ADR/ADR-0010-harness-native-product-shell.md`
- `../04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`
- `../04_CONTRACTS/SCHEDULER_ORCHESTRATION_CONTRACT.md`
- `../07_DELIVERY/S4_HARNESS_NATIVE_PRODUCT_SHELL_MIGRATION.md`
- `../07_DELIVERY/S4_N5_WEB_SHELL_RETIREMENT_AUDIT.md`
- `HARNESS_INTEGRATION.md`
- `HARNESS_RUNTIME_TOPOLOGY.md`
