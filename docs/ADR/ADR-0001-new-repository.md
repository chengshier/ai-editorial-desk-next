# ADR-0001 — New Repository Instead of In-place Rewrite

Status: **Accepted**  
Date: 2026-08-17

## Decision

使用 `ai-editorial-desk-next` 独立仓库开发新 V1；旧 `ai-editorial-desk` 冻结为 Legacy MVP 与复用来源。

## Why

旧核心在模型、服务、API、测试中深度绑定 `Event → Trend → EditorialScore → DailyCandidate`。新产品已把评价单位改为 Editorial Opportunity，并支持非 Event、非 Trend 驱动内容。原地改造会留下大量语义兼容陷阱和隐式约束。

## Consequence

有价值能力必须逐项 port，而不是运行时 import 旧仓库。Legacy 数据通过 bridge/migration 处理。
