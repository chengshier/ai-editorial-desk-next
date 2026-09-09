import { createElement, useSyncExternalStore } from 'react'
import type {
  ClientContext,
  ConversationSnapshot,
  SessionFace,
  SessionId,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { ResearchWorkspaceView } from './research-workspace.tsx'

interface EditorialLaunchConfig {
  launchId: string
  apiBase: string
}

interface LaunchDescriptorWire {
  launch_id: string
  intent: 'research' | 'agent'
  opportunity_id?: string | null
  research_case_id?: string | null
  harness_session_id?: string | null
  surface_url: string
  return_url: string
  transport: string
  bootstrap_required?: boolean
}

type LaunchPhase = 'resolving' | 'opening-session' | 'hydrating' | 'ready' | 'error'

interface LaunchStatus {
  phase: LaunchPhase
  message: string
  sessionId?: string
  error?: string
}

interface ObservableSource<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

interface MutableLaunchStatus extends ObservableSource<LaunchStatus> {
  set(value: LaunchStatus): void
}

interface EmbeddedRootInjected {
  launchStatus: MutableLaunchStatus
  resolveSession: (sessionId: SessionId) => SessionFace | undefined
}

type EmbeddedRootProps = PropsRuntime<'root'> & EmbeddedRootInjected

function createLaunchStatus(): MutableLaunchStatus {
  let snapshot: LaunchStatus = {
    phase: 'resolving',
    message: '正在解析 AI Editorial Desk Research launch…',
  }
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    set: (value) => {
      snapshot = value
      for (const listener of listeners) listener()
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readLaunchConfig(): EditorialLaunchConfig | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  if (params.get('editorial_embed') !== 'research') return null
  const launchId = params.get('editorial_launch')?.trim()
  const rawApiBase = params.get('editorial_api_base')?.trim()
  if (!launchId || !rawApiBase) return null

  let apiUrl: URL
  try {
    apiUrl = new URL(rawApiBase)
  } catch {
    return null
  }
  if (apiUrl.protocol !== 'http:' && apiUrl.protocol !== 'https:') return null
  return { launchId, apiBase: apiUrl.toString().replace(/\/$/, '') }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${response.status} ${response.statusText}${text ? `: ${text}` : ''}`)
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
    const fail = (): void => {
      if (settled) return
      settled = true
      unsubscribe()
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }
    const check = (): void => {
      const snapshot = source.getSnapshot()
      if (predicate(snapshot)) finish(snapshot)
    }

    unsubscribe = source.subscribe(check)
    timer = window.setTimeout(fail, timeoutMs)
    check()
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

async function advanceResearchFixture(apiBase: string, researchCaseId: string): Promise<void> {
  // S4 currently sits on the deterministic Research fixture. Polling here is
  // compatibility choreography only; the Research Case remains Editorial API truth.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const state = await requestJson<{ status: string }>(
      `${apiBase}/api/v1/spike/research-cases/${encodeURIComponent(researchCaseId)}`,
    )
    if (state.status === 'completed') return
    await sleep(180)
  }
  throw new Error(`Research Case ${researchCaseId} did not reach completed state`)
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

function bootstrapPrompt(descriptor: LaunchDescriptorWire): string {
  return [
    '这是 AI Editorial Desk Web Shell 发起的 Research Case 恢复上下文。',
    `research_case_id: ${descriptor.research_case_id ?? ''}`,
    `opportunity_id: ${descriptor.opportunity_id ?? ''}`,
    '请不要创建新的 Research Case，也不要要求用户重新描述任务。',
    '请先调用 get_editorial_research_result，参数使用上面的 research_case_id。',
    '取得结果后保留结构化 Tool Result，供“研究工作台”conversation.view 重建 Evidence / Unknown / Conclusion。',
    '如需要解释，可在 Tool Result 完成后用一句话说明已恢复研究上下文。',
  ].join('\n')
}

async function bindSession(
  config: EditorialLaunchConfig,
  sessionId: SessionId,
): Promise<LaunchDescriptorWire> {
  return requestJson<LaunchDescriptorWire>(
    `${config.apiBase}/api/v1/integrations/harness/launches/${encodeURIComponent(config.launchId)}/session`,
    {
      method: 'POST',
      body: JSON.stringify({ harness_session_id: sessionId }),
    },
  )
}

async function markBootstrapComplete(
  config: EditorialLaunchConfig,
  sessionId: SessionId,
): Promise<void> {
  await requestJson<LaunchDescriptorWire>(
    `${config.apiBase}/api/v1/integrations/harness/launches/${encodeURIComponent(config.launchId)}/bootstrap-complete`,
    {
      method: 'POST',
      body: JSON.stringify({ harness_session_id: sessionId }),
    },
  )
}

async function resolveLaunchSession(
  ctx: ClientContext,
  config: EditorialLaunchConfig,
  descriptor: LaunchDescriptorWire,
): Promise<{ descriptor: LaunchDescriptorWire; sessionId: SessionId }> {
  const sessions = await waitForSnapshot(
    ctx.sessions.list,
    snapshot => snapshot.phase === 'ready',
    15_000,
    'Harness session baseline',
  )
  const requestedSessionIdRaw = descriptor.harness_session_id
  if (requestedSessionIdRaw) {
    // SessionId is a compile-time brand in the exact-pinned Harness contract.
    // The launch descriptor arrives over JSON, so restore that brand only at
    // the runtime boundary after rejecting an empty wire value above.
    const requestedSessionId = requestedSessionIdRaw as SessionId
    if (sessions.byId[requestedSessionId] !== undefined) {
      ctx.sessions.open(requestedSessionId)
      return { descriptor, sessionId: requestedSessionId }
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
    throw new Error('Harness has no Workspace available for this Research Case. Open Harness once and register a Workspace first.')
  }

  const sessionId = await ctx.workspaces.connectWorkspace(workspaceId)
  ctx.sessions.open(sessionId)
  const rebound = await bindSession(config, sessionId)
  return { descriptor: rebound, sessionId }
}

async function bootstrapLaunch(
  ctx: ClientContext,
  config: EditorialLaunchConfig,
  status: MutableLaunchStatus,
): Promise<void> {
  try {
    status.set({ phase: 'resolving', message: '正在读取 Harness launch descriptor…' })
    let descriptor = await requestJson<LaunchDescriptorWire>(
      `${config.apiBase}/api/v1/integrations/harness/launches/${encodeURIComponent(config.launchId)}`,
    )
    const researchCaseId = descriptor.research_case_id
    if (descriptor.intent !== 'research' || !researchCaseId) {
      throw new Error('S4 embedded surface currently accepts research launches only')
    }

    status.set({ phase: 'opening-session', message: '正在恢复或创建 Harness Session…' })
    const resolved = await resolveLaunchSession(ctx, config, descriptor)
    descriptor = resolved.descriptor
    const sessionId = resolved.sessionId
    if (descriptor.research_case_id !== researchCaseId) {
      throw new Error('Harness session binding changed the canonical Research Case id')
    }

    if (descriptor.bootstrap_required) {
      status.set({ phase: 'hydrating', message: '正在把 Research Case 重新注入 Harness durable replay…', sessionId })
      const binding = ctx.sessions.binding(sessionId)
      if (binding === undefined) throw new Error(`Harness Session ${sessionId} has no runtime binding`)

      if (!hasDurableResearchResult(binding.session.getSnapshot(), researchCaseId)) {
        await advanceResearchFixture(config.apiBase, researchCaseId)
        const result = await binding.session.prompt(
          [{ type: 'text', text: bootstrapPrompt(descriptor) }],
          'queue',
        )
        if (!result.ok) {
          throw new Error(`Harness bootstrap prompt failed: ${result.error.code}: ${result.error.message}`)
        }
        await waitForSnapshot(
          binding.session,
          snapshot => hasDurableResearchResult(snapshot, researchCaseId),
          90_000,
          'Research Tool Result replay',
        )
      }
      await markBootstrapComplete(config, sessionId)
    }

    status.set({ phase: 'ready', message: 'Research Workspace 已恢复', sessionId })
  } catch (reason: unknown) {
    const message = reason instanceof Error ? reason.message : String(reason)
    status.set({ phase: 'error', message: 'Research Workspace 恢复失败', error: message })
  }
}

function EmbeddedResearchRoot({ useSessions, launchStatus, resolveSession }: EmbeddedRootProps) {
  const status = useSyncExternalStore(
    launchStatus.subscribe,
    launchStatus.getSnapshot,
    launchStatus.getSnapshot,
  )
  const currentSessionId = useSessions(snapshot => snapshot.current)
  const session = currentSessionId === undefined ? undefined : resolveSession(currentSessionId)

  if (status.phase === 'error') {
    return <div style={{ height: '100vh', display: 'grid', placeItems: 'center', padding: 32, background: '#f8fafc', color: '#334155' }}>
      <div style={{ maxWidth: 620, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Research Workspace 恢复失败</div>
        <p style={{ color: '#64748b', lineHeight: 1.7 }}>{status.error ?? status.message}</p>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>Research Case 仍保存在 Editorial API；这里只是 Harness runtime surface 未恢复。</div>
      </div>
    </div>
  }

  if (status.phase !== 'ready' || session === undefined || currentSessionId === undefined) {
    return <div style={{ height: '100vh', display: 'grid', placeItems: 'center', padding: 32, background: '#f8fafc', color: '#334155' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 800 }}>研究工作台</div>
        <p style={{ color: '#64748b', lineHeight: 1.7 }}>{status.message}</p>
        {status.sessionId ? <code style={{ color: '#94a3b8', fontSize: 11 }}>{status.sessionId}</code> : null}
      </div>
    </div>
  }

  const useSession = ((selector: (snapshot: ConversationSnapshot) => unknown) => useSyncExternalStore(
    listener => session.subscribe(listener),
    () => selector(session.getSnapshot()),
    () => selector(session.getSnapshot()),
  )) as ConvViewProps['useSession']

  return <div style={{ height: '100vh', minWidth: 0, overflow: 'hidden', background: '#f8fafc' }}>
    {createElement(ResearchWorkspaceView, { useSession } as ConvViewProps)}
  </div>
}

export function applyEditorialShellLaunch(ctx: ClientContext): void {
  const config = readLaunchConfig()
  if (config === null) return

  const launchStatus = createLaunchStatus()
  ctx.slots.register(
    {
      name: 'root',
      inject: () => ({
        launchStatus,
        resolveSession: (sessionId: SessionId) => ctx.sessions.binding(sessionId)?.session,
      }),
    },
    EmbeddedResearchRoot,
  )

  ctx.effect(() => {
    let active = true
    void bootstrapLaunch(ctx, config, launchStatus).catch((reason: unknown) => {
      if (!active) return
      launchStatus.set({
        phase: 'error',
        message: 'Research Workspace 恢复失败',
        error: reason instanceof Error ? reason.message : String(reason),
      })
    })
    return () => { active = false }
  }, 'editorial shell research launch bootstrap')
}
