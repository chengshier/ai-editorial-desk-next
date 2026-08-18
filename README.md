# AI Editorial Desk Next

AI Editorial Desk Next 是一个以 **Editorial Intelligence（编辑智能）** 为核心、由持续信息获取网络驱动、以 DeepSeek Harness 作为首选 Agent Runtime / Workbench 的 AI 编辑部系统。

本仓库不是旧版 `ai-editorial-desk` 的原地重构。旧仓库冻结为 Legacy MVP 与可复用工程能力来源；本仓库以新的领域模型重新建立 V1。

核心主链：

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

Acquisition 不再以“固定平台每天抓 N 条”为核心，而采用：

```text
Ambient Feed Sensing
+ Mission-driven Discovery Scout
+ Search-first Discovery
+ Targeted Fetch
+ Targeted Platform Research
```

关键原则：

- 价值判断对象是 **Editorial Opportunity**，不是 Event，也不是单一热度分数。
- Opportunity 显式表达 Angle / Theme / Audience Promise / Why Now。
- Trend 只是 Feature Provider 之一；没有 Trend 不等于没有内容价值。
- PostgreSQL 是业务事实源；WeKnora 是知识检索与参考层。
- DeepSeek Harness 与 Python/FastAPI 后端是独立运行时，通过 Editorial Tools + HTTPS/JSON API 连接。
- Harness 是首选 Agent Workbench；是否承担全部复杂 Radar/Programming/Performance UI，将由 Integration Spike 决定。
- Human Decision 与算法排序分离，审计链、证据链、版本链必须可回放。
- 旧版 M1–M5 的有价值能力按 `REUSE / ADAPT / LEGACY / REPLACE` 逐项迁移，不直接依赖旧仓库运行。

## 开始阅读

所有新窗口、Codex/Agent 和贡献者必须先阅读：

1. [`docs/00_START_HERE.md`](docs/00_START_HERE.md)
2. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md)
3. [`docs/DECISIONS.md`](docs/DECISIONS.md)
4. [`docs/01_PRODUCT/FUNCTIONAL_SPEC.md`](docs/01_PRODUCT/FUNCTIONAL_SPEC.md)
5. [`docs/01_PRODUCT/USER_JOURNEYS.md`](docs/01_PRODUCT/USER_JOURNEYS.md)
6. [`AGENTS.md`](AGENTS.md)

当前阶段：**Architecture + Functional Baseline v1**。

Baseline 合并后先完成 Harness Integration Spike 与 Acquisition Provider Spike，再进入 Foundation Contracts。