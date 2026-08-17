# 00 — Start Here

**Architecture Baseline:** v1  
**Baseline date:** 2026-08-17  
**Repository:** `chengshier/ai-editorial-desk-next`

## 当前目标

本仓库正在建立 AI Editorial Desk 的新一代架构基线。此阶段先冻结“我们在构建什么、核心对象是什么、哪些旧能力复用、Harness/WeKnora 如何接入、哪些规则绝对不能破坏”，再进入业务实现。

## 必读

- `CURRENT_STATE.md`：当前阶段与允许/禁止事项。
- `DECISIONS.md`：已冻结决策索引。
- `01_PRODUCT/PRODUCT_VISION.md`：产品目标。
- `01_PRODUCT/GLOSSARY.md`：统一术语。
- `02_DOMAIN/DOMAIN_MODEL.md`：核心领域模型。
- `02_DOMAIN/EDITORIAL_VALUE_MODEL.md`：编辑价值判断语言。
- `03_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`：系统边界。
- `03_ARCHITECTURE/HARNESS_INTEGRATION.md`：DeepSeek Harness 集成。
- `03_ARCHITECTURE/WEKNORA_INTEGRATION.md`：知识层边界。
- `05_MIGRATION/LEGACY_REUSE_AUDIT.md`：旧项目复用策略。
- `07_DELIVERY/IMPLEMENTATION_ROADMAP.md`：实施顺序。

## 新核心主链

```text
RawSignal
→ SubjectObservation
→ Subject
→ Discovery
→ EditorialOpportunity
→ EditorialValueEvaluation
→ Research
→ CandidateV2
→ EditorialProgramming
→ HumanDecisionV2
→ Draft
→ Publication
→ Performance
→ Learning / Calibration
```

## 一句话边界

**持续发现“值得讲的东西”，而不是持续给热点 Event 排一个总分。**
