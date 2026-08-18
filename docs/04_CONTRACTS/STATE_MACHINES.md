# State Machines — Draft

## Opportunity lifecycle

建议第一版：

```text
DISCOVERED
→ EVALUATED
→ WATCHING / RESEARCHING / READY
→ CANDIDATE
→ ARCHIVED
```

生命周期描述“业务处理进度”，不替代 Human Decision。

## ResearchCase

```text
OPEN → RUNNING → PARTIAL / COMPLETED / FAILED / CANCELLED
```

Research 完成不代表 Opportunity 必须进入 Candidate；完成后必须重新 Evaluation 或显式记录无需重评原因。

## Candidate

Candidate 是某个 Opportunity 在特定 generation/programming context 的不可变快照。排序变化创建新快照/Run，不原地篡改历史名次。

## Human Decision

```text
ADOPT / WATCH / DROP / ARCHIVE
```

采用 append-only decision chain。允许后续新 Decision 引用 previous decision，但不得 update 历史决定。
