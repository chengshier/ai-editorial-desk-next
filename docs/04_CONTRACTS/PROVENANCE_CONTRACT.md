# Provenance Contract

系统必须能够回答：

1. 当时实际看到了什么？
2. 为什么看到了它？
3. 系统如何把它解释为 Subject/Discovery？
4. AI 为什么给出此 Opportunity/Angle/Evaluation？
5. 人工最终做了什么决定、为什么？
6. 发布了哪个版本？
7. 后来表现如何？
8. 如果今天重放，哪些 policy/model/source 已经不同？

## 四类数据必须分离

- **Observed Facts**：RawSignal、source、collection run、coverage。
- **Machine Judgement**：discovery/evaluation/AI generation，必须版本化。
- **Human Decision**：append-only editor decision/reason。
- **Outcome**：publication/performance observation。

## 最低 AI provenance

model/provider、task/route、prompt version、schema version、policy/rubric version、input hash、AI invocation id、created_at、actor/requester。

## Acquisition Coverage

未来必须保存 collection coverage，以区分“看到了但判低价值”和“根本没有采到”。
