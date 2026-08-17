# DeepSeek Harness Integration

## 官方现状基线（2026-08-17）

DeepSeek Harness 官方仓库说明其为 open-source agent harness，采用“everything is a plugin”的 Cordis 架构；当前处于 **Developer Preview**，官方明确提醒会出现 compatibility-breaking changes。官方 Architecture 文档同时提供 profile、bundle、tool registry、session log、agent loop、jobs、goals、Conversation Node 与 capability seam 等扩展点。

官方参考：
- https://github.com/deepseek-ai/deepseek-harness
- https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md

## 本项目定位

Harness 不是一个“额外聊天框”，也不是 Editorial Intelligence Core。它承担：

- 主要 Workbench Shell。
- Agent session / replay / interaction runtime。
- Tools / Jobs / approval / goal / subagent orchestration。
- 编辑机会、研究结果、证据卡、候选、任务进度的交互呈现。

## 集成规则

1. 优先 out-of-tree plugin/profile/bundle/tool，不 patch upstream core。
2. 固定 upstream commit/version，并保留 compatibility adapter。
3. Harness tool 只调用 Editorial Intelligence API；不得绕过 domain service 直接写数据库。
4. Session log 是运行轨迹，不是 Subject/Candidate/Decision 的唯一事实源。
5. 需要在 UI 长期展示的业务状态由 API 重建；需要 session replay 的交互事实才进入 Harness session event。
6. Harness breaking change 只能影响 adapter，不得迫使业务表迁移。

## 预期 Tools

方向示例：`list_opportunities`、`inspect_opportunity`、`generate_angles`、`start_research`、`evaluate_opportunity`、`compare_candidates`、`build_daily_slate`、`record_editorial_decision`、`create_draft`。

Tool contract 在业务 Domain 稳定后再冻结，当前不提前实现。
