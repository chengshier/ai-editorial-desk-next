# Implementation Roadmap

这不是旧项目的 M6。它是新仓库的 V1 delivery plan。

## Phase 0 — Architecture Baseline

冻结 Product/Domain/Architecture/Contracts/ADR、项目骨架、Legacy reuse map。**当前阶段。**

## Phase 1 — Foundation Contracts

实现纯领域 value objects、枚举、Pydantic schemas、repository ports、migration test fixtures；不先做 Harness UI。

重点：Subject、Observation、Discovery、Opportunity、Evaluation contract、EditorialProfile、provenance/version primitives。

## Phase 2 — Persistence & Legacy Bridge

PostgreSQL/Alembic、核心 repository；实现 Legacy RawSignal/Event 只读 bridge 和必要的 import/backfill 工具。

## Phase 3 — Acquisition Reuse

迁移 Connector Runtime、Source、RawSignal、Checkpoint/Budget/Risk Guard；建立 coverage 数据。

## Phase 4 — Opportunity Intelligence

Discovery generation、Angle/Theme/Promise generation、Value Evaluation v1、Research Gap、pairwise comparison。建立可 replay 的 evaluation runner。

## Phase 5 — Evidence & Research

迁移 Evidence 语义并 generalize；ResearchCase、KnowledgeGateway、外部检索/知识库 provenance。

## Phase 6 — Candidate & Programming

CandidateV2、ProgrammingContext、Series Fit、Today Slate、HumanDecisionV2。

## Phase 7 — Harness Workbench

建立 editorial-desk Harness profile/plugins/tools/conversation nodes；Harness 成为主要产品入口。保持 upstream compatibility layer。

## Phase 8 — Draft / Publication / Performance

迁移旧版成熟的 citation/risk/version/provenance；打通发布与真实 performance snapshot。

## Phase 9 — Calibration & Controlled Evolution

Gold Set、replay A/B、policy proposal、human approval、promotion gates；禁止 silent self-mutation。
