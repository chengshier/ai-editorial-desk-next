# Current State

## 状态

`ARCHITECTURE_BASELINE_V1_IN_PROGRESS`

当前 main 仅有仓库初始化；本分支用于冻结 Architecture Baseline v1 与项目骨架。

## 已确认

- 新仓库独立演化，旧 `ai-editorial-desk` 冻结为 Legacy MVP/reference。
- 新核心以 Subject / Discovery / Editorial Opportunity 为中心。
- Editorial Opportunity 是 Value Evaluation 与 Candidate V2 的直接业务对象。
- Editorial Value 采用版本化 Profile，不以单个 0–100 总分作为业务真相。
- Trend 从前置必需步骤降级为可选 Feature Provider。
- DeepSeek Harness 作为 Product Runtime / Workbench Shell，通过插件/工具/API 接入 Core。
- PostgreSQL 是 System of Record。
- WeKnora 是 Knowledge Provider，通过 Knowledge Gateway 接入。
- Evidence、Decision、Publication、Performance 的审计语义尽量继承旧版成熟原则。

## 此阶段允许

- 文档、ADR、数据契约、状态机、项目结构。
- `/healthz` 等最小运行骨架。
- Legacy 读取与迁移方案设计。
- Harness/WeKnora compatibility interface 设计。

## 此阶段禁止

- 提前完整实现 Subject/Discovery/Opportunity 业务表与服务。
- 把旧 Event/Trend/Score 模型复制到新仓库后继续使用。
- 直接 fork/魔改 DeepSeek Harness core。
- 将 Candidate/Decision/Publication 真相写到 WeKnora。
- 为了“先跑起来”跳过 provenance/versioning。

## 下一 Gate

Architecture Baseline v1 合并后进入 **Foundation Contracts**：先实现核心 schema/value objects/repository ports 与迁移测试，再进入采集和 Agent 工作台。
