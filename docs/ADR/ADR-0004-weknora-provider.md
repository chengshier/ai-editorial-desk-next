# ADR-0004 — WeKnora as Knowledge Provider

Status: **Accepted**  
Date: 2026-08-17

WeKnora 用于编辑知识、历史案例、背景资料、RAG/Wiki 检索。所有调用通过 Knowledge Gateway / Provider abstraction；核心业务检索优先 REST contract，Harness Agent 可在后续受控开放 MCP。
