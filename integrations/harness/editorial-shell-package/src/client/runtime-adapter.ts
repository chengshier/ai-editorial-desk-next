import type {
  ClientContext,
  ConversationSnapshot,
  SessionId,
} from '@deepseek-ai/dsh-client-runtime/client'

export type ResearchRuntimePhase =
  | 'resolving'
  | 'opening-session'
  | 'waiting-research'
  | 'prompting'
  | 'ready'
  | 'error'

export interface ResearchRuntimeTarget {
  researchCaseId: string
  opportunityId: string
}

export interface ResearchRuntimeStatus {
  phase: ResearchRuntimePhase
  message: string
  sessionId?: string
  error?: string
}

export interface ResearchRuntimeReady {
  researchCaseId: string
  opportunityId: string
  sessionId: string
  replayReady: boolean
}

export interface HarnessRuntimeAdapter {
  ensureResearch(
    target: ResearchRuntimeTarget,
    onStatus?: (status: ResearchRuntimeStatus) => void,
  ): Promise<ResearchRuntimeReady>
}

interface ResearchBindingWire {
  research_case_id: string
  opportunity_id: string
  harness_session_id: string | null
  bootstrap_required: boolean
}

interface ResearchProgressWire {
  status: 'queued' | 'running' | 'completed'
}

interface ObservableSource<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function requestJson<T>(apiBase: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`${response.status} ${response.statusText}${body ? `: ${body}` : ''}`)
  }
  return response.json() as Promise<T>
}

function waitForSnapshot<T>(
  source: ObservableSource<T>,
  predicate: (snapshot: T) => boolean,
  timeoutMs: number,
  label: string,
): Promise<T> {
  const initial = source.getSnapshot()
  if (predicate(initial)) return Promise.resolve(initial)

  return new Promise<T>((resolve, reject) => {
    let settled = false
    let unsubscribe: () => void = () => {}
    let timer = 0
    const finish = (value: T): void => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      unsubscribe()
      resolve(value)
    }
    const check = (): void => {
      const snapshot = source.getSnapshot()
      if (predicate(snapshot)) finish(snapshot)
    }
    unsubscribe = source.subscribe(check)
    timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      unsubscribe()
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
    check()
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

function hasDurableResearchResult(snapshot: ConversationSnapshot, researchCaseId: string): boolean {
  const chat = snapshot.views.get('chat')
  if (!isRecord(chat)) return false
  const legacy = chat.legacy
  if (!isRecord(legacy) || !Array.isArray(legacy.nodes)) return false
  return legacy.nodes.some((node) => {
    if (!isRecord(node) || node.kind !== 'tool-result' || !isRecord(node.meta)) return false
    return node.meta.research_case_id === researchCaseId
      && Array.isArray(node.meta.evidence)
      && typeof node.meta.conclusion === 'string'
  })
}

function bootstrapPrompt(target: ResearchRuntimeTarget): string {
  return [
    '这是 AI Editorial Desk Product Shell 主动发起的既有 Research Case 恢复任务。',
    `research_case_id: ${target.researchCaseId}`,
    `opportunity_id: ${target.opportunityId}`,
    '不要创建新的 Research Case，不要要求用户重新描述任务。',
    '请调用 get_editorial_research_result，参数必须使用上面的 research_case_id。',
    '读取后保留结构化 Tool Result，供 Product Shell / Harness replay 重建 Evidence、Unknown 和 Conclusion。',
    '完成 Tool 调用后只需简短确认研究上下文已恢复。',
  ].join('\n')
}

async function waitForResearchCompletion(apiBase: string, researchCaseId: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const state = await requestJson<ResearchProgressWire>(
      apiBase,
      `/api/v1/spike/research-cases/${encodeURIComponent(researchCaseId)}`,
    )
    if (state.status === 'completed') return
    await sleep(220)
  }
  throw new Error(`Research Case ${researchCaseId} did not reach completed state`)
}

async function getBinding(apiBase: string, researchCaseId: string): Promise<ResearchBindingWire> {
  return requestJson<ResearchBindingWire>(
    apiBase,
    `/api/v1/integrations/harness/runtime/research/${encodeURIComponent(researchCaseId)}`,
  )
}

async function bindSession(
  apiBase: string,
  researchCaseId: string,
  sessionId: SessionId,
): Promise<ResearchBindingWire> {
  return requestJson<ResearchBindingWire>(
    apiBase,
    `/api/v1/integrations/harness/runtime/research/${encodeURIComponent(researchCaseId)}/session`,
    {
      method: 'POST',
      body: JSON.stringify({ harness_session_id: sessionId }),
    },
  )
}

async function markBootstrapComplete(
  apiBase: string,
  researchCaseId: string,
  sessionId: SessionId,
): Promise<void> {
  await requestJson<ResearchBindingWire>(
    apiBase,
    `/api/v1/integrations/harness/runtime/research/${encodeURIComponent(researchCaseId)}/bootstrap-complete`,
    {
      method: 'POST',
      body: JSON.stringify({ harness_session_id: sessionId }),
    },
  )
}

async function resolveSession(
  ctx: ClientContext,
  apiBase: string,
  target: ResearchRuntimeTarget,
  initial: ResearchBindingWire,
): Promise<{ binding: ResearchBindingWire; sessionId: SessionId }> {
  const sessions = await waitForSnapshot(
    ctx.sessions.list,
    snapshot => snapshot.phase === 'ready',
    15_000,
    'Harness session baseline',
  )
  const requestedRaw = initial.harness_session_id
  if (requestedRaw) {
    const requested = requestedRaw as SessionId
    if (sessions.byId[requested] !== undefined) {
      ctx.sessions.open(requested)
      return { binding: initial, sessionId: requested }
    }
  }

  const workspaces = await waitForSnapshot(
    ctx.workspaces.list,
    snapshot => snapshot.baselinesReady,
    15_000,
    'Harness workspace baseline',
  )
  const workspaceId = workspaces.recentWorkspaceId ?? workspaces.items[0]?.workspaceId
  if (workspaceId === undefined) {
    throw new Error('Harness has no Workspace available. Register or open a Workspace before running Research.')
  }
  const sessionId = await ctx.workspaces.connectWorkspace(workspaceId)
  ctx.sessions.open(sessionId)
  const rebound = await bindSession(apiBase, target.researchCaseId, sessionId)
  return { binding: rebound, sessionId }
}

async function ensureResearchRuntime(
  ctx: ClientContext,
  apiBase: string,
  target: ResearchRuntimeTarget,
  onStatus?: (status: ResearchRuntimeStatus) => void,
): Promise<ResearchRuntimeReady> {
  const publish = (status: ResearchRuntimeStatus): void => { onStatus?.(status) }
  publish({ phase: 'resolving', message: '正在读取 Research Case 的 Harness runtime binding…' })
  let binding = await getBinding(apiBase, target.researchCaseId)
  if (binding.opportunity_id !== target.opportunityId) {
    throw new Error('Runtime binding opportunity_id does not match the canonical Research Case')
  }

  publish({ phase: 'opening-session', message: '正在恢复或创建 Harness Session…' })
  const resolved = await resolveSession(ctx, apiBase, target, binding)
  binding = resolved.binding
  const sessionId = resolved.sessionId

  if (!binding.bootstrap_required) {
    publish({ phase: 'ready', message: 'Harness Session 已恢复，Research replay 已就绪。', sessionId })
    return {
      researchCaseId: target.researchCaseId,
      opportunityId: target.opportunityId,
      sessionId: String(sessionId),
      replayReady: true,
    }
  }

  const runtimeBinding = ctx.sessions.binding(sessionId)
  if (runtimeBinding === undefined) throw new Error(`Harness Session ${sessionId} has no runtime binding`)

  if (!hasDurableResearchResult(runtimeBinding.session.getSnapshot(), target.researchCaseId)) {
    publish({ phase: 'waiting-research', message: 'Research Case 已绑定 Session，正在等待 canonical research result…', sessionId })
    await waitForResearchCompletion(apiBase, target.researchCaseId)
    publish({ phase: 'prompting', message: 'Research Case 已完成，正在主动驱动 Harness Agent 恢复结构化结果…', sessionId })
    const promptResult = await runtimeBinding.session.prompt(
      [{ type: 'text', text: bootstrapPrompt(target) }],
      'queue',
    )
    if (!promptResult.ok) {
      throw new Error(`Harness prompt failed: ${promptResult.error.code}: ${promptResult.error.message}`)
    }
    await waitForSnapshot(
      runtimeBinding.session,
      snapshot => hasDurableResearchResult(snapshot, target.researchCaseId),
      90_000,
      'Research Tool Result replay',
    )
  }

  await markBootstrapComplete(apiBase, target.researchCaseId, sessionId)
  publish({ phase: 'ready', message: 'Harness Agent 已恢复 Research Tool Result，可通过 Session replay 继续。', sessionId })
  return {
    researchCaseId: target.researchCaseId,
    opportunityId: target.opportunityId,
    sessionId: String(sessionId),
    replayReady: true,
  }
}

export function createHarnessRuntimeAdapter(ctx: ClientContext, apiBase: string): HarnessRuntimeAdapter {
  const inFlight = new Map<string, Promise<ResearchRuntimeReady>>()
  return {
    ensureResearch(target, onStatus) {
      const key = target.researchCaseId
      const existing = inFlight.get(key)
      if (existing) return existing
      const task = ensureResearchRuntime(ctx, apiBase, target, onStatus)
        .catch((reason: unknown) => {
          onStatus?.({
            phase: 'error',
            message: 'Harness Runtime 恢复失败；Research Case 业务对象仍然保留。',
            error: reason instanceof Error ? reason.message : String(reason),
          })
          throw reason
        })
        .finally(() => { inFlight.delete(key) })
      inFlight.set(key, task)
      return task
    },
  }
}
