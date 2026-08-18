# WeKnora Integration

WeKnora 是 Knowledge Provider，而不是 AI Editorial Desk 的业务数据库。

目标调用链：

```text
Editorial Core / Harness Tool
→ Knowledge Gateway
→ KnowledgeProvider
→ WeKnora Adapter
→ WeKnora REST API
```

未来可按需要为 Harness Research Agent 开放受控 MCP 能力，但核心业务检索首先通过可测试、可审计的 Gateway 接口。

实现前阅读 `docs/03_ARCHITECTURE/WEKNORA_INTEGRATION.md`。
