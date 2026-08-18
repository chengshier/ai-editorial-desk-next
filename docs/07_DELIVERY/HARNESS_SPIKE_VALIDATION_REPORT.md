# Harness Integration Spike — Validation Report

> 状态：`IN_PROGRESS`  
> Branch: `spike/harness-integration`  
> PR: #2

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

## 2. Automated Validation

| Check | Status | Evidence |
|---|---|---|
| Python install | PENDING | GitHub Actions `CI` |
| Ruff | PENDING | GitHub Actions `CI` |
| Backend pytest | PENDING | GitHub Actions `CI` |
| exact Harness checkout | PENDING | `Harness Spike` workflow |
| pinned Harness host contracts build | PENDING | `Harness Spike` workflow |
| Spike TypeScript build | PENDING | `Harness Spike` workflow |
| host/client bundle | PENDING | `Harness Spike` workflow |
| FastAPI boot | PENDING | `Harness Spike` workflow |
| Harness Web overlay boot | PENDING | `Harness Spike` workflow |

## 3. Manual Runtime Validation

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
| no upstream core patch | CODE_REVIEW_PASS | package copied into temporary workspace + Cordis overlay |
| canonical Tool value separated from UI presentation | CODE_REVIEW_PASS | `output.schema/render/presentationMeta` |
| replay UI avoids live I/O | CODE_REVIEW_PASS | Conversation Node folds durable Session events |

`CODE_REVIEW_PASS` 不等于 runtime PASS；对应运行行为仍由 Manual Gate 验证。

## 5. UI Capability Matrix

| Capability | Status | Notes |
|---|---|---|
| Agent conversation | PENDING | Harness native capability,需本 Spike 实测 |
| Editorial Tool call | PENDING | implemented |
| Generic Opportunity card | PENDING | implemented |
| Background Research Job | PENDING | implemented |
| Research Conversation Node | PENDING | implemented |
| Replay | PENDING | event model implemented |
| Approval UX | NOT_TESTED | not required for first A/B/C chain |
| 50~200 Opportunity Radar | NOT_TESTED | second-layer UI validation |
| complex filters/grouping | NOT_TESTED | second-layer UI validation |
| Programming Slate | NOT_TESTED | second-layer UI validation |
| Performance Dashboard | NOT_TESTED | second-layer UI validation |

## 6. Compatibility / Maintenance Risks

1. Harness 当前为 Developer Preview，Tool / Jobs / Client plugin / Conversation Node contract 可能 breaking。
2. out-of-tree client package 仍需针对 pinned Harness build；升级 Harness 必须重新跑 exact-pin compatibility CI。
3. 业务 API contract 不得跟随 Harness 内部类型变化；变化应收敛在 `integrations/harness` compatibility layer。
4. Generic Tool Card 与 Conversation Node 能否满足最终产品信息密度，需要真实 UX 验证。
5. Complex Radar / Programming / Performance UI 是否适合完全放在 Harness 内，当前没有证据。

## 7. Decision Status

```text
HARNESS_FULL_WORKBENCH: NOT_DECIDED
HYBRID_WEB_HARNESS:     NOT_DECIDED
```

A/B/C 核心链路通过，只能证明 Harness 适合作为 Agent/Tool/Research Runtime；不能自动证明它适合承担全部复杂 Dashboard。

## 8. Remaining Work

- exact-head automated CI；
- browser manual validation M1~M9；
- 更新 capability matrix；
- 如有必要执行第二层 UI prototype；
- 写最终 Spike conclusion / ADR。
