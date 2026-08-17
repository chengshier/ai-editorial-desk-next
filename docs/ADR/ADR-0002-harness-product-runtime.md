# ADR-0002 — DeepSeek Harness as Product Runtime

Status: **Accepted**  
Date: 2026-08-17

## Decision

DeepSeek Harness 作为 AI Editorial Desk 的主要 Agent Runtime 与 Workbench Shell，但 Editorial Intelligence Core 保持独立业务边界。

## Rationale

Harness 官方采用 plugin/profile/bundle/capability seam 架构，并提供 session/tool/job/agent/UI 扩展能力，适合承载编辑部交互；同时官方当前为 Developer Preview，存在 breaking changes，因此不能把业务真相绑在其内部结构。

## Consequence

通过 out-of-tree integration + pinned upstream + compatibility adapter 接入，默认不 fork core。
