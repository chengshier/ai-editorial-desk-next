# Use Case Catalog v1

本文给后续 API、Tool、测试和权限设计提供统一编号。Use Case 描述业务动作，不等同于具体 HTTP 路由。

## Discovery / Opportunity

| ID | Use Case | 主要输入 | 主要输出 |
|---|---|---|---|
| UC-DISC-001 | 运行 Discovery Scout | mission, budget, context | discoveries |
| UC-DISC-002 | 查看 Discovery | discovery_id | discovery detail |
| UC-OPP-001 | 从 Discovery 生成 Opportunities | discovery_id, profile | opportunities |
| UC-OPP-002 | 查看 Opportunity | opportunity_id | full opportunity view |
| UC-OPP-003 | 生成替代 Angle | opportunity_id, intent | sibling/alternative angles |
| UC-OPP-004 | 更新人工编辑备注 | opportunity_id, note, actor | append-only note/event |

## Evaluation

| ID | Use Case | 主要输入 | 主要输出 |
|---|---|---|---|
| UC-EVAL-001 | 评价 Opportunity | opportunity_id, profile, mode | value evaluation |
| UC-EVAL-002 | 重新评价 | opportunity_id, previous evaluation/context | new evaluation version |
| UC-EVAL-003 | Pairwise Compare | opportunity/candidate ids, programming context | comparative rationale |

## Research / Evidence

| ID | Use Case | 主要输入 | 主要输出 |
|---|---|---|---|
| UC-RES-001 | 创建 Research Case | opportunity_id, goals | research_case_id |
| UC-RES-002 | 查看 Research Progress | research_case_id | progress/status |
| UC-RES-003 | 追加 Research Goal | research_case_id, goal | updated research plan |
| UC-RES-004 | 取消 Research | research_case_id, actor | terminal state |
| UC-EVD-001 | 查看 Evidence | opportunity/subject scope | claims/unknowns/sources |
| UC-EVD-002 | 人工验证 Claim | claim_id, decision, reason, actor | append-only verification |
| UC-EVD-003 | 处理 Unknown | unknown_id, action, note | updated unknown state |

## Candidate / Programming / Decision

| ID | Use Case | 主要输入 | 主要输出 |
|---|---|---|---|
| UC-CAN-001 | 形成 Candidate V2 | opportunity_id, evaluation_id | candidate |
| UC-PROG-001 | 构建 Programming Slate | context/profile/date | ranked/grouped slate |
| UC-PROG-002 | 查看某 Series/Context 候选池 | context | candidates |
| UC-DEC-001 | Adopt | candidate/opportunity, reason, actor | human decision |
| UC-DEC-002 | Watch | candidate/opportunity, reason, actor | human decision |
| UC-DEC-003 | Drop | candidate/opportunity, reason, actor | human decision |
| UC-DEC-004 | Archive | candidate/opportunity, reason, actor | human decision |

## Draft / Publication / Performance

| ID | Use Case | 主要输入 | 主要输出 |
|---|---|---|---|
| UC-DRF-001 | 创建 Draft Preview | adopted opportunity, format | preview |
| UC-DRF-002 | 保存 Draft | provenance + content | draft version |
| UC-DRF-003 | 人工 Revision | draft_id, change note | new version |
| UC-PUB-001 | 记录 Publication | draft/decision/platform | frozen publication record |
| UC-PERF-001 | 写入 Performance Snapshot | publication_id, observed metrics | append-only snapshot |

## Knowledge

| ID | Use Case | 主要输入 | 主要输出 |
|---|---|---|---|
| UC-KNOW-001 | 搜索编辑知识 | query, scope | retrieval results with provenance |
| UC-KNOW-002 | 找历史相似案例 | opportunity/profile | historical cases |
| UC-KNOW-003 | 获取 Editorial Policy/Profile Context | profile/version | policy context |

## Harness Tool 映射原则

一个 Harness Tool 可以组合一个或多个只读 Use Case，但任何写操作必须明确映射到一个写 Use Case，并保留 actor、idempotency、reason/risk acknowledgement 等约束。

API/Tool 命名可演化，Use Case ID 作为文档与测试追踪标识稳定保留。