# Harness Integration Spike — Validation Report

> 状态：`AUTOMATED_PASS / MANUAL_PENDING`  
> Branch: `spike/harness-integration`  
> PR: #2  
> 自动化验证功能 Head: `7602e02253cd0c005f83a24eb16ab67b163e9e6d`

## 1. Validation Baseline

```text
AI Editorial Desk Next base:
a8b092e966a379614dc884de5a60f92b72578295

DeepSeek Harness:
99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release dsh@0.1.0-rc.7

Node 22.19.0
pnpm 11.7.0
```

本报告只记录实际验证结果；未执行项目必须写 `NOT_TESTED` / `PENDING`，不得从代码存在推导为 PASS。

本次自动化证据来自 GitHub Actions `Harness Spike`：

```text
run_id: 33710554610
job_id: 100508899285
head_sha: 7602e02253cd0c005f83a24eb16ab67b163e9e6d
conclusion: success
artifact: harness-spike-diagnostics-33710554610
artifact_id: 9876799924
artifact_digest: sha256:abd6c01d305dfb958c6a1cbebba9ed38d703b1b51024a5d3731fc8d7dc991c39
```

该 run 是当前集成代码的 exact-head 自动化验证。后续若仅修改本报告且 workflow path filter 未触发，不应把“报告提交没有新 run”误判成集成代码未验证。

## 2. Automated Validation

| Check | Status | Evidence |
|---|---|---|
| Editorial API install | PASS | job step `Install Editorial API` |
| Ruff | NOT_TESTED | 当前 `Harness Spike` workflow 未执行 Ruff；不得推导为 PASS |
| Backend pytest | NOT_TESTED | 当前 `Harness Spike` workflow 未执行 pytest；不得推导为 PASS |
| exact Harness checkout | PASS | checkout `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` |
| pristine pinned Harness dependency install | PASS | `pnpm install --frozen-lockfile` |
| complete pinned Harness Web runtime build | PASS | job step `Build complete pristine pinned Harness runtime` |
| out-of-tree spike preparation | PASS | only after pristine upstream build |
| Spike TypeScript / referenced contracts | PASS | `tsc -b packages/client/editorial-spike/tsconfig.json` |
| host/client bundle | PASS | `pnpm --filter @ai-editorial-desk/harness-spike run bundle` |
| expected package artifacts | PASS | host/client JS + d.ts assertions |
| official profile plugin install | PASS | `dsh plugin --profile web add ./packages/client/editorial-spike` |
| profile dependency activation | PASS | web profile manifest contains dependency + bundle |
| FastAPI boot | PASS | `127.0.0.1:8000/healthz` readiness + API request |
| Harness Web boot | PASS | `pnpm dsh web` + `127.0.0.1:3080/` readiness |
| backend + Harness concurrent smoke | PASS | both processes remained alive through validation |
| Opportunity REST smoke | PASS | `/api/v1/spike/opportunities` returned non-empty response |
| diagnostics capture | PASS | artifact `harness-spike-diagnostics-33710554610` uploaded |

### 2.1 What the automated PASS actually proves

自动化已经证明下面这条技术链路可工作：

```text
pinned pristine DeepSeek Harness
→ full upstream Web build
→ our out-of-tree package
→ official profile plugin installation
→ Cordis/profile bundle activation
→ FastAPI boundary boot
→ Harness Web boot
→ HTTP readiness / Opportunity API smoke
```

并且不需要 fork / 修改 Harness upstream core。

### 2.2 Important build finding

早期失败已定位为 pinned Harness Web 运行产物未完整构建，而不是我们的插件本身失败。仅构建 Host/TypeScript contract 不足以启动完整 `web` profile；必须先对 pristine pinned Harness 执行完整 root build，再准备并安装 out-of-tree spike package。

因此当前兼容流程固定为：

```text
checkout exact pin
→ pnpm install --frozen-lockfile
→ pnpm run build              # pristine upstream full Web runtime
→ prepare spike package
→ reconcile workspace
→ typecheck / bundle spike
→ dsh plugin --profile web add ...
→ boot API + Harness Web
```

这属于集成层/CI 约束，不是对 Harness core 的补丁。

## 3. Manual Runtime Validation

以下项目仍然必须在真实浏览器 + Harness Model / Session 环境中验证，不能由 HTTP boot smoke 代替。

| ID | Scenario | Status | Expected evidence |
|---|---|---|---|
| M1 | Natural language → list tool | NOT_TESTED | Tool call + returned Opportunity ids |
| M2 | Follow-up inspect | NOT_TESTED | stable `opportunity_id` propagated |
| M3 | Opportunity Tool Card | NOT_TESTED | readable Angle/Theme/Promise/Unknown |
| M4 | start research | NOT_TESTED | backend `research_case_id` + Harness `job_id` |
| M5 | live research progress | NOT_TESTED | start/progress/end visible in Conversation Node |
| M6 | refresh/replay | NOT_TESTED | same final Research Node after reload |
| M7 | new Session reconstruction | NOT_TESTED | Opportunities reload from Backend, not old Session |
| M8 | API unavailable/error | NOT_TESTED | explicit error, no fake empty result |
| M9 | cancel research job | NOT_TESTED | job cancelled; terminal event visible |

## 4. Architecture Boundary Validation

| Invariant | Status | Note |
|---|---|---|
| Harness does not access PostgreSQL directly | CODE_REVIEW_PASS | Spike Tool only calls FastAPI |
| Harness Session is not business truth | CODE_REVIEW_PASS | Session events contain replay presentation facts only |
| `research_case_id != job_id` semantics | CODE_REVIEW_PASS | Separate fields and ownership |
| no upstream core patch | RUNTIME_PASS | pristine upstream full build + official profile plugin seam boots successfully |
| canonical Tool value separated from UI presentation | CODE_REVIEW_PASS | `output.schema/render/presentationMeta` |
| replay UI avoids live I/O | CODE_REVIEW_PASS | Conversation Node folds durable Session events |
| API and Harness are independently booted processes | RUNTIME_PASS | workflow starts FastAPI and Harness separately, then checks both |
| restart does not affect domain truth | NOT_TESTED | restart/reconnect behavior still requires dedicated runtime/manual validation |

`CODE_REVIEW_PASS` 不等于 runtime PASS；对应运行行为仍由 Manual Gate 验证。

## 5. UI Capability Matrix

| Capability | Status | Notes |
|---|---|---|
| Agent conversation | MANUAL_PENDING | Harness native capability;本 Spike 尚未完成真实模型对话验证 |
| Editorial Tool registration / profile activation | AUTOMATED_PASS | out-of-tree bundle is installed and activated in `web` profile |
| Natural-language Editorial Tool selection | MANUAL_PENDING | needs model-driven browser validation |
| Generic Opportunity card | MANUAL_PENDING | implemented; actual visual/interaction quality not yet accepted |
| Background Research Job | MANUAL_PENDING | implemented; live job behavior still needs browser/runtime validation |
| Research Conversation Node | MANUAL_PENDING | implemented; replay rendering still needs browser validation |
| Replay | MANUAL_PENDING | event model implemented, actual refresh/session replay not yet accepted |
| Approval UX | NOT_TESTED | not required for first A/B/C chain |
| 50~200 Opportunity Radar | NOT_TESTED | second-layer UI validation |
| complex filters/grouping | NOT_TESTED | second-layer UI validation |
| Programming Slate | NOT_TESTED | second-layer UI validation |
| Performance Dashboard | NOT_TESTED | second-layer UI validation |

## 6. Compatibility / Maintenance Risks

1. Harness 当前为 Developer Preview，Tool / Jobs / Client plugin / Conversation Node contract 可能 breaking。
2. out-of-tree client package 仍需针对 pinned Harness build；升级 Harness 必须重新跑 exact-pin compatibility CI。
3. 完整 Harness Web 启动依赖 pristine pinned upstream 的 full root build；不能用局部 Host build 代替产品级 Web smoke。
4. 业务 API contract 不得跟随 Harness 内部类型变化；变化应收敛在 `integrations/harness` compatibility layer。
5. Generic Tool Card 与 Conversation Node 能否满足最终产品信息密度，需要真实 UX 验证。
6. Complex Radar / Programming / Performance UI 是否适合完全放在 Harness 内，当前没有证据。

## 7. Decision Status

```text
HARNESS_AS_AGENT_RUNTIME:     TECHNICALLY_VALIDATED
HARNESS_FULL_WORKBENCH:       NOT_DECIDED
HYBRID_WEB_HARNESS:           NOT_DECIDED
```

当前证据已经足够回答一个问题：**Harness 可以通过官方 out-of-tree profile/plugin seam 承载我们的 Agent/Tool 集成，并与独立 FastAPI Editorial Intelligence 边界共同运行。**

但这仍不能回答第二个问题：**Harness 是否适合承担 AI Editorial Desk 全部复杂产品界面。**

因此下一 Gate 不再是“能不能把 Harness 跑起来”，而是：

```text
真实 Agent Tool selection
→ Opportunity Card 信息密度与交互
→ Research live progress
→ Session refresh / replay
→ error / cancellation behavior
→ 再决定 Full Harness Workbench vs Hybrid Web + Harness
```

## 8. Remaining Work

- [x] exact-pin pristine Harness checkout / dependency install；
- [x] full pinned Harness Web runtime build；
- [x] out-of-tree profile plugin install；
- [x] FastAPI + Harness Web concurrent boot smoke；
- [x] Opportunity REST smoke；
- [x] diagnostics artifact；
- [ ] repository Ruff / pytest evidence（如作为 PR #2 merge gate，需要单独执行/接入）；
- [ ] browser manual validation M1~M9；
- [ ] 更新 capability matrix；
- [ ] 如有必要执行第二层 UI prototype；
- [ ] 写最终 Spike conclusion / ADR；
- [ ] 根据实测决定 `HARNESS_FULL_WORKBENCH` 或 `HYBRID_WEB_HARNESS`。
