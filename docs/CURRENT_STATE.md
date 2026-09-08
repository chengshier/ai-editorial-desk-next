# Current State

## 状态

`WEB_SHELL_FOUNDATION_IN_PROGRESS`

Architecture + Functional Baseline v1、Harness Runtime / UI Spike 与 Hybrid Shell Contract 均已合并到 `main`。

截至 PR #10，已经冻结：

```text
HARNESS_AS_AGENT_RUNTIME = ACCEPTED
HARNESS_AS_RESEARCH_WORKBENCH = ACCEPTED
HARNESS_FULL_WORKBENCH = REJECTED_FOR_V1
HYBRID_WEB_HARNESS = ACCEPTED
HYBRID_SHELL_CONTRACT = COMPLETE
```

最终产品 UI 架构：

```text
AI Editorial Desk Web Shell
+
Harness-powered Agent / Research Workbench
+
Editorial Intelligence API / PostgreSQL canonical truth
```

当前正式进入：

```text
S1 Web Shell foundation / router / design-system shell
→ S2 Today + Opportunity Inspector
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

### Harness / UI Spike

Pinned Harness：

```text
DeepSeek Harness 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release dsh@0.1.0-rc.7
Node 22.19.0
pnpm 11.7.0
```

关键验证：

- PR #2：exact-pin build / profile-plugin / FastAPI concurrent boot / Tool → Editorial API；
- PR #5：Opportunity list → inspect 稳定业务 ID；
- PR #6：Opportunity list/detail 自定义 ToolView；
- PR #7：Research Result、Evidence/Unknown、cold restart replay、legacy session repair；
- PR #8：`conversation.view` 承载三栏 Research Workspace，并通过 refresh / Harness restart / Agent coexistence；
- PR #9：Programming / Today / Opportunities / Publishing 等全局模块不应绑定 Harness Session；
- PR #10：ADR-0009 + Hybrid Shell Contract 冻结 route / ownership / stable ID / launch-return / rehydrate 语义。

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

详细边界：

- `docs/ADR/ADR-0009-hybrid-web-shell-harness.md`
- `docs/04_CONTRACTS/HYBRID_SHELL_CONTRACT.md`

---

## 当前 Gate：S1 Web Shell Foundation

S1 允许：

- 创建 `apps/web`；
- 建立正式 Product Router；
- 建立统一 TopNav / Sidebar / Workspace / Inspector Host；
- 建立管理侧入口；
- 建立全局 Human Submission 入口壳，但不得冒充 API 已接入；
- 建立 Editorial API Client boundary；
- 建立 Harness Surface / Launch type boundary，但不得写死 Harness 私有 URL、iframe 或 Session 路由；
- 使用 Stitch 设计稿作为视觉语言参考，并重新统一 viewport / sidebar / inspector 尺寸。

S1 不允许：

- 在 Today 页面伪造真实 Opportunity 业务数据；
- 提前实现 S2/S3 的正式业务查询；
- 提前写死 Harness transport；
- Shell import Harness 内部 TypeScript package；
- Shell 直接访问 Harness DOM / private store / session files；
- 把 `harness_session_id` 作为产品 route key；
- 在 Shell 中复制 Domain 决策规则。

S1 验收重点：

```text
1. /today 及冻结的产品路由可用
2. Global Shell 视觉与 Stitch 基线一致但尺寸统一
3. P01 Inspector Host 存在且不重复制造 Opportunity Detail 页面
4. /research/:research_case_id 保留稳定 Harness 宿主边界
5. Human Submission 入口可打开但明确标注尚未接业务 API
6. Node typecheck + Vite production build 进入 CI
7. 1280/1440+ 桌面布局不依赖单一固定 viewport
```

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
