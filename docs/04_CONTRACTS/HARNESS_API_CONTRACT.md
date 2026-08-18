# Harness API Contract v1

> 本文冻结通信原则和最小业务形状，不冻结所有最终 HTTP 路由。

## 1. 传输

V1 首选 `HTTPS + JSON`。长任务允许 `SSE` 或轮询读取进度；是否引入 WebSocket 需单独 ADR。

Harness 不直接访问 PostgreSQL、WeKnora 或 ORM；所有业务调用进入 `apps/editorial_api`。

## 2. Tool → API 原则

Harness Tool：
- 输入使用稳定业务 id / typed args；
- 返回 canonical structured JSON；
- 不从自然语言文本反解析 id/status；
- 写操作必须携带 actor/context 与 idempotency key；
- 基础设施失败通过 Tool error；业务上的“不可执行/需研究/需确认”使用结构化成功结果表达。

## 3. 最小读模型

### OpportunitySummary

```json
{
  "opportunity_id": "...",
  "headline": "...",
  "subject": {"id": "...", "type": "...", "name": "..."},
  "angle": "...",
  "theme": "...",
  "audience_promise": "...",
  "why_now": "...",
  "recommendation": "today_main",
  "confidence": "high",
  "value_highlights": [],
  "research_status": "not_started",
  "evidence_state": {"open_unknown_count": 0},
  "production_readiness": "medium"
}
```

禁止只返回一个 total score 代替上述语义。

## 4. 典型 Tool 映射

| Harness Tool | Backend Use Case |
|---|---|
| `list_opportunities` | 查询 Programming/Opportunity Read Model |
| `inspect_opportunity` | UC-OPP-002 |
| `generate_angles` | UC-OPP-003 |
| `evaluate_opportunity` | UC-EVAL-001/002 |
| `compare_candidates` | UC-EVAL-003 |
| `start_research` | UC-RES-001 |
| `get_research_progress` | UC-RES-002 |
| `build_daily_slate` | UC-PROG-001 |
| `record_editorial_decision` | UC-DEC-* |
| `create_draft` | UC-DRF-001/002 |

Tool 名称允许在 Spike 后微调，但业务 Use Case 不应跟随 UI 频繁变化。

## 5. 长任务契约

创建 Research Case 返回：

```json
{
  "research_case_id": "...",
  "status": "queued",
  "progress_url": "/api/v1/research-cases/...",
  "stream_url": "/api/v1/research-cases/.../events"
}
```

进度事件只包含可展示的业务事实，例如：

```json
{
  "research_case_id": "...",
  "status": "running",
  "stage": "primary_sources",
  "completed_steps": 2,
  "total_steps": 5,
  "message": "已获取官方来源，正在补充反方证据"
}
```

不得传输或展示模型隐藏 chain-of-thought。

## 6. 错误模型

建议统一：

```json
{
  "error": {
    "code": "RESEARCH_NOT_READY",
    "message": "...",
    "retryable": false,
    "details": {}
  }
}
```

需要区分：
- not found；
- validation；
- conflict/stale context；
- risk blocked；
- provider unavailable；
- budget exceeded；
- transient infrastructure failure。

`Unavailable` 不得被编码成数值 0。

## 7. 写操作与安全

写操作至少保存：
- actor；
- request/idempotency key；
- reason（需要人工理由的操作）；
- current context hash/version；
- risk acknowledgement（适用时）。

Harness approval 机制可以作为 UI/runtime guard，但最终 Domain Service 仍必须执行服务端权限/风险校验。

## 8. 版本化

API 公开模型、Tool contract、Evaluation schema 分开版本化。

Harness compatibility adapter 可以适配 upstream 变化，但不得静默改变业务 API 语义。