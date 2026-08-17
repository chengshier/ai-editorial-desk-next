# Legacy Reuse Audit v1

Legacy repository: `chengshier/ai-editorial-desk`

新仓库不得运行时依赖旧仓库；复用以移植、抽象或数据 adapter 完成。

| Legacy 能力 | 决策 | 说明 |
|---|---|---|
| Connector definitions/instances | REUSE AS-IS/PORT | 工程底座可迁移 |
| Source / RawSignal | REUSE AS-IS/PORT | provenance 设计保留 |
| Collection Run/Checkpoint/Budget/Risk | REUSE/PORT | 保留运行治理 |
| Embedding | REUSE | 作为 feature/检索能力 |
| Event | LEGACY + ADAPTER | 映射为 EVENT Subject，不做总根 |
| Event clustering | PARTIAL REUSE | 仅服务 EVENT Subject 构建 |
| Trend snapshot | REUSE AS FEATURE PROVIDER | 不再是评价前置条件 |
| Evidence semantics | REUSE | Claim/Unknown/verification 原则保留 |
| Evidence physical FK to Event | GENERALIZE | V2 需要更通用 ownership/context |
| EditorialScore 七维 | REPLACE | Legacy read-only |
| Score Override | LEGACY | 新 Evaluation 使用独立版本化机制 |
| DailyCandidate | REPLACE | CandidateV2 绑定 Opportunity |
| Human Decision semantics | REUSE | append-only 原则保留 |
| Human Decision storage | V2 | 改绑 Candidate/Opportunity |
| Event Card | REPLACE/ADAPT | 演化为 Opportunity Brief |
| Editorial Pack | REUSE WITH ADAPTER | 证据/素材清单思想保留 |
| Draft version/citation/risk | REUSE WITH ADAPTER | 迁移成熟约束 |
| Publication | REUSE WITH V2 PROVENANCE | 保留冻结快照 |
| Performance | REUSE | append-only observation |
| AI Gateway/budget/structured output | REUSE/PORT | 优先迁移成熟工程能力 |
| Legacy React admin UI | LEGACY | Harness Workbench 取代主产品入口 |

## Legacy 数据迁移原则

先建立 bridge/read model，再决定是否 backfill。禁止为了兼容旧数据把新 Domain 重新 Event-centric 化。
