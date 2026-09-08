# Frozen Decisions

本文件是关键决定索引；详细原因见 `docs/ADR/`。

| ID | 决定 | 状态 |
|---|---|---|
| ADR-0001 | 新建独立仓库，不在 Legacy MVP 原地重构 | Accepted |
| ADR-0002 | DeepSeek Harness 承担 Agent Runtime / Workbench 能力，不是业务真相层 | Accepted / refined by ADR-0009 |
| ADR-0003 | PostgreSQL = System of Record | Accepted |
| ADR-0004 | WeKnora = Knowledge Provider，经 Knowledge Gateway 接入 | Accepted |
| ADR-0005 | Editorial Opportunity = 主要评价/候选单位 | Accepted |
| ADR-0006 | Acquisition Core 采用 Mission-driven；Potential 与 Momentum 双通道，热度不是前置条件 | Accepted |
| ADR-0007 | Harness 复杂 UI 必须经过 Spike；Agent Runtime 技术基线与 Full-vs-Hybrid UI Gate 分开验证 | Accepted / Gate completed |
| ADR-0008 | Human Acquisition 是一等发现入口；HumanSubmission 统一归一化进入 RawSignal / Provenance 主链 | Accepted |
| ADR-0009 | 最终产品采用 Hybrid Web Shell + Harness-powered Agent / Research Workbench | Accepted |

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
24. **Harness Runtime 技术可行 != Full Harness Workbench UX 已验收**；该独立 Gate 已由 PR #5–#9 完成，并最终选择 Hybrid。
25. Harness compatibility 必须收敛在 integration seam；不得为兼容升级把 Domain/API 耦合进 Harness internals。
26. **产品 canonical route 必须以业务 ID / 业务页面语义为中心，不得依赖 Harness Session ID 或私有 view/store。**
27. Programming / Draft / Publication / Performance 等全局业务状态不得因 Harness Session 生命周期而创建、销毁或切换真相。

## Harness / Product Shell 已冻结决定

```text
HARNESS_AS_AGENT_RUNTIME = ACCEPTED_AS_V1_TECHNICAL_BASELINE
HARNESS_RESEARCH_WORKBENCH = ACCEPTED
HYBRID_WEB_HARNESS = ACCEPTED
HARNESS_FULL_WORKBENCH = REJECTED_FOR_V1
```

依据：

- PR #2：exact-pin pristine build、official profile/plugin、FastAPI + Harness Web boot、Harness `ctx.tools.execute()` → Editorial API；
- PR #5：稳定 Opportunity ID 连续调用；
- PR #6：自定义业务 ToolView；
- PR #7：Research Result / durable replay / cold restart；
- PR #8：`conversation.view` 三栏 Research Workspace + Agent coexistence；
- PR #9：Programming / Global Shell Hostability 审计，确认全局 Router / Primary Navigation 不适合继续塞进 Session-scoped Harness view。

最终职责：

```text
Web Shell
→ Global IA / Router / Today / Opportunities / Programming / Creation / Publication / Performance / Knowledge / Management

Harness
→ Agent Conversation / Tools / Jobs / ToolViews / Research Workspace / Session Replay

Editorial API / PostgreSQL
→ canonical business truth
```

Shell ↔ Harness 的稳定 ID、路由、launch/return 和 ownership 见：

`docs/04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`

## 当前仍待 Spike / 实现冻结的决定

- V1 Acquisition Provider 具体组合与 fallback。
- TrendProvider / Community Provider 的具体实现与访问边界。
- Hybrid Shell 的浏览器 transport 细节（embedded / reverse proxy / same-tab / separate-tab）与 Harness launch adapter 实现。

其中 transport 只是 integration/compatibility 细节，不得改变 ADR-0009 的 Hybrid ownership、产品路由或业务 ID 语义。
