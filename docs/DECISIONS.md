# Frozen Decisions

本文件是关键决定索引；详细原因见 `docs/ADR/`。历史决策可以被后续 ADR supersede，但不得静默改写为“从未发生”。

| ID | 决定 | 状态 |
|---|---|---|
| ADR-0001 | 新建独立仓库，不在 Legacy MVP 原地重构 | Accepted |
| ADR-0002 | DeepSeek Harness 承担 Agent Runtime / Workbench 能力，不是业务真相层 | Accepted / refined by ADR-0010 |
| ADR-0003 | PostgreSQL = System of Record | Accepted |
| ADR-0004 | WeKnora = Knowledge Provider，经 Knowledge Gateway 接入 | Accepted |
| ADR-0005 | Editorial Opportunity = 主要评价/候选单位 | Accepted |
| ADR-0006 | Acquisition Core 采用 Mission-driven；Potential 与 Momentum 双通道，热度不是前置条件 | Accepted |
| ADR-0007 | Harness 复杂 UI 必须经过 Spike；Agent Runtime 技术基线与 UI Host Gate 分开验证 | Accepted / Gate completed |
| ADR-0008 | Human Acquisition 是一等发现入口；HumanSubmission 统一归一化进入 RawSignal / Provenance 主链 | Accepted |
| ADR-0009 | Hybrid Web Shell + Harness-powered Agent / Research Workbench | Superseded by ADR-0010 |
| ADR-0010 | Harness-native AI Editorial Desk Product Shell + retained stock Harness workbench | Accepted |

## 业务不变量

1. Unknown != Fact。
2. `single_source != confirmed`。
3. `Unavailable != 0`。
4. AI 不得静默确认 Claim。
5. Human Decision append-only，独立于算法排名。
6. Adopt 不等于 Draft，不等于 Publication。
7. Publication 冻结 provenance。
8. Performance snapshot append-only；NULL 不等于 0。
9. Performance 不自动反向改写历史 score/evaluation/decision/evidence。
10. Hook 必须通过事实一致性检查，不允许标题党式事实扭曲。
11. Trend 是 Feature，不是进入 Discovery/Opportunity/Candidate 的必经 Gate。
12. **没有升温不等于没有潜力；Potential-driven Discovery 与 Momentum-driven Discovery 同等合法。**
13. Acquisition Provider 的 rank/score/velocity 不等于 Editorial Value。
14. 非官方/社区来源可以是 Discovery/Audience/Trend Signal，但不自动等于 Confirmed Evidence。
15. 发现来源与事实证据来源必须区分 Source Role。
16. 固定平台 crawler 是 Provider，不是产品核心发现逻辑。
17. Harness Session / WeKnora 不得成为 canonical business truth。
18. UI 形态可以演化，但 Domain/API 业务语义不得复制或分叉。
19. **Human Submission 是线索入口，不等于 Confirmed Fact、正偏好标签、Opportunity、Candidate 或 Adopt。**
20. 必须区分 `source_origin` 与 `acquisition_origin`；用户提交第三方 URL 不改变第三方作为原始来源的事实。
21. Machine Acquisition 与 Human Acquisition 共享统一 RawSignal / Subject / Discovery / Opportunity 主链，不建立第二套 HumanSignal 业务模型。
22. **Editorial Advantage invariant**：进入 Candidate 的 Opportunity 必须说明相对原始信息新增了什么编辑价值；不要求信息具有排他性。
23. Human Submission 只有与后续 Evaluation + Adopt/Watch/Drop + reason 结合后，才可作为 Rubric calibration evidence。
24. Harness compatibility 必须收敛在 integration seam；不得为了适配升级把 Domain/API 耦合到 Harness internals。
25. **产品 canonical identity 必须以业务 ID 为中心，不得依赖 Harness Session ID / Job ID / Workspace ID。**
26. Programming / Draft / Publication / Performance 等全局业务状态不得因 Harness Session 生命周期而创建、销毁或切换真相。
27. 标准业务动作不得要求用户进入 stock Harness Chat 手工 prompt；Product Command / Scheduler / Orchestrator 必须能主动驱动 Runtime。
28. fresh Harness profile 不得要求用户先手工创建 Workspace；technical runtime Workspace 通过公开 `IWorkspaces` outward API 自举。

## Harness / Product Shell 当前冻结决定

```text
HARNESS_AS_AGENT_RUNTIME = ACCEPTED_AS_V1_TECHNICAL_BASELINE
HARNESS_STOCK_WORKBENCH = RETAINED
HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL = ACCEPTED
EXTERNAL_WEB_SHELL_IFRAME_HARNESS = SUPERSEDED
HARNESS_FULL_WORKBENCH_AS_STOCK_UI = NOT_THE_PRODUCT_SHELL
HARNESS_UPSTREAM_CORE_PATCH = FORBIDDEN_BY_DEFAULT
```

这里的 `HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL` 不等于“直接把业务模块塞进 stock Harness Session 页面”。正式形态是 out-of-tree Product Shell Plugin 使用公开 root Slot seam 承载结构化产品，同时 stock Harness workbench 继续作为自由 Agent / Session 工作台。

## 证据链

- PR #2：exact-pin pristine build、official profile/plugin、FastAPI + Harness Web boot、Harness Tool → Editorial API；
- PR #5–#9：ToolView、Research Result / Replay、Research Workspace、Full-vs-Hybrid 历史 Gate；
- PR #15：root Slot native Product Shell Spike、双工作台切换、Windows 本地验收；
- PR #16 N1/N2：正式 Product Shell Foundation + Today / Opportunities migration；
- PR #16 N3：Research Runtime Adapter、Session rebind、fresh-profile Workspace bootstrap，四套 CI 全绿。

## 当前职责

```text
AI Editorial Desk Product Shell Plugin
→ Global IA / Today / Opportunities / Research / Programming / Creation / Publication / Performance / Knowledge / Management

stock DeepSeek Harness workbench
→ free Agent / Session / Tool / Job / Replay

Harness Runtime
→ Agent execution / Session / Workspace / Tool / Job / headless runtime seams

Editorial API / PostgreSQL
→ canonical business truth
```

活动 Contract：

`docs/04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`

历史 Contract：

`docs/04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`（SUPERSEDED / HISTORICAL）

## 当前仍待 Spike / 实现冻结的决定

- V1 Acquisition Provider 具体组合与 fallback；
- TrendProvider / Community Provider 的具体实现与访问边界；
- S4-N4 Scheduler / Headless Orchestration 的正式 API/持久化模型与 Harness SDK / JSON-RPC execution seam；
- S4-N5 `apps/web` 最终删除还是保留为明确的 dev-preview/reference 壳。

旧 Hybrid browser transport（iframe / embedded / `surface_url` / same-tab launch）不再是待选项。
