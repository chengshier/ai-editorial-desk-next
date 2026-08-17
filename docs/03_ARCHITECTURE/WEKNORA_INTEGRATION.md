# WeKnora Integration

## 官方现状基线（2026-08-17）

Tencent WeKnora 是开源知识平台，当前提供 RAG 检索、Agent、Wiki、API Key、知识库管理、MCP 等能力；官方仓库当前版本信息和能力仍在快速演进。

官方参考：
- https://github.com/Tencent/WeKnora

## 定位

```text
PostgreSQL = business truth
WeKnora    = editorial knowledge / retrieval memory
```

适合进入 WeKnora 的内容：编辑方法论、账号定位、栏目规则、优秀/失败案例、历史稿件、复盘、平台规则、人物/行业/历史/书影音背景、研究资料。

禁止把以下对象只存于 WeKnora：Subject canonical record、Evidence verification truth、Opportunity status、Candidate rank snapshot、Human Decision、Publication、Performance。

## Gateway

Core 不直接散落调用 WeKnora API。统一：

```text
Consumer
→ KnowledgeGateway
→ KnowledgeProvider
→ WeKnoraProvider
```

V1 provider interface 至少预留：search、retrieve、find_similar_cases、get_editorial_policy、get_historical_examples。

## REST 与 MCP

核心业务检索优先走 REST/Gateway，以获得可测试 schema、timeout、provenance、cache 与 replay。未来 Harness Research Agent 可在受控工具白名单下使用 MCP，但不得借 MCP 绕过业务权限与审计。

## Retrieval Provenance

任何影响 Evaluation/Draft 的知识检索都应保存：provider、knowledge base、query hash、retrieved item ids、scores/metadata、retrieved_at、tool/request version；不能只保存最终模型答案。
