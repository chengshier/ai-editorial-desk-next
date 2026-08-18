# Editorial Benchmark Spec

## 目标

Benchmark 用于验证 Editorial Value Model 是否能预测/解释人工编辑判断，而不是证明某个 LLM “得分很高”。

## 当前探索基础

已完成 44 条人工素材判断，用于发现维度与反例。它们不是正式训练集，也不直接形成统计结论。

## 正式数据计划

- Benchmark Corpus：200–400 个真实案例，覆盖好/坏/模糊与多领域。
- Human Gold Set：60–100 个由编辑本人标注的核心样本。
- 保存 `想看 / 会做 / 去向 / 原因`，以及关键 pairwise 选择。
- 不要求人工给 0–100 维度分。

## 评估类型

1. classification：做/可能/不做。
2. destination：主推/栏目/储备/不收录。
3. pairwise preference。
4. TOP-k / slate overlap。
5. rationale quality：能否命中真正原因，而非事后套话。
6. calibration：confidence 与错误率是否一致。

## 版本化

每轮评估必须绑定 corpus version、gold version、rubric version、policy version、prompt/model version，结果不得覆盖历史。
