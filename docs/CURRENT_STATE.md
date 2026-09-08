# Current State

## 状态

`TODAY_OPPORTUNITY_INSPECTOR_IN_PROGRESS`

Architecture + Functional Baseline v1、Harness Runtime / UI Spike、Hybrid Shell Contract 与 S1 Web Shell Foundation 已合并到 `main`。

截至 PR #11：

```text
HARNESS_AS_AGENT_RUNTIME = ACCEPTED
HARNESS_AS_RESEARCH_WORKBENCH = ACCEPTED
HARNESS_FULL_WORKBENCH = REJECTED_FOR_V1
HYBRID_WEB_HARNESS = ACCEPTED
HYBRID_SHELL_CONTRACT = COMPLETE
WEB_SHELL_FOUNDATION = COMPLETE
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
S2 Today / Editorial Radar + Opportunity Inspector
→ S3 Opportunities Library
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
- PR #11：正式 `apps/web`、Router、TopNav、Sidebar、Inspector Host、Research Hub/Case route 与 Harness boundary 已建立。

---

## 当前 Gate：S2 Today / Editorial Radar + Opportunity Inspector

S2 允许：

- `/today` 从 Editorial API 读取 Opportunity read model；
- 使用 `opportunity_id` 驱动 URL-backed Inspector focus；
- Inspector 使用 `overview / evidence / research / timeline / history` query state；
- 从 Opportunity 创建或恢复业务 `research_case_id`，然后进入 `/research/:research_case_id`；
- 复用 Stitch P01 的 Feed + Inspector 视觉结构，但继续使用 S1 已统一的 56px Header / 240px Sidebar / 416px Inspector 基线；
- 为本地开发通过 Vite proxy 访问 Editorial API，而不是在浏览器关闭 CORS。

S2 当前的事实边界：

- 正式 Opportunity persistence/read API 尚未完成；
- 因此本批暂时复用 **Harness Spike read model**，并通过单独的 `/api/v1/spike/shell/*` transitional adapter 暴露 Shell 所需的 `latest_research_case_id`；
- 该 adapter 是开发/集成 fixture，不是 PostgreSQL canonical truth；
- 前端不得硬编码 Opportunity 列表；
- **不得把 Spike fixture 表述为真实外部发现结果**；
- 不得因为 fixture 中存在 `today_main / evergreen` 就推导尚未实现的真实 Momentum / Potential 算法结果。

S2 不允许：

- 在浏览器内制造 Opportunity / Evidence / Human Decision 假数据；
- 把 Research Evidence 从 Harness Session 文本解析回 Shell；
- 实现 Adopt / Watch / Drop 的假按钮成功态；
- 写死 Harness URL / iframe / private store；
- 把 `harness_session_id` 作为研究产品 URL；
- 把当前 fixture 当作 Acquisition Provider Spike 已完成。

S2 验收重点：

```text
1. /today 能从 Editorial API 加载 Opportunity
2. Opportunity Card → Inspector 可用
3. URL 可表达 opportunity + inspector tab
4. API unavailable 时明确失败，不显示伪造 0 数据
5. “开始研究”创建 Research Case 并进入 /research/:research_case_id
6. 已有 Research Case 时复用 latest_research_case_id
7. Shell 不暴露 harness_session_id / 私有 Harness URL
8. Node typecheck + Vite build + Python tests 全绿
9. 视觉结构接近 Stitch P01，同时保持统一响应式尺寸
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
