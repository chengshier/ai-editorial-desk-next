# AI Editorial Desk Next

AI Editorial Desk Next 是一个以 **Editorial Intelligence（编辑智能）** 为核心、由持续信息获取网络驱动、以 DeepSeek Harness 作为 Agent Runtime 与 Product Shell Host 的 AI 编辑部系统。

本仓库不是旧版 `ai-editorial-desk` 的原地重构。旧仓库冻结为 Legacy MVP 与可复用工程能力来源；本仓库以新的领域模型重新建立 V1。

## 核心主链

```text
Acquisition Network
→ RawSignal
→ Subject / Observation
→ Discovery
→ Editorial Opportunity
→ Value Evaluation
→ Research
→ Candidate
→ Editorial Programming
→ Human Decision
→ Draft
→ Publication
→ Performance
→ Learning
```

Acquisition 采用 Ambient / Potential / Momentum / Search / Targeted Research 与 Human Submission 并行入口，而不是“固定平台每天抓 N 条”的单一 Platform-first 模型。

## 当前产品架构

当前正式 UI/runtime 宿主由 ADR-0010 冻结为：

```text
DeepSeek Harness Web
├─ AI Editorial Desk Product Shell Plugin
├─ stock Harness workbench
└─ Agent Runtime / Session / Tool / Job

Editorial API / PostgreSQL
└─ canonical business truth
```

AI Editorial Desk Product Shell 是 out-of-tree Harness plugin，不修改 upstream core。stock Harness workbench 继续保留为自由 Agent / Session 工作台。

历史 `HYBRID_WEB_HARNESS` / 独立 `apps/web` + iframe/embedded Harness 方案已经 superseded。`apps/web` 在 S4-N5 前只作为迁移参考与回归基线。

## 关键原则

- 价值判断对象是 **Editorial Opportunity**，不是 Event，也不是单一热度分数。
- Opportunity 显式表达 Angle / Theme / Audience Promise / Why Now。
- Trend 是 Feature Provider；没有 Trend 不等于没有内容价值。
- Human Submission 是一等线索入口，但不是事实确认或正样本。
- PostgreSQL 是业务事实源；WeKnora 是知识检索与参考层。
- `opportunity_id / research_case_id / candidate_id / draft_id / publication_id` 是业务身份。
- Harness Session / Job / Workspace ID 只属于 runtime metadata。
- Session 丢失不得导致 Research Case / Evidence / Decision / Draft 丢失。
- 标准业务动作不能依赖用户进入 stock Harness Chat 手工 prompt。
- Harness compatibility 通过 `integrations/harness` 隔离；默认禁止 upstream core patch / private store / DOM hack。
- Human Decision 与算法排序分离，审计链、证据链、版本链必须可回放。

## 当前 S4 状态

```text
S4-N1 Product Shell Foundation           COMPLETE / CI PASS
S4-N2 Today / Opportunities Migration    COMPLETE / CI PASS
S4-N3 Research Runtime Adapter           COMPLETE / CI PASS
S4-N4 Scheduler / Headless Orchestration NEXT
S4-N5 Web Shell Retirement               NOT_STARTED
```

N3 已验证：即使 fresh Harness profile 没有 Workspace，Product Shell 也可以通过 pinned public `IWorkspaces` outward API 自动建立 `ai-editorial-desk-runtime` Workspace、创建/复用 Session 并完成 Research runtime binding。

下一步 N4 建立 Scheduler / Orchestrator，使 Schedule / Event / Manual Product Command 可以主动驱动 Harness SDK / JSON-RPC / Runtime Adapter。

## 开始阅读

所有新窗口、Codex/Agent 和贡献者必须先阅读：

1. [`docs/00_START_HERE.md`](docs/00_START_HERE.md)
2. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md)
3. [`docs/DECISIONS.md`](docs/DECISIONS.md)
4. [`docs/ADR/ADR-0010-harness-native-product-shell.md`](docs/ADR/ADR-0010-harness-native-product-shell.md)
5. [`docs/04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md`](docs/04_CONTRACTS/HARNESS_NATIVE_PRODUCT_SHELL_CONTRACT.md)
6. [`docs/07_DELIVERY/S4_HARNESS_NATIVE_PRODUCT_SHELL_MIGRATION.md`](docs/07_DELIVERY/S4_HARNESS_NATIVE_PRODUCT_SHELL_MIGRATION.md)
7. [`docs/01_PRODUCT/FUNCTIONAL_SPEC.md`](docs/01_PRODUCT/FUNCTIONAL_SPEC.md)
8. [`docs/01_PRODUCT/USER_JOURNEYS.md`](docs/01_PRODUCT/USER_JOURNEYS.md)
9. [`AGENTS.md`](AGENTS.md)

并行未关闭工作流：**Phase 0.5-B Acquisition Provider Spike**。
