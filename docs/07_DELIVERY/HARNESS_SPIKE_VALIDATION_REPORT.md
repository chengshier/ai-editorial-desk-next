# Harness Integration Spike — Validation Report

> 状态：`AUTOMATED_RUNTIME_PASS / EXACT_HEAD_PASS / READY_TO_MERGE / MANUAL_UX_FOLLOW_UP`  
> Branch: `spike/harness-integration`  
> PR: #2

## 1. Validation Baseline

```text
Latest main sync target:
9dda16394541ffbb94be0c3d75e57da4b5ba6350

Exact-head validated commit:
3681e4e3e5161cf6716eaf9436a1e0161d8d4681

DeepSeek Harness:
99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release dsh@0.1.0-rc.7

Node 22.19.0
pnpm 11.7.0
```

本报告只记录实际验证结果。`CODE_REVIEW_PASS`、`BUILD_PASS`、`RUNTIME_PASS` 与 `MANUAL_UX_PASS` 必须区分；未执行项目继续写 `NOT_TESTED/PENDING`，不得因 PR 可合并而冒充人工 UX 已通过。

## 2. Exact-head automated evidence

PR #2 同步最新 `main` 后，两个 workflow 均在同一 exact head 上通过：

```text
Harness Spike
run_id:     33725911984
job_id:     100554708800
head_sha:   3681e4e3e5161cf6716eaf9436a1e0161d8d4681
conclusion: success

CI
run_id:     33725911979
job_id:     100554708417
head_sha:   3681e4e3e5161cf6716eaf9436a1e0161d8d4681
conclusion: success
```

Harness diagnostics artifact：

```text
name:      harness-spike-diagnostics-33725911984
artifact:  9882027307
size:      38591 bytes
digest:    sha256:6835ce21b677749fa5f2b948648dc5711e15da369e1ccef56cf9d512fe43b446
```

因此此前的 `LATEST_MAIN_REVALIDATION_PENDING` 已正式关闭。

## 3. Automated Validation

| Check | Status | Evidence |
|---|---|---|
| Standard Python CI | PASS | run `33725911979` / job `100554708417` |
| Python dev install | PASS | `Install Python dev dependencies` |
| Ruff | PASS | `Ruff` |
| Spike API pytest + health test | PASS | `Spike API tests` |
| exact Harness checkout | PASS | pinned commit checkout |
| pristine pinned dependency install | PASS | `pnpm install --frozen-lockfile` |
| complete pinned Harness Web runtime build | PASS | root `pnpm run build` |
| out-of-tree spike preparation | PASS | after pristine upstream build |
| Spike TypeScript / referenced contracts | PASS | TypeScript project build |
| host/client bundle | PASS | spike bundle step |
| expected package artifacts | PASS | host/client JS + d.ts assertions |
| official profile plugin install | PASS | `dsh plugin --profile web add ...` |
| profile dependency + bundle activation | PASS | isolated web profile assertion |
| FastAPI boot | PASS | `/healthz` readiness |
| Harness Web boot | PASS | `pnpm dsh web` + port 3080 readiness |
| Harness Tool list execution | PASS | `ctx.tools.execute(list_editorial_opportunities)` self-test |
| Harness Tool inspect execution | PASS | `ctx.tools.execute(inspect_editorial_opportunity)` self-test |
| Harness Tool error propagation | PASS | missing Opportunity returns `isError` |
| backend + Harness concurrent smoke | PASS | both remain alive through validation |
| diagnostics capture | PASS | Actions artifact `9882027307` |

### What this proves

```text
pinned pristine DeepSeek Harness
→ full upstream Web build
→ out-of-tree package
→ official profile/plugin installation
→ Cordis/profile activation
→ FastAPI + Harness Web
→ Harness Tool registry/execution
→ Editorial Tool → FastAPI
→ typed/rendered result + error semantics
```

无需 fork / 修改 Harness upstream core。

这比单纯 HTTP smoke 多证明了一层：**Editorial Tool 已进入 Harness 自身 Tool runtime，并通过 `ctx.tools.execute()` 成功访问 FastAPI。**

### What this does not prove

自动化仍不证明：
- 模型能从自然语言稳定选择 Tool；
- generic Opportunity Card 的真实浏览器 UX 已合格；
- Research Job 在真实 Agent Session 下的 live behavior；
- Conversation Node refresh/replay；
- Harness 能承担全部复杂业务 UI。

这些是产品/交互 Gate，不再作为本 PR 技术集成代码的 merge blocker。

## 4. Manual Runtime Validation

| ID | Scenario | Status | Expected evidence |
|---|---|---|---|
| M1 | Natural language → list tool | NOT_TESTED | Model-driven Tool call + Opportunity ids |
| M2 | Follow-up inspect | NOT_TESTED | stable `opportunity_id` through dialogue |
| M3 | Opportunity Tool Card | NOT_TESTED | readable Angle/Theme/Promise/Unknown |
| M4 | start research | NOT_TESTED | backend `research_case_id` + Harness `job_id` |
| M5 | live research progress | NOT_TESTED | start/progress/end visible in Conversation Node |
| M6 | refresh/replay | NOT_TESTED | same final Research Node after reload |
| M7 | new Session reconstruction | NOT_TESTED | Opportunities reload from Backend |
| M8 | API unavailable/error | NOT_TESTED | explicit browser error; no fake empty result |
| M9 | cancel research job | NOT_TESTED | cancelled job + terminal event visible |

人工 Gate 在 PR #2 合并后继续执行，并用于决定 `HARNESS_FULL_WORKBENCH` / `HYBRID_WEB_HARNESS`；它不改变本次已经成立的 Agent Runtime 技术结论。

## 5. Architecture Boundary Validation

| Invariant | Status | Note |
|---|---|---|
| Harness does not access PostgreSQL directly | CODE_REVIEW_PASS | Tool only calls FastAPI |
| Session is not business truth | CODE_REVIEW_PASS | events carry replay presentation facts |
| `research_case_id != job_id` | CODE_REVIEW_PASS | separate ids/ownership |
| no upstream core patch | RUNTIME_PASS | pristine build + official plugin seam |
| canonical Tool value separated from presentation | RUNTIME_PASS | schema/render/presentationMeta exercised by Tool runtime |
| API and Harness independently booted | RUNTIME_PASS | separate processes in CI |
| list/inspect Tool → API boundary | RUNTIME_PASS | direct `ctx.tools.execute()` |
| replay UI avoids live I/O | CODE_REVIEW_PASS | node folds durable events |
| restart does not affect domain truth | NOT_TESTED | manual/runtime follow-up still required |

## 6. UI Capability Matrix

| Capability | Status | Notes |
|---|---|---|
| Harness profile/plugin activation | AUTOMATED_PASS | official out-of-tree seam |
| Editorial Tool runtime execution | AUTOMATED_PASS | list/inspect/error self-test |
| Natural-language Tool selection | MANUAL_PENDING | model-driven validation required |
| Generic Opportunity card | MANUAL_PENDING | implementation builds; UX not accepted |
| Background Research Job | MANUAL_PENDING | implementation builds; agent runtime behavior pending |
| Research Conversation Node | MANUAL_PENDING | implementation builds; live/replay pending |
| Replay | MANUAL_PENDING | event model implemented; browser replay pending |
| 50~200 Opportunity Radar | NOT_TESTED | second-layer UI validation |
| complex filters/grouping | NOT_TESTED | second-layer UI validation |
| Programming Slate | NOT_TESTED | second-layer UI validation |
| Performance Dashboard | NOT_TESTED | second-layer UI validation |

## 7. Final Spike Conclusion

```text
HARNESS_AS_AGENT_RUNTIME: ACCEPTED_AS_V1_TECHNICAL_BASELINE
HARNESS_FULL_WORKBENCH:   DEFERRED_TO_MANUAL_UX_GATE
HYBRID_WEB_HARNESS:       DEFERRED_TO_MANUAL_UX_GATE
```

PR #2 已经回答本次技术 Spike 的核心问题：

1. exact-pin Harness 能否在 pristine upstream 上完整构建并启动：**能**；
2. out-of-tree package 能否通过官方 profile/plugin seam 加载：**能**；
3. Harness Tool runtime 能否真正调用我们的 FastAPI：**能**；
4. 是否需要 patch/fork Harness core 才能成立：**当前不需要**；
5. 复杂 Workbench 是否全部放进 Harness：**仍未决定，必须由人工 UX Gate 决定**。

因此：**PR #2 技术范围完成，可合并。**

## 8. Post-merge Follow-up

- [x] Python Ruff / API pytest；
- [x] exact-pin pristine Harness dependency/full Web build；
- [x] out-of-tree profile/plugin install；
- [x] FastAPI + Harness Web concurrent boot；
- [x] Harness `ctx.tools.execute()` list/inspect/error runtime self-test；
- [x] diagnostics artifact；
- [x] latest-main sync 后 exact-head `Harness Spike` revalidation；
- [x] latest-main sync 后 exact-head standard `CI`；
- [ ] browser/model manual validation M1~M9；
- [ ] 根据实测更新 UI capability matrix；
- [ ] 必要时执行第二层 UI prototype；
- [ ] 新 ADR 冻结 `HARNESS_FULL_WORKBENCH` 或 `HYBRID_WEB_HARNESS`。
