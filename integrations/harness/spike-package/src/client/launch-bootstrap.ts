import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'

interface EditorialHarnessLaunch {
  launch_id: string
  intent: 'research'
  research_case_id: string
  opportunity_id: string
  harness_session_id: string | null
  surface_url: string
  return_url: string
  transport: string
  presentation: string
  workspace_cwd: string
  session_title: string
  initial_prompt: string
}

const handledLaunches = new Set<string>()

function cleanLaunchQuery(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('editorial_launch')
  url.searchParams.delete('editorial_api')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

async function fetchLaunch(apiBase: string, launchId: string): Promise<EditorialHarnessLaunch> {
  const response = await fetch(
    `${apiBase.replace(/\/$/u, '')}/api/v1/integrations/harness/launches/${encodeURIComponent(launchId)}`,
    { headers: { accept: 'application/json' } },
  )
  if (!response.ok) {
    throw new Error(`editorial launch ${response.status}: ${(await response.text()).slice(0, 300)}`)
  }
  return await response.json() as EditorialHarnessLaunch
}

async function bindLaunch(apiBase: string, launchId: string, sessionId: string): Promise<void> {
  const response = await fetch(
    `${apiBase.replace(/\/$/u, '')}/api/v1/integrations/harness/launches/${encodeURIComponent(launchId)}/binding`,
    {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ harness_session_id: sessionId }),
    },
  )
  if (!response.ok) {
    throw new Error(`editorial launch binding ${response.status}: ${(await response.text()).slice(0, 300)}`)
  }
}

function waitForSessionList(ctx: ClientContext): Promise<void> {
  if (ctx.sessions.list.getSnapshot().phase !== 'pending') return Promise.resolve()
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const dispose = ctx.sessions.list.subscribe(() => {
      if (ctx.sessions.list.getSnapshot().phase === 'pending') return
      if (timer !== undefined) clearTimeout(timer)
      dispose()
      resolve()
    })
    timer = setTimeout(() => {
      dispose()
      resolve()
    }, 5000)
  })
}

/**
 * Resolve an opaque Web Shell launch into a normal Harness session through the
 * pinned client runtime's public sessions service. The launch query is only a
 * transport hand-off; after the session is selected it is removed so reload
 * follows Harness' ordinary persisted selection/replay path.
 */
export async function bootstrapEditorialLaunch(ctx: ClientContext): Promise<void> {
  const params = new URLSearchParams(window.location.search)
  const launchId = params.get('editorial_launch')
  const apiBase = params.get('editorial_api')
  if (launchId === null || apiBase === null || handledLaunches.has(launchId)) return
  handledLaunches.add(launchId)

  try {
    const launch = await fetchLaunch(apiBase, launchId)
    await waitForSessionList(ctx)

    type HarnessSessionId = Parameters<typeof ctx.sessions.open>[0]
    const requested = launch.harness_session_id as HarnessSessionId | null
    const snapshot = ctx.sessions.list.getSnapshot()
    const existing = requested !== null && snapshot.byId[requested] !== undefined

    let sessionId: HarnessSessionId
    let created = false
    if (existing && requested !== null) {
      sessionId = requested
    } else {
      sessionId = await ctx.sessions.create({ cwd: launch.workspace_cwd })
      created = true
      await bindLaunch(apiBase, launchId, String(sessionId))
    }

    ctx.sessions.open(sessionId)
    const session = ctx.sessions.binding(sessionId)?.session
    if (session === undefined) throw new Error(`Harness session ${String(sessionId)} is not locally addressable`)

    if (created) {
      const renamed = await session.rename(launch.session_title)
      if (!renamed.ok) {
        console.warn(`EDITORIAL_HARNESS_LAUNCH_RENAME_FAIL ${renamed.error.code}: ${renamed.error.message}`)
      }
      const prompted = await session.prompt([{ type: 'text', text: launch.initial_prompt }], 'queue')
      if (!prompted.ok) {
        throw new Error(`Harness launch prompt failed: ${prompted.error.code}: ${prompted.error.message}`)
      }
    }

    cleanLaunchQuery()
    console.log(`EDITORIAL_HARNESS_LAUNCH_PASS ${launchId} ${String(sessionId)}`)
  } catch (error: unknown) {
    handledLaunches.delete(launchId)
    const message = error instanceof Error ? error.message : String(error)
    console.error(`EDITORIAL_HARNESS_LAUNCH_FAIL ${launchId} ${message}`)
  }
}
