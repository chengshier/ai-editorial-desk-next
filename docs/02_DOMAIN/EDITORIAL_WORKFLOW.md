# Editorial Workflow V2

## 用户视角

工作台打开时应首先呈现已经发现并初步判断的编辑机会，而不是要求用户手工启动一次采集。

建议工作状态：

```text
SEEN
→ INTERESTING
→ WATCHING / RESEARCHING
→ CANDIDATE
→ ADOPTED / DROPPED / ARCHIVED
→ DRAFTING
→ PUBLISHED
→ LEARNED
```

状态与 Human Decision 不应被混成一个字段；例如 Opportunity 可以仍处于 CANDIDATE while latest human decision = WATCH。

## AI 可做

- 提取/合并 Subject。
- 发现 Discovery。
- 生成多个 Angle/Theme/Promise。
- 识别 Research Gap。
- 调用知识库与外部研究工具。
- 生成 Value Evaluation。
- 做 pairwise comparison / programming recommendation。
- 生成 brief、pack、draft proposal。

## 必须人工确认

- Claim 的最终高风险确认规则按 Evidence policy 执行。
- Adopt/Drop 等编辑决定。
- 高风险内容发布。
- Rubric/Policy/Prompt 的生产版本提升。
