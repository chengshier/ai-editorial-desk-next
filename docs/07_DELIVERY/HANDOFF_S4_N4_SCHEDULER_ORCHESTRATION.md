# 新窗口交接 — S4-N4 Scheduler / Headless Orchestration

> 用途：把 AI Editorial Desk Next 当前正式状态完整交给新的 ChatGPT / Codex 项目窗口。  
> 仓库：`chengshier/ai-editorial-desk-next`  
> 当前开发分支：`feat/s4-harness-native-product-shell`  
> 当前 PR：#16 `feat: 启动 S4 Harness-native Product Shell 正式迁移`  
> PR #16 必须继续保持 Draft，未经用户明确要求不得合并。

---

## 1. 新窗口第一件事

不要只依赖本交接摘要。先读取分支最新事实：

1. `docs/CURRENT_STATE.md`
2. `docs/DECISIONS.md`
3. `docs/ADR/ADR-0010-harness-native-product-shell.md`
4. `docs/04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`
5. `docs/03_ARCHITECTURE/HARNESS_INTEGRATION.md`
6. `docs/03_ARCHITECTURE/HARNESS_RUNTIME_TOPOLOGY.md`
7. `docs/03_ARCHITECTURE/HARNESS_UI_STRATEGY.md`
8. `docs/07_DELIVERY/S4_HARNESS_NATIVE_PRODUCT_SHELL_MIGRATION.md`
9. PR #16 当前 diff / CI 状态

然后从 branch 最新 head 继续，不要从旧 PR #14 分支派生。

---

## 2. 当前最终架构：不要重新讨论 Hybrid / iframe

正式架构已经由 ADR-0010 冻结：

```text
DeepSeek Harness Web
├─ official Agent Runtime
├─ stock Harness workbench
└─ AI Editorial Desk Product Shell Plugin

Editorial API / PostgreSQL
└─ canonical business truth
```

正式 Product Shell：

```text
integrations/harness/editorial-shell-package
@ai-editorial-desk/harness-editorial-shell
```

关键结论：

- AI Editorial Desk 是 Harness-native out-of-tree Product Shell Plugin；
- editorial mode 使用 pinned Harness 公开 root Slot replacement seam；
- Harness mode 保留 stock Harness AppFrame/workbench；
- 两个工作台通过公开/additive seam 双向切换；
- 不 fork / patch DeepSeek Harness upstream core；
- `apps/web` 只保留为迁移 reference/regression baseline，S4-N5 收口；
- iframe / `surface_url` / `embedded` / `editorial_embed` / `editorial_launch` 已 superseded。

不要重新提出：

```text
独立 Web Shell
→ iframe Harness
→ launch descriptor / surface_url
```

那是 PR #14 的历史方向。

---

## 3. DeepSeek Harness exact baseline

```text
repo    deepseek-ai/deepseek-harness
commit  99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release dsh@0.1.0-rc.7
Node    22.19.0
pnpm    11.7.0
```

本地已知路径：

```text
Next repo
F:\newWorkSpace\ai-editorial-next\editorial-next

DeepSeek Harness
F:\newWorkSpace\ai-editorial-next\deepSeek-harness

Historical DSH_HOME
F:\newWorkSpace\ai-editorial-next\deepSeek-harness\.dsh-spike-home
```

当前本地端口基线：

```text
Editorial API  http://127.0.0.1:18000
Harness Web    http://127.0.0.1:3080
```

不要凭经验假设 Harness API。需要新的 Harness 能力时，读取 exact-pinned upstream 实际代码/contract。

---

## 4. 当前 S4 进度

```text
S4-N1 Product Shell Foundation           COMPLETE / CI PASS
S4-N2 Today / Opportunities Migration    COMPLETE / CI PASS
S4-N3 Research Runtime Adapter           COMPLETE / CI PASS
S4-N4 Scheduler / Headless Orchestration NEXT
S4-N5 Web Shell Retirement               NOT_STARTED
```

N1–N3 都在 PR #16 分支内。

---

## 5. N1 已完成

已建立正式 Product Shell Foundation：

- `@ai-editorial-desk/harness-editorial-shell`；
- public root Slot shadow stock AppFrame；
- stock Harness workbench 保留；
- Product ↔ Harness 双向切换；
- Editorial API base `18000`；
- exact-pin prepare / typecheck / bundle / isolated profile / browser Gate。

禁止倒退到 upstream patch/private store/DOM hack。

---

## 6. N2 已完成

Today / Opportunities 已正式迁入 Product Shell：

- Today；
- Opportunities Library；
- 搜索 / 筛选 / 排序；
- 卡片 / compact list；
- Opportunity Inspector；
- 五 Tab：概览 / 证据 / 研究 / 时间线 / 历史；
- Research Case 创建/复用；
- `ed_*` namespaced Product state；
- Product ↔ stock Harness 往返后状态恢复。

当前 transitional fixture 缺失的 Evidence / Timeline / Human Decision 不得伪造。

---

## 7. N3 已完成

正式 Research Runtime 链路：

```text
Product Shell Research Case
→ HarnessRuntimeAdapter
→ Research Case ↔ Harness Session runtime binding
→ public ctx.sessions / ctx.workspaces
→ Session.prompt()
→ get_editorial_research_result
→ durable Harness Tool Result / replay
```

重要文件：

```text
integrations/harness/editorial-shell-package/src/client/runtime-adapter.ts
integrations/harness/editorial-shell-package/src/research-tool.ts
apps/editorial_api/harness_runtime.py
tests/test_harness_runtime_adapter.py
tests/test_harness_editorial_shell_migration.py
tests/browser/harness-editorial-shell.cjs
.github/workflows/harness-editorial-shell.yml
```

已完成：

- runtime binding GET / bind / rebind / bootstrap-complete；
- 已绑定 Session 存在则复用；
- Session 丢失允许新 Session + same Research Case rebind；
- Product Shell 自动 `Session.prompt()`，不要求用户进入 Chat 手工 prompt；
- `get_editorial_research_result` 只读取既有 Research Case；
- 不迁入会重复创建 Case 的 `start_editorial_research`；
- durable structured Tool Result 出现后才 bootstrap complete；
- Session ID 仅为 runtime metadata。

---

## 8. N3 最后一个真实问题：fresh profile 没有 Workspace

Browser Gate 曾失败：

```text
Harness runtime binding ... did not acquire a Session
```

诊断真实错误：

```text
Harness has no Workspace available.
Register or open a Workspace before running Research.
```

这个错误前提已经修掉。正式 Product Shell 不能要求用户先进入 stock Harness 手工创建 Workspace。

当前实现：

```text
const EDITORIAL_RUNTIME_DIRECTORY = 'ai-editorial-desk-runtime'
```

通过 pinned public `IWorkspaces` outward API：

```text
listDirectory()
→ Host home
→ find/create ai-editorial-desk-runtime
→ create({ path }) Workspace
→ connectWorkspace()
→ Session
→ runtime binding
```

还包含并发创建目录后的 re-list/reuse 恢复逻辑。

禁止：

- browser 侧硬编码 Host filesystem path；
- 要求普通用户手工创建 Workspace 作为 Product 前置步骤；
- private API。

---

## 9. N3 CI 收口证据

N3 收口代码 head：

```text
5fcc37dd1800087f564abb0dea5a70d8dbf9662a
```

该 head workflow：

```text
CI                         run 34433230561  PASS
Harness Spike              run 34433230572  PASS
Harness Editorial Shell    run 34433230580  PASS
Harness Native Shell Spike run 34433230564  PASS
```

后续文档同步 commit 会产生新的 head；新窗口应先 `git fetch` / 读取 PR #16 最新 head，并确认新 head CI 仍绿。

不要把 N3 CI PASS 扩大解释为 production model/provider 内容质量已经全面验收。

---

## 10. 当前唯一主 Gate：S4-N4 Scheduler / Headless Orchestration

目标不是增加另一个聊天页面，而是让标准编辑任务可以主动执行：

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

最低功能：

- task definition；
- enable / disable；
- schedule / interval；
- event trigger；
- manual run now；
- Catch-up；
- retry / backoff；
- Last Run / Next Run；
- run history；
- idempotency / duplicate-run protection；
- timeout / cancellation policy；
- explicit failure reason；
- execution provenance；
- provider secret 不进入 browser state。

Today / Opportunity / Watch 等周期任务的产品目标是：**用户打开工作台时结果已经在那里**，不是每天手工叫 Agent 开始工作。

---

## 11. N4 开始前先做 upstream 审计，不要直接写代码

新窗口应先检查 exact-pinned Harness 当前正式的：

- SDK；
- JSON-RPC；
- ACP / headless runner；
- Session create/open/prompt/completion；
- Tool profile/plugin availability；
- process lifecycle；
- cancellation / timeout；
- structured errors；
- CLI/profile boot seam。

需要回答：

1. 服务端 Scheduler 最稳定的 outward execution seam 是什么？
2. 是否需要长期 Harness daemon，还是每次 run 可启动 headless process？
3. 如何把 Product business context 结构化传给 Agent，而不是靠 browser URL？
4. 如何识别一次 run 已完成？
5. 如何把 Harness runtime run/session/job ID 与 backend SchedulerRun 关联但不变成业务主键？
6. retry / cancellation 时怎样保证 Tool/API 幂等？

完成事实审计后再冻结 N4 Contract / schema。

---

## 12. N4 推荐最小 Vertical Slice

不要一次做完整调度平台。推荐顺序：

```text
N4-A Headless Execution Contract
→ N4-B Manual Run Now
→ N4-C Durable Task / Run model
→ N4-D Interval/Schedule trigger
→ N4-E Retry/Catch-up/history
→ N4-F Event trigger + Product status UI
```

第一个真实业务任务建议选一个当前 fixture 环境可验证、不会依赖尚未完成 Acquisition Provider 的动作，例如“针对既有 Research Case 执行 runtime rehydrate/research continuation”，先证明 Scheduler → Harness → Tool/API → Run history 的执行骨架。

不要拿真实 Acquisition 发现任务来掩盖 Phase 0.5-B 仍未完成的事实。

---

## 13. S4-N5 后续

N4 收口后进入：

```text
S4-N5 Web Shell Retirement
```

届时审计 `apps/web` 与 Product Shell 功能等价：

- 若无独立价值，删除；
- 若保留，只能明确标记 dev-preview/reference；
- 不允许两套生产入口。

---

## 14. PR 状态边界

### PR #16

当前正式工作 PR。继续保持 Draft，未经用户明确要求不要 merge / mark ready。

### PR #14

旧 iframe / embedded / `surface_url` 方向，已 superseded。

**DO NOT MERGE。**

只允许从中参考已经吸收到正式实现的：Session rebind / bootstrap / rehydrate / business-ID invariants。

---

## 15. 当前文档边界

活动文档：

```text
docs/ADR/ADR-0010-harness-native-product-shell.md
docs/04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md
docs/03_ARCHITECTURE/HARNESS_INTEGRATION.md
docs/03_ARCHITECTURE/HARNESS_RUNTIME_TOPOLOGY.md
docs/03_ARCHITECTURE/HARNESS_UI_STRATEGY.md
docs/07_DELIVERY/S4_HARNESS_NATIVE_PRODUCT_SHELL_MIGRATION.md
docs/CURRENT_STATE.md
```

历史文档：

```text
docs/ADR/ADR-0009-hybrid-web-shell-harness.md
docs/04_CONTRACTS/HYBRID_SHELL_CONTRACT.md
```

历史文档已经/应当带 `SUPERSEDED` 标识。不得把里面 iframe / launch descriptor 重新当成正式需求。

---

## 16. Transitional data limitation

当前 Today / Opportunities / Research 的一部分集成仍使用 deterministic / in-memory Spike fixture。

不得宣称：

- PostgreSQL Opportunity / Research persistence 已完成；
- deterministic mock 是 production research result；
- API restart 后内存 fixture 有正式 durable persistence；
- 真实外部 Acquisition 已完成。

S4 解决的是 Product Shell / Harness Runtime integration，不自动完成整个业务数据层。

---

## 17. Phase 0.5-B 仍独立开放

Acquisition Provider Spike 仍必须验证：

1. high-momentum discovery；
2. low/no-momentum but high-potential discovery；
3. community/non-official first discovery → reliable evidence follow-up。

HumanSubmission 不参加 Provider 胜负比较；它是产品自身 ingress。

---

## 18. 不变量清单

新窗口必须继续遵守：

- PostgreSQL / Editorial API = canonical business truth；
- Session / Job / Workspace = runtime metadata；
- business ID 不被 runtime ID 替代；
- Session 丢失不丢 Research Case；
- no upstream Harness core patch by default；
- no private store；
- no DOM navigation hack；
- no iframe/surface_url formal Product Shell；
- Product Shell / Harness Tool 不复制 Domain Logic；
- standard Product action 不要求 manual Chat prompt；
- Unknown != Fact；
- `single_source != confirmed`；
- Unavailable != 0；
- Human Decision append-only；
- Trend 不是 Discovery Gate；
- Human Submission 不是 positive label；
- Candidate 必须说明 Editorial Advantage。

---

## 19. 用户配合规则

目前不用让用户做本地测试。

先由新窗口完成 N4 upstream audit、Contract 和可自动验证的最小实现。只有遇到以下情况再明确告诉用户需要配合：

- 必须使用用户本地 Windows Harness 环境验证；
- GitHub Actions 无法覆盖的真实 provider/model 配置；
- Browser/OS process lifecycle 只能本地验证；
- 需要真实外部 API credential，但 credential 不应发到聊天或提交仓库。

届时给用户可直接复制执行的 PowerShell 命令，不要只说“请本地测试一下”。

---

## 20. 新窗口接手后的第一条执行指令

可以直接按下面做：

```text
读取 PR #16 最新 head、CURRENT_STATE、ADR-0010、HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT 和 S4 migration doc；确认最新 CI。
然后只进入 S4-N4，不改 N1-N3 已冻结架构。
先审计 exact-pinned deepseek-harness 的 SDK / JSON-RPC / ACP / headless execution outward API，给出事实矩阵和推荐 seam；基于审计结果冻结 N4 Scheduler/Orchestrator Contract，再实现最小 Manual Run vertical slice。
保持 PR #16 Draft，不合并 PR #14，不要求用户测试，除非自动化无法覆盖环境 Gate。
```
