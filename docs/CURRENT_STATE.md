# Current State

## 状态

`PHASE_0_5_A_HARNESS_INTEGRATION_SPIKE_IN_PROGRESS`

Architecture + Functional Baseline v1 已通过 PR #1 合并到 `main`。

当前分支：

```text
spike/harness-integration
```

本分支只执行 **Phase 0.5-A Harness Integration Spike**，验证 DeepSeek Harness 与 Editorial API 的真实集成边界；不进入正式 Subject/Discovery/Opportunity 持久化实现。

## Baseline 已冻结

- 新仓库独立演化，旧 `ai-editorial-desk` 冻结为 Legacy MVP/reference。
- 新核心以 Subject / Discovery / Editorial Opportunity 为中心。
- Editorial Opportunity 是 Value Evaluation 与 Candidate V2 的直接业务对象。
- Editorial Value 采用版本化 Profile，不以单个 0–100 总分作为业务真相。
- Trend 是可选 Feature Provider；热度不是 Discovery Gate。
- Acquisition = Ambient Coverage + Potential Scouts + Momentum Radar + Search-first + Targeted Fetch + Targeted Platform Research。
- Reddit/论坛/社区等非官方来源可以承担 Discovery/Audience/Trend Signal；事实确认仍走 Evidence/Primary Source。
- PostgreSQL 是 System of Record。
- WeKnora 是 Knowledge Provider，经 Knowledge Gateway 接入。
- DeepSeek Harness 是首选 Product Runtime / Agent Workbench，但是否承担全部复杂业务 UI 必须由本 Spike 验证。

## Phase 0.5-A 当前范围

允许：
- pinned DeepSeek Harness checkout / compatibility validation；
- out-of-tree Harness package；
- Editorial Tools；
- FastAPI mock Opportunity / Research API；
- structured Tool Card；
- Harness Job；
- durable Session event；
- Research Conversation Node；
- exact-pin build/boot CI；
- 浏览器手工 runtime/replay 验证；
- Spike Validation Report / UI capability matrix / ADR proposal。

禁止：
- 正式建立 Subject / Discovery / Opportunity 数据库和完整 Service；
- 为通过 Spike 而 fork/patch DeepSeek Harness core；
- Harness Tool 直接访问 PostgreSQL / WeKnora；
- 将 Harness Session 当成 canonical business database；
- 用 mock 结果冒充真实 Editorial Intelligence；
- 在未实测前宣称 Harness Full Workbench 已通过；
- 同时开始 Acquisition Provider Spike 的正式实现。

## Harness Pin

```text
Repository: deepseek-ai/deepseek-harness
Commit:     99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
Release:    dsh@0.1.0-rc.7
```

见 `integrations/harness/HARNESS_PIN.json`。

## 当前实现状态

```text
FastAPI mock Opportunity API             IMPLEMENTED
FastAPI mock Research Case               IMPLEMENTED
Harness list/inspect Tools               IMPLEMENTED
Harness start research Tool              IMPLEMENTED
Harness Job bridge                       IMPLEMENTED
Durable research Session events          IMPLEMENTED
Research Conversation Node               IMPLEMENTED
Exact-pin TypeScript/build CI             RUNNING/PENDING
Harness Web overlay boot smoke           RUNNING/PENDING
Manual browser Tool/Card validation       PENDING
Manual live research progress             PENDING
Manual refresh/replay validation          PENDING
Complex Radar/UI capability test          PENDING
```

任何 `PENDING` 项不得在报告中写成 PASS。

## 本阶段 Exit Gate

至少需要：

1. Python exact-head CI success；
2. pinned Harness typecheck/build success；
3. Harness Web overlay boot success；
4. 浏览器内真实 Tool → FastAPI 调用成功；
5. Opportunity Card 可用性确认；
6. Research Job live progress 成功；
7. refresh/replay 成功；
8. 输出 compatibility risk list 和 UI capability matrix；
9. 对 `HARNESS_FULL_WORKBENCH` / `HYBRID_WEB_HARNESS` 给出基于实测的阶段性结论。

若复杂 Radar/UI 仍需更独立的第二层验证，可将 A/B/C 核心链路先收口为 PASS，同时明确 UI Strategy Decision 仍为 `DEFERRED_TO_UI_SPIKE`，不得强行下结论。

## 下一 Gate

Phase 0.5-A 收口后，从最新 `main` 新建独立分支执行：

```text
Phase 0.5-B — Acquisition Provider Spike
```

只有两个 Spike 的关键结论冻结后，才进入：

```text
Phase 1 — Foundation Contracts
```
