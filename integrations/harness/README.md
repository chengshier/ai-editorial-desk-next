# DeepSeek Harness Integration

本目录保存 AI Editorial Desk 对 DeepSeek Harness 的 out-of-tree 集成层，不 vendoring Harness upstream。

## 当前冻结原则

- Harness = Product Shell Host + stock Agent Workbench + Agent/Session/Tool/Job/Approval runtime。
- AI Editorial Desk 正式结构化 UI = Harness-native Product Shell Plugin。
- Editorial API / PostgreSQL = canonical business truth。
- 首选公开 plugin / profile / bundle / Slot / Client Runtime / SDK / JSON-RPC seam；默认禁止 patch upstream core。
- Harness 处于 Developer Preview，必须 pin version/commit，并通过 compatibility adapter 隔离 breaking changes。
- Session / Job / Workspace ID 是 runtime metadata，不得替代业务 ID。

## 必读

- `docs/ADR/ADR-0010-harness-native-product-shell.md`
- `docs/03_ARCHITECTURE/HARNESS_INTEGRATION.md`
- `docs/03_ARCHITECTURE/HARNESS_RUNTIME_TOPOLOGY.md`
- `docs/04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`
- `docs/07_DELIVERY/S4_HARNESS_NATIVE_PRODUCT_SHELL_MIGRATION.md`

旧的 `HYBRID_SHELL_CONTRACT.md` 与 ADR-0009 仅用于历史追溯。

## Exact Pin

```text
DeepSeek Harness commit
99f6f02fecdb7dff40c3fbc9470f5907c29f74ca

dsh release
0.1.0-rc.7

Node
22.19.0

pnpm
11.7.0
```

## 当前目录角色

```text
integrations/harness/
├─ HARNESS_PIN.json
├─ editorial-shell-package/       # 正式 Product Shell
├─ native-shell-spike-package/    # PR #15 架构验证证据
├─ spike-package/                 # 早期 Tool/Research/Replay 验证证据
└─ scripts/
   ├─ prepare_editorial_shell.py
   ├─ prepare_native_shell_spike.py
   └─ prepare_spike.py
```

正式新功能优先进入 `editorial-shell-package`。Spike packages 保留为 compatibility / architecture evidence，不继续承担正式业务功能。

## 正式 Product Shell

包：

```text
@ai-editorial-desk/harness-editorial-shell
```

当前已经迁入：

- Harness root Slot Product Shell；
- stock Harness workbench 双向切换；
- Today；
- Opportunities；
- Opportunity Inspector 五 Tab；
- Research Case 创建/复用；
- `ed_*` namespaced Product state；
- HarnessRuntimeAdapter；
- Research Case ↔ Session binding/rebind/bootstrap；
- `get_editorial_research_result` Host Tool；
- fresh profile runtime Workspace bootstrap。

## Fresh profile bootstrap

完全新的 isolated profile 可能没有 Workspace。正式 Product Shell 不要求用户手工准备：

```text
ctx.workspaces.listDirectory()
→ Host home
→ create/reuse ai-editorial-desk-runtime
→ ctx.workspaces.create({path})
→ connectWorkspace()
→ Session
→ Research Case binding
```

只使用 pinned Harness 公开 outward API。

## 本地正式 Product Shell 验证顺序

本地路径示例：

```text
Next repo   F:\newWorkSpace\ai-editorial-next\editorial-next
Harness     F:\newWorkSpace\ai-editorial-next\deepSeek-harness
```

原则上与 `.github/workflows/harness-editorial-shell.yml` 保持同序：

```text
1. checkout exact pinned Harness
2. pristine Harness install/build
3. prepare_editorial_shell.py
4. reconcile workspace
5. Product Shell typecheck
6. Product Shell bundle
7. install through official profile/plugin seam
8. boot Editorial API :18000
9. boot Harness Web :3080
10. browser Gate
```

具体命令以当前 workflow 为准，不复制过期的 Spike 端口/命令到正式流程。

## 已证明的 N3 Gate

在 PR #16 head `5fcc37dd1800087f564abb0dea5a70d8dbf9662a`：

```text
CI                         PASS
Harness Spike              PASS
Harness Editorial Shell    PASS
Harness Native Shell Spike PASS
```

正式 Browser Gate 已证明 fresh profile 无 Workspace 时仍能自动获得 Harness Session binding；不需要先进入 stock Harness 手工创建 Workspace。

## 下一 Gate：S4-N4

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ Harness SDK / JSON-RPC / Runtime Adapter
→ Agent / Tool / Job
→ Editorial API / PostgreSQL
→ Product Shell
```

至少需要 enable/disable、schedule/interval、event/manual trigger、Catch-up、retry、Last Run / Next Run、run history 与幂等保护。

标准业务动作不能要求用户进入 Chat 手工 prompt。

## 禁止项

- fork/patch Harness upstream core；
- private Harness store；
- DOM navigation hack；
- iframe / `surface_url` / `embedded` 作为正式 Product Shell host；
- Product Shell 直接读写 PostgreSQL；
- Session log 作为唯一业务数据库；
- 把 deterministic/in-memory Spike fixture 宣称为 production persistence。
