# AI Editorial Desk Next

AI Editorial Desk Next 是一个以 **Editorial Intelligence（编辑智能）** 为核心、由持续信息获取网络驱动、以 DeepSeek Harness 作为主要 Agent Runtime / Workbench Shell 的 AI 编辑部系统。

本仓库不是旧版 `ai-editorial-desk` 的原地重构。旧仓库冻结为 Legacy MVP 与可复用工程能力来源；本仓库以新的领域模型重新建立 V1。

核心主链：

```text
RawSignal
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

关键原则：

- 价值判断对象是 **Editorial Opportunity**，不是 Event，也不是单一热度分数。
- Trend 只是 Feature Provider 之一；没有 Trend 不等于没有内容价值。
- PostgreSQL 是业务事实源；WeKnora 是知识检索与参考层。
- DeepSeek Harness 是产品运行时与主要工作台，不承载 Editorial Intelligence 的业务真相。
- Human Decision 与算法排序分离，审计链、证据链、版本链必须可回放。
- 旧版 M1–M5 的有价值能力按 `REUSE / ADAPT / LEGACY / REPLACE` 逐项迁移，不直接依赖旧仓库运行。

## 开始阅读

所有新窗口、Codex/Agent 和贡献者必须先阅读：

1. [`docs/00_START_HERE.md`](docs/00_START_HERE.md)
2. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md)
3. [`docs/DECISIONS.md`](docs/DECISIONS.md)
4. [`AGENTS.md`](AGENTS.md)

当前阶段：**Architecture Baseline v1 / Skeleton Freeze**。
