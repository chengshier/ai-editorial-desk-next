# WeKnora Integration

## 官方现状基线（2026-08-17）

Tencent WeKnora 是开源知识平台，当前提供 RAG 检索、Agent、Wiki、知识库管理、API Key、MCP 等能力；官方仓库仍在快速演进。

官方参考：
- https://github.com/Tencent/WeKnora

## 核心定位

```text
PostgreSQL = canonical business truth
WeKnora    = editorial knowledge / retrieval memory
Harness    = agent runtime / interaction trajectory
```

三者职责不能互换。

## 适合进入 WeKnora 的内容

建议按知识用途而不是按文件类型组织：

### Editorial Method
- AI 编辑部方法论；
- Editorial Value Rubric 的说明材料；
- 编辑 SOP / Research SOP；
- 风险与事实核查规范。

### Account / Audience / Series
- 账号定位；
- Audience 假设；
- 栏目/Series 内容承诺；
- 语气/风格/表达规则。

### Historical Editorial Memory
- 已发布内容；
- 优秀/失败稿件；
- Adopt/Drop/Watch 的可检索解释副本；
- 复盘与经验总结；
- 高质量 Hook / Angle / Theme 案例。

### Background Knowledge
- 人物、技术、行业、历史；
- 书籍/电影/音乐/文化背景；
- 研究报告、内部整理文档；
- 平台规则与表达风险资料。

WeKnora 中的历史 Decision/Performance 文本只能作为检索副本或知识材料，canonical record 仍在 PostgreSQL。

## 禁止只存于 WeKnora 的对象

- Subject canonical record；
- Evidence verification truth；
- Discovery / Opportunity lifecycle；
- Candidate/Programming snapshot；
- Human Decision canonical event；
- Research Case canonical state；
- Publication；
- Performance。

## Gateway

Core 不直接散落调用 WeKnora API。统一：

```text
Consumer
→ KnowledgeGateway
→ KnowledgeProvider
→ WeKnoraProvider
```

Provider interface 至少预留：
- `search`
- `retrieve`
- `find_similar_cases`
- `get_editorial_policy`
- `get_historical_examples`

后续可以增加 provider，而不修改 Editorial Domain。

## REST 与 MCP

### Core / deterministic business flow
优先：

```text
Backend
→ KnowledgeGateway
→ WeKnora REST/API
```

理由：schema、timeout、provenance、cache、replay、contract test 更容易治理。

### Harness / exploratory research
未来可允许 Research Agent 通过受控 Tool/MCP 使用 WeKnora，但默认仍优先调用本项目 Knowledge Tool / Gateway，避免 Harness 直接绕过业务权限和审计。

MCP 是 Agent capability，不是 canonical data plane。

## Knowledge Ingestion

V1 不要求一开始就把全部资料自动同步进 WeKnora。

建议顺序：
1. 先建立 KnowledgeProvider Contract；
2. 导入少量方法论/Profile/Benchmark/历史案例；
3. 验证 retrieval provenance；
4. 再决定哪些 Publication/Review 文档自动形成知识副本。

禁止把“同步进知识库”与业务 transaction 强绑定：WeKnora 临时不可用不应导致 Human Decision/Publication 主事务失败。

## Retrieval Provenance

任何影响 Evaluation/Draft 的知识检索都应保存：
- provider；
- knowledge base / collection scope；
- query hash / query version；
- retrieved item ids；
- scores/metadata；
- retrieved_at；
- gateway/provider version。

不能只保存最终模型答案。

## Staleness / Authority

知识库检索结果属于参考材料，不自动升级为 Confirmed Evidence。Research/Evidence 层仍需判断：来源、时效、权威性、是否需要新的原始来源验证。

因此：

```text
Knowledge Hit != Fact
Knowledge Hit != Confirmed Claim
```

## 实施时机

Architecture Baseline 先冻结接口与边界；完整 WeKnora 接入放在 Research/Knowledge 阶段。这样可以提前规划而不让 V1 核心开发依赖某一版 WeKnora 内部实现。