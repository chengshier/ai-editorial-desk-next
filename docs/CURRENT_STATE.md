# Current State

## 状态

`OPPORTUNITIES_LIBRARY_IN_PROGRESS`

Architecture + Functional Baseline v1、Harness Runtime / UI Spike、Hybrid Shell Contract、S1 Web Shell Foundation 与 S2 Today / Opportunity Inspector 已合并到 `main`。

截至 PR #12：

```text
HARNESS_AS_AGENT_RUNTIME = ACCEPTED
HARNESS_AS_RESEARCH_WORKBENCH = ACCEPTED
HARNESS_FULL_WORKBENCH = REJECTED_FOR_V1
HYBRID_WEB_HARNESS = ACCEPTED
HYBRID_SHELL_CONTRACT = COMPLETE
WEB_SHELL_FOUNDATION = COMPLETE
TODAY_OPPORTUNITY_INSPECTOR = COMPLETE
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
S3 Opportunities Library
→ S4 Harness launch adapter + /research/:research_case_id
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
- PR #12：`/today` 已成为 API 驱动的 Editorial Radar，支持 URL-backed Opportunity Inspector、五个 Inspector Tab、Research Case 创建/复用与明确 Error/Loading/Empty 状态。

---

## 当前 Gate：S3 Opportunities Library

S3 目标：

- `/opportunities` 成为长期浏览 Opportunity corpus 的正式产品页，而不是 Placeholder；
- 复用 S2 的 Opportunity Card / Inspector / Research entry；
- 支持全文搜索；
- 支持当前 read model 已有字段的多条件筛选：recommendation / research state / production readiness；
- 支持基于当前真实字段的排序：readiness / confidence / research state / headline；
- 支持卡片视图与紧凑列表视图；
- 搜索、筛选、排序、布局、selected opportunity、Inspector tab 全部由 URL 表达并可刷新恢复；
- 点击 Opportunity 默认复用右侧 Inspector，不创建重复的 Opportunity Detail 一级页面；
- 从机会库创建或恢复 `research_case_id`，然后进入 `/research/:research_case_id`。

S3 当前事实边界继续继承 S2：

- 正式 PostgreSQL Opportunity persistence/read API 尚未完成；
- 因此 S3 暂时继续消费 `/api/v1/spike/shell/opportunities` transitional integration adapter；
- 该 read model 目前只有 3 条确定性集成 Opportunity，不代表生产全量 corpus；
- 前端不得硬编码 Opportunity 列表，也不得把 fixture 表述为真实外部发现结果；
- 当前缺少 Discovery Lane、Series Fit、Integrity、Attention、Human Seed、Time Range、Source Type 等 canonical 字段时，不得自行制造筛选维度的业务真相；
- 当前缺少 Human Decision API，因此不得伪造批量 Watch / Archive 成功；
- Saved View 若未来要求跨设备/团队同步，应进入正式用户偏好/配置 contract，本批不假装已完成。

S3 验收重点：

```text
1. /opportunities 从 Editorial API 读取当前可用 Opportunity corpus
2. 搜索 / recommendation / research / readiness / sort / layout 使用 URL state
3. Card / Compact 两种视图可切换并刷新恢复
4. Opportunity → Inspector 复用 S2 的五个 Tab
5. API unavailable 时明确失败，不回退 browser mock
6. Research 创建/复用继续使用 research_case_id
7. Shell 不暴露 harness_session_id / 私有 Harness URL
8. 未实现筛选与批量动作明确 unavailable，不伪造成功
9. Node typecheck + Vite build + Python tests 全绿
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
