import type { Agent } from '@deepseek-ai/dsh-agent'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { GenericResultView, ToolResult } from '@deepseek-ai/dsh-tools'
import './events.ts'

const BASE_URL = (process.env.EDITORIAL_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/u, '')
const REQUEST_TIMEOUT_MS = Number(process.env.EDITORIAL_API_TIMEOUT_MS ?? '8000')
const RESEARCH_POLL_INTERVAL_MS = Number(process.env.EDITORIAL_RESEARCH_POLL_MS ?? '700')
const TOOL_SELF_TEST_ENABLED = process.env.EDITORIAL_SPIKE_TOOL_SELF_TEST === '1'

interface SubjectSummary {
  id: string
  type: string
  name: string
}

interface OpportunitySummary {
  opportunity_id: string
  headline: string
  subject: SubjectSummary
  angle: string
  theme: string
  audience_promise: string
  why_now: string
  recommendation: string
  confidence: string
  value_highlights: string[]
  research_status: string
  evidence_state: { open_unknown_count: number }
  production_readiness: string
}

interface OpportunityList {
  items: OpportunitySummary[]
  count: number
}

interface ResearchCreated {
  research_case_id: string
  opportunity_id: string
  status: string
  progress_url: string
}

interface ResearchProgress {
  research_case_id: string
  opportunity_id: string
  status: 'queued' | 'running' | 'completed'
  stage: string
  progress: number
  completed_steps: number
  total_steps: number
  message: string
  new_evidence_count: number
  open_unknown_count: number
}

interface ResearchStartMeta {
  research_case_id: string
  opportunity_id: string
  job_id: string
}

const SUBJECT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', required: true },
    type: { type: 'string', required: true },
    name: { type: 'string', required: true },
  },
} as const

const OPPORTUNITY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    opportunity_id: { type: 'string', required: true },
    headline: { type: 'string', required: true },
    subject: { ...SUBJECT_SCHEMA, required: true },
    angle: { type: 'string', required: true },
    theme: { type: 'string', required: true },
    audience_promise: { type: 'string', required: true },
    why_now: { type: 'string', required: true },
    recommendation: { type: 'string', required: true },
    confidence: { type: 'string', required: true },
    value_highlights: {
      type: 'array',
      required: true,
      items: { type: 'string' },
    },
    research_status: { type: 'string', required: true },
    evidence_state: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        open_unknown_count: { type: 'integer', required: true },
      },
    },
    production_readiness: { type: 'string', required: true },
  },
} as const

function opportunityText(item: OpportunitySummary): string {
  return [
    item.headline,
    `Angle: ${item.angle}`,
    `Theme: ${item.theme}`,
    `Audience promise: ${item.audience_promise}`,
    `Why now: ${item.why_now}`,
    `Recommendation: ${item.recommendation}`,
    `Unknowns: ${item.evidence_state.open_unknown_count}`,
  ].join('\n')
}

function genericResult(title: string, text: string): GenericResultView {
  return {
    card: 'generic',
    title,
    content: [{ type: 'text', text }],
  }
}

function presentationMeta<T>(result: ToolResult): T | undefined {
  if (result.meta === undefined || result.meta === null || typeof result.meta !== 'object') return undefined
  return result.meta as T
}

async function fetchJson<T>(path: string, init: RequestInit, outerSignal: AbortSignal): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error('editorial api timeout')), REQUEST_TIMEOUT_MS)
  const propagateAbort = () => controller.abort(outerSignal.reason)
  outerSignal.addEventListener('abort', propagateAbort, { once: true })

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...init.headers,
      },
    })
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`editorial api ${response.status}: ${body.slice(0, 400)}`)
    }
    return await response.json() as T
  } finally {
    clearTimeout(timeout)
    outerSignal.removeEventListener('abort', propagateAbort)
  }
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new Error('aborted'))
      return
    }
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason ?? new Error('aborted'))
    }, { once: true })
  })
}

function researchHooks(agent: Agent, created: ResearchCreated) {
  const controller = new AbortController()
  const done = (async () => {
    try {
      while (true) {
        const progress = await fetchJson<ResearchProgress>(created.progress_url, { method: 'GET' }, controller.signal)
        if (progress.status === 'completed') {
          agent.session.append('editorial/research-end', {
            researchCaseId: progress.research_case_id,
            opportunityId: progress.opportunity_id,
            status: 'completed',
            progress: progress.progress,
            message: progress.message,
            newEvidenceCount: progress.new_evidence_count,
            openUnknownCount: progress.open_unknown_count,
          })
          return {
            status: 'completed' as const,
            detail: `${progress.new_evidence_count} evidence, ${progress.open_unknown_count} unknown`,
            output: progress.message,
          }
        }

        agent.session.append('editorial/research-progress', {
          researchCaseId: progress.research_case_id,
          opportunityId: progress.opportunity_id,
          status: progress.status,
          stage: progress.stage,
          progress: progress.progress,
          message: progress.message,
          newEvidenceCount: progress.new_evidence_count,
          openUnknownCount: progress.open_unknown_count,
        })
        await wait(RESEARCH_POLL_INTERVAL_MS, controller.signal)
      }
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        agent.session.append('editorial/research-end', {
          researchCaseId: created.research_case_id,
          opportunityId: created.opportunity_id,
          status: 'cancelled',
          progress: 0,
          message: '研究任务已取消。',
          newEvidenceCount: 0,
          openUnknownCount: 0,
        })
        return { status: 'killed' as const, detail: 'cancelled' }
      }
      const message = error instanceof Error ? error.message : String(error)
      agent.session.append('editorial/research-end', {
        researchCaseId: created.research_case_id,
        opportunityId: created.opportunity_id,
        status: 'failed',
        progress: 0,
        message,
        newEvidenceCount: 0,
        openUnknownCount: 0,
      })
      return { status: 'failed' as const, detail: message }
    }
  })()

  return {
    cancel(reason?: string) {
      controller.abort(new Error(reason ?? 'cancelled'))
    },
    done,
  }
}

function selfTestCallId(value: string): Parameters<Context['tools']['execute']>[0]['callId'] {
  return value as Parameters<Context['tools']['execute']>[0]['callId']
}

async function runToolRuntimeSelfTest(ctx: Context): Promise<void> {
  const signal = new AbortController().signal
  const listResult = await ctx.tools.execute({
    callId: selfTestCallId('editorial-spike-selftest-list'),
    name: 'list_editorial_opportunities',
    arguments: {},
    signal,
  })
  if (listResult.isError) throw new Error('list_editorial_opportunities returned an error')
  const listText = listResult.content
    .map(block => block.type === 'text' ? block.text : '')
    .join('\n')
  if (!listText.includes('洗碗机真的可能比手洗更省水吗？')) {
    throw new Error('list_editorial_opportunities did not return expected rendered content')
  }

  const inspectResult = await ctx.tools.execute({
    callId: selfTestCallId('editorial-spike-selftest-inspect'),
    name: 'inspect_editorial_opportunity',
    arguments: { opportunity_id: 'opp_dishwasher_water' },
    signal,
  })
  if (inspectResult.isError) throw new Error('inspect_editorial_opportunity returned an error')
  const inspectText = inspectResult.content
    .map(block => block.type === 'text' ? block.text : '')
    .join('\n')
  if (!inspectText.includes('代际生活方式与节约观念')) {
    throw new Error('inspect_editorial_opportunity did not preserve expected opportunity detail')
  }

  const missingResult = await ctx.tools.execute({
    callId: selfTestCallId('editorial-spike-selftest-error'),
    name: 'inspect_editorial_opportunity',
    arguments: { opportunity_id: 'opp_missing' },
    signal,
  })
  if (!missingResult.isError) throw new Error('missing opportunity should surface as a Tool error')

  console.log('EDITORIAL_SPIKE_TOOL_SELF_TEST_PASS list+inspect+error')
}

export const name = 'ai-editorial-desk-harness-spike'
export const inject = ['tools', 'jobs']

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.jobs.attachController('ai-editorial-desk-harness-spike'))

  ctx.tools.register(defineTool({
    name: 'list_editorial_opportunities',
    description: 'List editorial opportunities already discovered by AI Editorial Desk Next.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          items: { type: 'array', required: true, items: OPPORTUNITY_SCHEMA },
          count: { type: 'integer', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.items.map((item, index) => `${index + 1}. ${opportunityText(item)}`).join('\n\n'),
      }],
      presentationMeta: (_args, value) => ({
        count: value.count,
        items: value.items,
      }),
    },
    async execute(_args, exec) {
      return fetchJson<OpportunityList>('/api/v1/spike/opportunities', { method: 'GET' }, exec.signal)
    },
    presentCall: () => ({ card: 'generic', title: '读取编辑机会', kind: 'read' }),
    presentResult(_args, result: ToolResult): GenericResultView | undefined {
      if (result.isError) return undefined
      const value = presentationMeta<OpportunityList>(result)
      if (value === undefined) return undefined
      const text = value.items
        .map(item => `• ${item.headline}\n  ${item.angle}\n  → ${item.recommendation}`)
        .join('\n\n')
      return genericResult(`编辑机会 · ${value.count} 条`, text)
    },
  }))

  ctx.tools.register(defineTool({
    name: 'inspect_editorial_opportunity',
    description: 'Inspect one editorial opportunity with angle, theme, audience promise and unknowns.',
    parameters: {
      opportunity_id: { type: 'string', required: true, description: 'Stable opportunity id.' },
    },
    output: {
      schema: OPPORTUNITY_SCHEMA,
      render: (_args, value) => [{ type: 'text', text: opportunityText(value) }],
      presentationMeta: (_args, value) => value,
    },
    async execute(args, exec) {
      if (args.opportunity_id.trim().length === 0) throw new Error('opportunity_id must be non-empty')
      return fetchJson<OpportunitySummary>(
        `/api/v1/spike/opportunities/${encodeURIComponent(args.opportunity_id)}`,
        { method: 'GET' },
        exec.signal,
      )
    },
    presentCall: args => ({ card: 'generic', title: '查看编辑机会', kind: 'read', rawInput: args.opportunity_id }),
    presentResult(_args, result: ToolResult): GenericResultView | undefined {
      if (result.isError) return undefined
      const item = presentationMeta<OpportunitySummary>(result)
      if (item === undefined) return undefined
      return genericResult(item.headline, opportunityText(item))
    },
  }))

  ctx.tools.register(defineTool({
    name: 'start_editorial_research',
    description: 'Start a background research job for an editorial opportunity.',
    parameters: {
      opportunity_id: { type: 'string', required: true },
      goal: { type: 'string', description: 'Optional research goal.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          research_case_id: { type: 'string', required: true },
          opportunity_id: { type: 'string', required: true },
          job_id: { type: 'string', required: true },
          status: { type: 'string', required: true, enum: ['running'] },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Research ${value.research_case_id} started as background job ${value.job_id}.`,
      }],
      presentationMeta: (_args, value) => ({
        research_case_id: value.research_case_id,
        opportunity_id: value.opportunity_id,
        job_id: value.job_id,
      }),
    },
    async execute(args, exec) {
      if (!exec.agent) throw new Error('start_editorial_research requires an owning agent session')
      const created = await fetchJson<ResearchCreated>('/api/v1/spike/research-cases', {
        method: 'POST',
        body: JSON.stringify({ opportunity_id: args.opportunity_id, goal: args.goal }),
      }, exec.signal)

      exec.agent.session.append('editorial/research-start', {
        researchCaseId: created.research_case_id,
        opportunityId: created.opportunity_id,
        title: args.goal ?? `Research ${created.opportunity_id}`,
        status: created.status === 'queued' ? 'queued' : 'running',
        progress: 0,
        message: '研究任务已创建。',
      })

      const jobId = ctx.jobs.start({
        kind: 'editorial-research',
        label: `Research ${created.opportunity_id}`,
        owner: exec.agent,
        run: () => researchHooks(exec.agent as Agent, created),
      })
      return {
        research_case_id: created.research_case_id,
        opportunity_id: created.opportunity_id,
        job_id: String(jobId),
        status: 'running' as const,
      }
    },
    presentCall: args => ({ card: 'generic', title: '启动研究', kind: 'execute', rawInput: args.opportunity_id }),
    presentResult(_args, result: ToolResult): GenericResultView | undefined {
      if (result.isError) return undefined
      const value = presentationMeta<ResearchStartMeta>(result)
      if (value === undefined) return undefined
      return genericResult(
        '研究已启动',
        `Research Case: ${value.research_case_id}\nHarness Job: ${value.job_id}`,
      )
    },
  }))

  if (TOOL_SELF_TEST_ENABLED) {
    void runToolRuntimeSelfTest(ctx).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`EDITORIAL_SPIKE_TOOL_SELF_TEST_FAIL ${message}`)
    })
  }
}
