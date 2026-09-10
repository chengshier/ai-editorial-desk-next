# Scheduler / Headless Orchestration Contract

> Status: ACTIVE / S4-N4
>
> Harness baseline: `deepseek-ai/deepseek-harness@99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` (`dsh@0.1.0-rc.7`)
>
> 本文只冻结 AI Editorial Desk 的 Scheduler / Orchestrator 与 Harness headless runtime 之间的 outward contract；不改变 ADR-0010 已冻结的 Harness-native Product Shell 架构。

## 1. 目标

标准编辑任务必须能够在用户没有打开浏览器、没有进入 stock Harness Chat、没有手工 prompt 的情况下主动执行：

```text
Schedule / Event / Manual Product Command
→ Editorial Scheduler / Orchestrator
→ exact-pinned Harness headless outward seam
→ Agent / Tool
→ Editorial API / PostgreSQL
→ Product Shell
```

Scheduler 负责“什么时候执行、执行哪一个业务操作、执行结果是什么”；Harness 负责 Agent runtime。两者不得互相替代。

## 2. exact-pin upstream 事实矩阵

| Seam | pinned Harness 事实 | N4 决策 |
|---|---|---|
| TypeScript SDK | `@deepseek-ai/dsh-sdk-client` 是稳定 Product API；通过 subprocess + stdio JSON-RPC 驱动完整 Harness runtime；`DeepSeekHarness.run()` 从 durable inbox receipt 收集到 whole-agent `idle` | **PRIMARY** headless execution seam |
| SDK JSON-RPC protocol | `initialize` / `session/prompt` / `shutdown`；服务端发 `session.event` / `session.status`；`messageId` 只表示 enqueue receipt，不是业务完成结果 | 只作为 SDK 底层 transport，不自行扩展 private RPC |
| ACP | automation-only；有 `session/cancel`，但只支持 fresh session，不支持 load/list/resume/fork | SECONDARY；仅适合不需要 durable named-session continuity 的隔离任务 |
| Harness `schedule/` | Session-local reminder；冷 Session 只有重新 live 后才 catch up；无 public Scheduler service / mutable DB | **禁止作为 AI Editorial Desk 系统 Scheduler** |
| Web Session API | 适合 Product Shell 内当前 live Harness runtime | 不作为无人值守调度入口 |

### 2.1 为什么 N4 首选 SDK 而不是 ACP

N4 需要把 `research_case_id` 等业务对象与可重建的 runtime provenance 关联，同时允许后续 continuation / rehydrate。SDK 明确支持 caller-owned named `sessionId` 与 subprocess 生命周期；ACP 当前 exact pin 只支持 fresh session，因此不能承担需要 session continuity 的主路径。

ACP 的 `session/cancel` 比 SDK 更细，但不能抵消 fresh-session-only 的限制。N4 首版通过 **每次 SchedulerRun 独占一个 SDK-owned runtime subprocess** 获得清晰的 timeout / cancellation process boundary；未来若引入常驻 runtime/pool，必须另行证明不会破坏隔离、取消与幂等不变量。

## 3. Canonical identity

以下身份必须分层：

```text
Business identity
- SchedulerTask.id
- SchedulerRun.id
- opportunity_id
- research_case_id
- candidate_id / draft_id / publication_id ...

Runtime metadata
- harness_session_id
- harness process / transport metadata
- Harness event / message ids
```

强制规则：

- PostgreSQL / Editorial API 是 SchedulerTask / SchedulerRun 与编辑业务对象的 canonical truth；
- Harness Session / Message / process id 永远只是 runtime metadata；
- runtime 丢失不得删除、替换或重建业务对象 id；
- retry 可以获得新的 runtime metadata，但必须继续引用同一 business operation。

## 4. SchedulerTask contract

正式 durable model 在 N4-C 落地。字段语义先冻结：

```text
SchedulerTask
- task_id
- task_type
- enabled
- trigger_kind           manual | interval | schedule | event
- trigger_config
- operation
- business_scope
- catch_up_policy
- retry_policy
- timeout_seconds
- next_run_at
- last_run_at
- created_at / updated_at
```

`trigger_config` 不得包含 provider secret。Provider credential 只存在 server/runtime secret environment 或 credential provider 中。

## 5. SchedulerRun contract

```text
SchedulerRun
- run_id
- task_id?               manual slice 可为空
- operation
- business_object_type
- business_object_id
- trigger_kind
- status                 queued | running | succeeded | failed | cancelled | skipped
- idempotency_key
- attempt
- scheduled_for?
- started_at?
- finished_at?
- failure_code?
- failure_reason?
- runtime_provenance
- execution_provenance
```

`runtime_provenance` 至少允许记录：

```text
- harness_commit
- harness_release
- execution_seam = typescript-sdk-jsonrpc-stdio
- harness_session_id?
- provider?              名称可记录，secret 不可记录
- model?                 名称可记录
- completion_signal?
```

`execution_provenance` 至少允许记录 operation、business id、trigger kind、attempt 和输入 hash / operation hash；不得存储 API key、token、cookie 或其他 credential。

## 6. Headless execution request / result

Scheduler 与 headless runner 使用结构化 JSON，而不是 browser URL：

```json
{
  "scheduler_run_id": "run_...",
  "operation": "research.rehydrate",
  "research_case_id": "rc_...",
  "opportunity_id": "opp_...",
  "harness_session_id": null
}
```

runner 返回：

```json
{
  "ok": true,
  "scheduler_run_id": "run_...",
  "operation": "research.rehydrate",
  "harness_session_id": "session-...",
  "completion_signal": "agent_idle+canonical_tool_result",
  "tool_result_observed": true
}
```

业务上下文进入 Agent 时必须明确包含业务 id、operation 与允许调用的 Tool；不得靠 URL、DOM、localStorage 或 private store 传递。

## 7. 第一个 Vertical Slice：`research.rehydrate`

N4-B 首个 Manual Run 使用已经存在的 Research Case，证明：

```text
POST Run Now
→ SchedulerRun
→ exact-pinned SDK runner
→ get_editorial_research_result(research_case_id)
→ durable Harness event stream
→ canonical Tool Result observed
→ SchedulerRun succeeded / failed
```

约束：

- 不创建新的 Research Case；
- 不调用 `start_editorial_research`；
- 不把 deterministic fixture 声称为 production research；
- Product Shell 的 N3 browser runtime binding 与 headless SchedulerRun provenance 是不同 runtime metadata，不互相覆盖。

## 8. 完成判定

Harness SDK 的 `run()` 结束只证明本次 owned activity interval 已到 whole-agent `idle`，不能单独证明业务操作成功。

`research.rehydrate` 成功必须同时满足：

1. prompt 已有 durable inbox receipt；
2. Agent 到达 whole-agent `idle`；
3. owned interval 的 durable events 中观察到该 `research_case_id` 的 canonical `get_editorial_research_result` 结构化结果。

因此 `finalResponse` 不是业务成功条件。

## 9. Timeout / cancellation

exact pin SDK wire 没有 per-prompt cancel。N4 首版规则：

- 每个 SchedulerRun 独占一个 SDK-owned runtime subprocess；
- Scheduler timeout 时终止该 runner/runtime process；
- 记录 `failed` 或 `cancelled` 与明确 failure reason；
- 不通过杀死共享 Web Harness runtime 来取消后台任务；
- 未来若改为长驻 daemon / pool，必须先新增 Contract/ADR 说明 per-run isolation 和 cancellation。

## 10. Idempotency / duplicate-run protection

业务幂等由 Scheduler / Editorial API 保证，而不是依赖 Harness Session：

- `idempotency_key` 在同一 operation + business object scope 内唯一；
- 同 key + 同 payload 重试返回已有 run 或继续已有 run，不重复创建业务副作用；
- 同 key + 不同 payload 必须拒绝；
- Agent Tool 的写操作未来必须接受稳定 business id / operation key，并在 Editorial API 层重复保护；
- retry 不得通过生成新 business id 来“解决”重复执行。

N4-B 只有读型 `research.rehydrate`，仍实现 run-level duplicate protection，为后续写型任务建立不变量。

## 11. Retry / Catch-up

N4-E 才实现完整策略，但语义冻结：

- retry 是同一 SchedulerRun logical operation 的新 attempt；
- exponential backoff / max attempts 必须可配置；
- Catch-up 必须由 SchedulerTask policy 决定，不能由 Harness session-local reminder 隐式决定；
- missed interval 不得无界补跑；
- `Last Run` / `Next Run` 由 canonical Scheduler state 计算，不从 Harness transcript 推断。

## 12. Secret boundary

禁止进入 Product Shell / browser state：

- provider API key；
- bearer token；
- cookie；
- credential material；
-完整 child environment。

允许展示：provider/model 名称、run status、failure reason（脱敏后）、runtime session id 作为诊断 metadata。

## 13. N4-B transitional implementation boundary

为了先证明真实 headless execution skeleton，N4-B 允许 `SchedulerRun` 使用进程内 ledger 作为 **transitional test/store**，但必须满足：

- API 与对象语义按本文 contract；
- 明确标记 API restart 后不 durable；
- 不宣称 PostgreSQL Scheduler persistence 已完成；
- N4-C 必须把 Task / Run 迁入正式 durable repository / PostgreSQL 后，才能标记 durable model COMPLETE。

## 14. Gate

N4-B 可以标记 COMPLETE 需要同时满足：

- exact-pin SDK / protocol / ACP / schedule audit 已记录；
- Manual Run API 有 success/failure/idempotency tests；
- exact-pin CI 能机械验证 headless runner 解析的是公开 `@deepseek-ai/dsh-sdk-client`；
- runner 不依赖 Web UI / iframe / DOM / private store；
- PR #16 继续保持 Draft；
- 未要求用户手工 Chat prompt。

N4 完整 Gate 仍需 N4-C～N4-F：durable Task/Run、interval/schedule、retry/catch-up/history、event trigger 与 Product status UI。