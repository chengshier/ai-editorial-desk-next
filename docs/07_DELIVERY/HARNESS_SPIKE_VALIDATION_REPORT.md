# Harness Integration Spike — Validation Report

> 状态：`AUTOMATED_RUNTIME_PASS / MANUAL_PENDING / LATEST_MAIN_REVALIDATION_PENDING`  
> Branch: `spike/harness-integration`  
> PR: #2

## 1. Validation Baseline

```text
Latest main sync target:
9dda16394541ffbb94be0c3d75e57da4b5ba6350

Latest automated functional head before main sync:
328b2cebb9f44e72e24eebcbd5ec5e594e312e6c

DeepSeek Harness:
99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release dsh@0.1.0-rc.7

Node 22.19.0
pnpm 11.7.0
```

本报告只记录实际验证结果。`CODE_REVIEW_PASS`、`BUILD_PASS`、`RUNTIME_PASS` 与 `MANUAL_UX_PASS` 必须区分；未执行项目写 `NOT_TESTED/PENDING`。

## 2. Latest automated evidence before main sync

GitHub Actions `Harness Spike`：

```text
run_id: 33725120622
job_id: 100552286359
head_sha: 328b2cebb9f44e72e24eebcbd5ec5e594e312e6c
conclusion: success
artifact: harness-spike-diagnostics-33725120622
artifact_id: 9881745168
artifact_digest: sha256:e6e34cf564348c34f1ce7c6e78e5adda37adc4c510ff2b8a8d8b4ffd6d2e3593
```

该 run 在 PR #2 同步最新 `main` 前已完整通过。同步 `main` 后必须再次跑 exact-head CI；在该 run 成功以前，本报告保持 `LATEST_MAIN_REVALIDATION_PENDING`。

## 3. Automated Validation

| Check | Status | Evidence |
|---|---|---|
| Python dev install | PASS | `Install Python dev dependencies` |
| Ruff | PASS | `Ruff` |
| Spike API pytest + health test | PASS | `Spike API tests` |
| exact Harness checkout | PASS | pinned commit checkout |
| pristine pinned dependency install | PASS | `pnpm install --frozen-lockfile` |
| complete pinned Harness Web runtime build | PASS | root `pnpm run build` |
| out-of-tree spike preparation | PASS | after pristine upstream build |
| Spike TypeScript / referenced contracts | PASS | `tsc -b ...editorial-spike...` |
| host/client bundle | PASS | spike bundle step |
| expected package artifacts | PASS | host/client JS + d.ts assertions |
| official profile plugin install | PASS | `dsh plugin --profile web add ...` |
| profile dependency + bundle activation | PASS | isolated web profile manifest assertion |
| FastAPI boot | PASS | `/healthz` readiness |
| Harness Web boot | PASS | `pnpm dsh web` + port 3080 readiness |
| Harness Tool list execution | PASS | `ctx.tools.execute(list_editorial_opportunities)` self-test |
| Harness Tool inspect execution | PASS | `ctx.tools.execute(inspect_editorial_opportunity)` self-test |
| Harness Tool error propagation | PASS | missing Opportunity must return `isError` |
| backend + Harness concurrent smoke | PASS | both remained alive through validation |
| diagnostics capture | PASS | Actions artifact uploaded |

### What this proves

```text
pinned pristine DeepSeek Harness
→ full upstream Web build
→ out-of-tree package
→ official profile plugin installation
→ Cordis/profile activation
→ FastAPI + Harness Web
→ Harness Tool registry/execution
→ Editorial Tool → FastAPI
→ typed/rendered result + error semantics
```

无需 fork / 修改 Harness upstream core。

这比单纯 HTTP smoke 多证明了一层：**我们的 Editorial Tool 确实进入 Harness 自身 Tool runtime，并通过 `ctx.tools.execute()` 成功访问 FastAPI。**

### What this does not prove

自动化不证明：
- 模型能从自然语言稳定选择 Tool；
- generic Opportunity Card 的真实浏览器 UX 已合格；
- Research Job 在真实 Agent Session 下的 live behavior；
- Conversation Node refresh/replay；
- Harness 能承担全部复杂业务 UI。

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
| restart does not affect domain truth | NOT_TESTED | dedicated runtime/manual validation still required |

## 6. UI Capability Matrix

| Capability | Status | Notes |
|---|---|---|
| Harness profile/plugin activation | AUTOMATED_PASS | official out-of-tree seam |
| Editorial Tool runtime execution | AUTOMATED_PASS | list/inspect/error self-test |
| Natural-language Tool selection | MANUAL_PENDING | model-driven validation required |
| Generic Opportunity card | MANUAL_PENDING | implementation builds; UX not accepted |
| Background Research Job | MANUAL_PENDING | implementation builds; agent runtime not exercised |
| Research Conversation Node | MANUAL_PENDING | implementation builds; live/replay pending |
| Replay | MANUAL_PENDING | event model implemented; browser replay pending |
| 50~200 Opportunity Radar | NOT_TESTED | second-layer UI validation |
| complex filters/grouping | NOT_TESTED | second-layer UI validation |
| Programming Slate | NOT_TESTED | second-layer UI validation |
| Performance Dashboard | NOT_TESTED | second-layer UI validation |

## 7. Decision Status

```text
HARNESS_AS_AGENT_RUNTIME: TECHNICALLY_VALIDATED
HARNESS_FULL_WORKBENCH:   NOT_DECIDED
HYBRID_WEB_HARNESS:       NOT_DECIDED
```

下一 Gate：

```text
model-driven Tool selection
→ Opportunity Card UX
→ Research live progress
→ Session refresh/replay
→ error/cancellation UX
→ 决定 Full Harness Workbench vs Hybrid
```

## 8. Remaining Work

- [x] Python Ruff / API pytest；
- [x] exact-pin pristine Harness dependency/full Web build；
- [x] out-of-tree profile/plugin install；
- [x] FastAPI + Harness Web concurrent boot；
- [x] Harness `ctx.tools.execute()` list/inspect/error runtime self-test；
- [x] diagnostics artifact；
- [ ] latest-main merge sync 后 exact-head revalidation；
- [ ] browser/model manual validation M1~M9；
- [ ] 根据实测更新 UI capability matrix；
- [ ] 必要时执行第二层 UI prototype；
- [ ] 最终 Spike conclusion / ADR；
- [ ] 决定 `HARNESS_FULL_WORKBENCH` 或 `HYBRID_WEB_HARNESS`。
