# Legacy Reuse Audit v1

Legacy repository: `chengshier/ai-editorial-desk`

新仓库不得运行时依赖旧仓库；复用以移植、抽象或数据 adapter 完成。

| Legacy 能力 | 决策 | 说明 |
|---|---|---|
| Connector definitions/instances | REUSE ENGINEERING / ADAPT | 可迁移配置、实例、capability 思想，但需适配新的 Provider seam |
| Source / RawSignal | REUSE AS-IS/PORT | provenance 设计保留，并补 Acquisition Context |
| Collection Run/Checkpoint/Budget/Risk | REUSE/PORT | 保留运行治理，扩展到 Search/Feed/Fetch/Platform Provider |
| MediaCrawler integration | LEGACY PLATFORM ADAPTER CANDIDATE | 仅作为 PlatformProvider 候选，是否保留由 Acquisition Spike 决定 |
| Platform-specific mapper/schema | PARTIAL REUSE | 只迁移真实需要的 capability，不要求七平台齐头并进 |
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
| Legacy React admin UI | LEGACY | 不继续作为新产品主入口；若最终采用 Hybrid，也应新建面向 Editorial Workflow 的 Web Shell，而不是复活旧后台 |

## Acquisition 复用原则

旧版真正值得迁移的是：
- normalized RawSignal；
- idempotency；
- connector run/checkpoint；
- budget/concurrency；
- risk guard；
- source/platform provenance。

不迁移为新产品真相的是：
- 固定平台优先级；
- “每天平台抓 N 条就是发现能力”的假设；
- MediaCrawler 内部对象作为 Domain contract；
- 七平台全部完成才算 V1 完成的验收思路。

新的 Acquisition Provider 组合必须由 Provider Spike 验证。

## Legacy 数据迁移原则

先建立 bridge/read model，再决定是否 backfill。禁止为了兼容旧数据把新 Domain 重新 Event-centric 或 Platform-first 化。

Legacy Event 可以映射到 `Subject(type=EVENT)`；Legacy Event/Trend/Score/Candidate 仅作为历史上下文与对照，不作为新主链必需实体。