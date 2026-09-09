# Current State

## 状态

`HARNESS_RESEARCH_INTEGRATION_IN_PROGRESS`

Architecture + Functional Baseline v1、Harness Runtime / UI Spike、Hybrid Shell Contract、S1 Web Shell Foundation、S2 Today / Opportunity Inspector 与 S3 Opportunities Library 已合并到 `main`。

截至 PR #13：

```text
HARNESS_AS_AGENT_RUNTIME = ACCEPTED
HARNESS_AS_RESEARCH_WORKBENCH = ACCEPTED
HARNESS_FULL_WORKBENCH = REJECTED_FOR_V1
HYBRID_WEB_HARNESS = ACCEPTED
HYBRID_SHELL_CONTRACT = COMPLETE
WEB_SHELL_FOUNDATION = COMPLETE
TODAY_OPPORTUNITY_INSPECTOR = COMPLETE
OPPORTUNITIES_LIBRARY = COMPLETE
```

最终产品 UI 架构仍是：

```text
AI Editorial Desk Web Shell
+
Harness-powered Agent / Research Workbench
+
Editorial Intelligence API / PostgreSQL canonical truth
```

当前正式进入：

```text
S4 Harness launch adapter + /research/:research_case_id
→ S5 Global Human Submission
→ S6 Programming foundation
```

Phase 0.5-B Acquisition Provider Spike 仍是独立并行工作流，不能被 Shell 工作替代。

---

## 已确认

### Product / Domain

- 新仓库独立演化，旧 `ai-editorial-desk` 仅作为 Legacy/reference。
- 主链以 Subject / Discovery / Editorial Opportunity 为中心。
- Editorial Opportunity 是 Value Evaluation 与 Candidate V2 的直接业务对象。
- Trend 是可选 Feature，不是 Discovery / Opportunity / Candidate 的硬 Gate。
- HumanSubmission 是一等 Acquisition 入口，但不是 Confirmed Fact、正偏好标签、Opportunity、Candidate 或 Adopt。
- `source_origin` 与 `acquisition_origin` 必须分离。
- Candidate 前必须说明 Editorial Advantage。
- PostgreSQL 是 System of Record；WeKnora 是 Knowledge Provider。

### Harness / Hybrid UI

- PR #2：exact-pin build / profile-plugin / FastAPI concurrent boot / Tool → Editorial API；
- PR #5：Opportunity list → inspect 稳定业务 ID；
- PR #6：Opportunity list/detail 自定义 ToolView；
- PR #7：Research Result、Evidence/Unknown、cold restart replay、legacy session repair；
- PR #8：`conversation.view` 承载三栏 Research Workspace，并通过 refresh / Harness restart / Agent coexistence；
- PR #9：Programming / Today / Opportunities / Publishing 等全局模块不应绑定 Harness Session；
- PR #10：ADR-0009 + Hybrid Shell Contract 冻结 route / ownership / stable ID / launch-return / rehydrate；
- PR #11：正式 `apps/web`、Router、TopNav、Sidebar、Inspector Host、Research Hub/Case route 与 Harness boundary 已建立；
- PR #12：`/today` 已成为 API 驱动的 Editorial Radar，支持 URL-backed Opportunity Inspector、五个 Inspector Tab、Research Case 创建/复用与明确 Error/Loading/Empty 状态；
- PR #13：`/opportunities` 已成为 Opportunity Library，支持搜索、筛选、排序、Card/Compact、URL-backed state，并复用 Inspector / Research entry。

---

## 当前 Gate：S4 Harness Launch Adapter + Research Integration

S4 目标：

```text
Opportunity
→ Research Case
→ /research/:research_case_id
→ Shell 请求 Harness launch descriptor
→ Harness 打开或恢复正确 Agent Session
→ Research Workspace / Tool Result / Replay
→ 保持 AI Editorial Desk 产品 Shell 与业务 URL
```

### 已在 S4 分支实现的 integration seam

- 新增 `POST /api/v1/integrations/harness/launches`；
- Shell 只消费服务端返回的 opaque `surface_url`，不构造 Harness Session URL；
- `return_path` 必须是允许的本地产品路由，拒绝外部跳转；
- Research launch 以 `research_case_id` 为产品主身份，并由 Editorial API 校验其 `opportunity_id`；
- integration layer 可记录 `research_case_id ↔ harness_session_id` 运行时关联；
- Session 丢失时可通过 Harness 公开 `workspaces / sessions` outward API 创建新 Session 并重新 hydrate Research context；
- 首次 hydrate 只把 `get_editorial_research_result` 的结构化 Tool Result 写入 Harness durable replay，不重新创建 Research Case；
- embedded transport 使用 Harness 公开 slot seam 替换内部 root presentation，只渲染既有 `ResearchWorkspaceView`，避免双 Sidebar / 双 Header；
- 正常直接访问 Harness Web 时不触发 embedded root replacement，仍保持原 Harness Shell；
- API 增加显式 CORS allowlist，供本地 Shell/Harness 双 origin 集成验证。

### S4 当前事实边界

S4 仍然运行在 transitional integration fixture 上：

- Opportunity / Research Case 还没有正式 PostgreSQL persistence/read API；
- Research Case 当前仍来自 `/api/v1/spike/research-cases` 内存 fixture；
- 当前 deterministic Research Result 仍是 `deterministic_spike_mock`，只用于验证 Evidence / Unknown / Conclusion / replay；
- Harness launch/session association 当前也是 integration runtime metadata，不是 canonical domain truth；
- API 进程重启后这份临时 launch/session mapping 可以丢失，但 Research correctness 的长期目标仍是从正式 Editorial API / PostgreSQL 重建；
- 当前不得把 S4 描述为真实互联网研究、正式生产 persistence 或 Acquisition 已完成。

### S4 验收重点

```text
1. /research/:research_case_id 仍是稳定产品 URL
2. Shell 请求 /api/v1/integrations/harness/launches，不拼 Harness 私有 URL
3. surface_url 对 Shell 保持 opaque
4. embedded Harness 只展示 Research Workspace，不出现第二套 Sidebar/Header
5. Existing Harness Session 可恢复
6. Session 丢失时可新建 Session，并从 research_case_id 重新 hydrate
7. hydrate 不创建新的 Research Case
8. Research Tool Result 可重放 Evidence / Unknown / Conclusion
9. Harness unavailable 时 Shell 显式失败，但不把 Research Case 标为 missing
10. 无 document.querySelector / private store / Shell import Harness internal package
11. Python tests + ruff + Web typecheck/build + exact-pin Harness compile/bundle 全绿
12. 本地浏览器人工验收 refresh / Harness restart / iframe/CORS 行为
```

---

## S3 已完成，但事实边界继续有效

S3 `/opportunities` 已完成当前 contract 下的：

- 全文搜索；
- recommendation / research / readiness 筛选；
- readiness / confidence / research / headline 排序；
- Card / Compact 两种视图；
- `q / recommendation / research / readiness / sort / layout / opportunity / inspector` URL-backed state；
- shared Opportunity Inspector；
- shared Research Case 创建/复用链。

但当前 `/api/v1/spike/shell/opportunities` 仍只有 3 条确定性集成 Opportunity，不代表生产全量 corpus，也不代表正式 Acquisition Provider 已完成。

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

---

## Acquisition Provider Spike 仍未关闭

Phase 0.5-B 必须验证：

- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery → reliable evidence follow-up。

HumanSubmission 不参加 Provider 胜负比较；它作为产品自身入口，复用最终选定 Provider 做 fetch / verification / research。

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
