# Human Acquisition Acceptance v1

本文定义 Human Acquisition / HumanSubmission 在进入 MVP 实现前的最小验收边界。

## 1. 文档层验收

必须明确：

- Human Acquisition 与 Machine Acquisition 并列为发现入口；
- 正式入口对象为 `HumanSubmission`，不建立第二套 `HumanSignal`；
- `source_origin` 与 `acquisition_origin` 分离；
- 第三方 URL 保留第三方 Source Origin；
- 用户直接 assertion 保持 unverified；
- HumanSubmission 不等于 Confirmed Fact / Positive Label / Opportunity / Candidate / Adopt；
- `HUMAN_SEED` 是 Discovery Trigger，而不是价值判断；
- Candidate 前必须有 Editorial Advantage；
- Calibration 使用 `Submission → Evaluation → Decision + reason` trajectory。

## 2. MVP 最小实现验收

首版至少支持：

```text
URL Submission
Text / Question / Idea Submission
```

并能完成：

```text
HumanSubmission
→ normalization / fetch
→ RawSignal
→ Discovery(HUMAN_SEED)
→ Opportunity or no-op/reject outcome
→ optional Research
→ Evaluation
→ Adopt / Watch / Drop
```

## 3. 负向验收

以下任何情况出现都应视为 FAIL：

- 用户粘贴 Reddit URL 后系统把 source 只记为 human；
- Submission 自动创建 Candidate；
- Submission 自动标记为正偏好；
- 用户断言未经证据直接成为 Confirmed Fact；
- Human flow 使用一套与 Machine flow 不兼容的 Subject/Discovery/Evidence 模型；
- Human Submission UI 要求用户先填写内部 Mission/Score/Rubric 字段；
- 系统只复述原始输入，却无法说明 Editorial Advantage。

## 4. 非阻塞扩展

以下不阻塞 MVP v0.1：

- 图片/截图/文件 Submission；
- 浏览器分享扩展；
- 手机系统 Share Sheet；
- 自动从聊天记录抽取 Seed；
- 多人协作 Submission Inbox；
- Submission 推荐标签/栏目自动化。
