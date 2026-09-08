# Current State

## 状态

`HARNESS_UI_GATE_COMPLETE__HYBRID_SHELL_CONTRACT_IN_PROGRESS`

Architecture + Functional Baseline v1 已合并到 `main`。

截至 PR #9：

```text
Harness Agent Runtime technical baseline        COMPLETE
Natural-language Tool selection / stable ID    PASS
Custom Editorial ToolView                      PASS
Research Job / Result / durable replay         PASS
Research Workspace hostability                 PASS
Programming / Global Shell hostability         ARCHITECTURE GATE COMPLETE
Final UI architecture                          HYBRID_WEB_HARNESS
```

最终 UI 架构已由 ADR-0009 冻结：

```text
AI Editorial Desk Web Shell
+
Harness-powered Agent / Research Workbench
+
Editorial Intelligence API / PostgreSQL canonical truth
```

当前正在进入：

```text
Hybrid Shell Contract
→ Web Shell foundation
→ Today / Opportunities
→ Harness launch adapter + Research outer route
→ Programming / Creation / Publication 等正式产品页面
```

Phase 0.5-B Acquisition Provider Spike 仍是独立并行工作流，不能被 Shell 工作替代。

---

## 已确认

- 新仓库独立演化，旧 `ai-editorial-desk` 冻结为 Legacy/reference。
- 新核心以 Subject / Discovery / Editorial Opportunity 为中心。
- Editorial Opportunity 是 Value Evaluation 与 Candidate V2 的直接业务对象。
- Editorial Value 采用版本化 Profile，不以单个 0–100 总分作为业务真相。
- Trend 从前置必需步骤降级为可选 Feature Provider。
- Acquisition 改为 Mission-driven：Ambient Coverage + Potential Scouts + Momentum Radar + Search-first + Targeted Fetch + Targeted Platform Research。
- **热度不是 Discovery Gate**。
- Human Acquisition / HumanSubmission 是一等入口，但不是 Confirmed Fact、正偏好标签或 Adopt。
- `source_origin` 与 `acquisition_origin` 必须分离。
- Candidate 前必须说明 Editorial Advantage。
- PostgreSQL 是 System of Record。
- WeKnora 是 Knowledge Provider，经 Knowledge Gateway 接入。
- Harness 与 Editorial API 保持独立运行时，Harness Tool 只走稳定 API。

### Harness / UI Spike 已确认

Pinned Harness：

```text
DeepSeek Harness 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release dsh@0.1.0-rc.7
Node 22.19.0
pnpm 11.7.0
```

已完成的关键验证：

- PR #2：pristine exact-pin build / official profile-plugin / FastAPI concurrent boot / `ctx.tools.execute()` → Editorial API；
- PR #5：Opportunity list → inspect 使用稳定业务 ID，不再让 Agent 猜 ID；
- PR #6：Opportunity list/detail 自定义 ToolView；
- PR #7：Research Result、Evidence/Unknown、cold restart replay、legacy session repair；
- PR #8：`conversation.view` 无侵入挂载完整三栏 Research Workspace，并通过 refresh / Harness restart / Agent coexistence；
- PR #9：确认 Programming / Today / Opportunities / Publishing 等全局模块不应绑定 Harness Session；root shell/sidebar 缺少合适的 additive global router/navigation seam。

因此：

```text
HARNESS_AS_AGENT_RUNTIME = ACCEPTED
HARNESS_AS_RESEARCH_WORKBENCH = ACCEPTED
HARNESS_FULL_WORKBENCH = REJECTED_FOR_V1
HYBRID_WEB_HARNESS = ACCEPTED
```

---

## Hybrid ownership

### Web Shell

- Global IA / Router；
- Today / Opportunities；
- Programming / Creation / Publication；
- Performance / Knowledge；
- Management / Configuration；
- Opportunity Inspector / Search / Human Submission；
- Shell ↔ Harness launch / return orchestration。

### Harness

- Agent Conversation；
- Editorial Tools / ToolViews；
- Background Jobs；
- Research Workspace；
- Session / Replay / Trajectory。

### Editorial API / PostgreSQL

- Opportunity / Research / Evidence / Unknown；
- Candidate / Programming / Human Decision；
- Draft / Publication / Performance；
- 所有 canonical business truth。

详细边界见：

- `docs/ADR/ADR-0009-hybrid-web-shell-harness.md`
- `docs/04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`

---

## 当前允许

- 更新 Hybrid Shell ADR / Contract / Architecture docs；
- 建立 Web Shell foundation / router / design-system shell；
- 为 Today / Opportunities / HumanSubmission Vertical Slice 实现必要最小 API/Frontend；
- 实现 Shell ↔ Harness compatibility / launch adapter，但必须遵守稳定 business ID 与 API 边界；
- 继续 Harness exact-pin compatibility CI；
- 并行推进 Acquisition Provider Spike；
- 为 MVP Vertical Slice 实现必要 Foundation Contracts。

## 当前禁止

- 继续为了 Full Harness Workbench patch/fork upstream core；
- 把 Programming / Draft / Publication 等全局业务模块强行做成 Session-scoped `conversation.view`；
- Shell 访问 Harness 私有 store、DOM 或内部 session 文件；
- 产品 canonical URL 只依赖 `harness_session_id` / job id；
- Harness Session / WeKnora 成为 Candidate/Decision/Publication 真相层；
- 在 Shell 与 Harness 两边复制相同的业务判断逻辑；
- 在 Provider Spike 前锁死 Acquisition Provider 实现；
- 跳过 provenance / versioning / Human Decision append-only 规则。

---

## 当前 Gate：Hybrid Shell Contract

在开始正式 Web Shell 大规模实现前，必须冻结：

```text
1. 产品 route map
2. Shell / Harness / API ownership
3. opportunity_id / research_case_id / harness_session_id 的身份边界
4. Shell → Harness launch contract
5. Harness → Shell return contract
6. Research outer product route 与 Harness inner surface 的关系
7. runtime/session 丢失后的 rehydrate 语义
8. transport 与 Domain 的隔离
```

对应文档：

`docs/04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`

该 Contract 合并后，优先顺序：

```text
S1 Web Shell foundation / router
S2 Today + Opportunity Inspector
S3 Opportunities Library
S4 Harness launch adapter + /research/:research_case_id
S5 Global Human Submission
S6 Programming foundation
```

---

## Acquisition Provider Spike 仍未关闭

Phase 0.5-B 必须同时验证：

- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery → reliable evidence follow-up。

HumanSubmission 不参加 Provider 胜负比较；它作为产品自身入口，复用最终选定 Provider 做 fetch / verification / research。

Hybrid Shell 工作与 Acquisition Provider Spike 可以并行，但任何一个都不得被另一个“视为已经完成”。

---

## MVP v0.1 Gate

最低闭环仍是：

```text
Machine Discovery + HumanSubmission
→ RawSignal
→ Discovery
→ Editorial Opportunity
→ Evaluation / Research
→ Adopt / Watch / Drop
```

MVP 第一成功标准仍不是功能数量，而是：

1. 系统能主动发现真实值得看的内容；
2. 用户能把低结构化线索交给编辑部并得到可验证、可解释的 Opportunity；
3. 两类入口最终都形成可追溯 Human Decision；
4. Web Shell 与 Harness 的 UI 分工不复制或破坏同一业务真相。
