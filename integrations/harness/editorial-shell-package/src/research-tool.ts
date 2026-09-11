import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

const BASE_URL = (process.env.EDITORIAL_API_BASE_URL ?? 'http://127.0.0.1:18000').replace(/\/$/u, '')
const REQUEST_TIMEOUT_MS = Number(process.env.EDITORIAL_API_TIMEOUT_MS ?? '8000')

interface ResearchEvidence {
  evidence_id: string
  claim: string
  stance: string
  source_title: string
  source_type: string
  locator: string
  summary: string
  confidence: string
}

interface ResearchUnknown {
  unknown_id: string
  question: string
  status: string
}

interface ResearchResult {
  research_case_id: string
  opportunity_id: string
  goal: string
  status: string
  result_kind: string
  evidence_count: number
  open_unknown_count: number
  evidence: ResearchEvidence[]
  unknowns: ResearchUnknown[]
  conclusion: string
}

const RESEARCH_EVIDENCE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    evidence_id: { type: 'string', required: true },
    claim: { type: 'string', required: true },
    stance: { type: 'string', required: true },
    source_title: { type: 'string', required: true },
    source_type: { type: 'string', required: true },
    locator: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    confidence: { type: 'string', required: true },
  },
} as const

const RESEARCH_UNKNOWN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    unknown_id: { type: 'string', required: true },
    question: { type: 'string', required: true },
    status: { type: 'string', required: true },
  },
} as const

const RESEARCH_RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    research_case_id: { type: 'string', required: true },
    opportunity_id: { type: 'string', required: true },
    goal: { type: 'string', required: true },
    status: { type: 'string', required: true },
    result_kind: { type: 'string', required: true },
    evidence_count: { type: 'integer', required: true },
    open_unknown_count: { type: 'integer', required: true },
    evidence: { type: 'array', required: true, items: RESEARCH_EVIDENCE_SCHEMA },
    unknowns: { type: 'array', required: true, items: RESEARCH_UNKNOWN_SCHEMA },
    conclusion: { type: 'string', required: true },
  },
} as const

function renderResearchResult(result: ResearchResult): string {
  const evidence = result.evidence
    .map((item, index) => `${index + 1}. [${item.stance}] ${item.claim}\n   Source: ${item.source_title}\n   Locator: ${item.locator}\n   Confidence: ${item.confidence}`)
    .join('\n\n')
  const unknowns = result.unknowns.length === 0
    ? 'None'
    : result.unknowns.map((item, index) => `${index + 1}. ${item.question} [${item.status}]`).join('\n')
  return [
    `Research Case: ${result.research_case_id}`,
    `Opportunity ID: ${result.opportunity_id}`,
    `Result kind: ${result.result_kind}`,
    `Goal: ${result.goal}`,
    `Evidence: ${result.evidence_count}`,
    evidence,
    `Open unknowns: ${result.open_unknown_count}`,
    unknowns,
    `Conclusion: ${result.conclusion}`,
  ].join('\n\n')
}

async function fetchResult(researchCaseId: string, outerSignal: AbortSignal): Promise<ResearchResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error('editorial api timeout')), REQUEST_TIMEOUT_MS)
  const propagateAbort = () => controller.abort(outerSignal.reason)
  outerSignal.addEventListener('abort', propagateAbort, { once: true })
  try {
    const response = await fetch(
      `${BASE_URL}/api/v1/spike/research-cases/${encodeURIComponent(researchCaseId)}/result`,
      { signal: controller.signal, headers: { accept: 'application/json' } },
    )
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`editorial api ${response.status}: ${body.slice(0, 400)}`)
    }
    return await response.json() as ResearchResult
  } finally {
    clearTimeout(timeout)
    outerSignal.removeEventListener('abort', propagateAbort)
  }
}

export function registerEditorialResearchResultTool(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'get_editorial_research_result',
    description: 'Read the canonical result of an existing AI Editorial Desk Research Case. Never creates a new Research Case. Returns Evidence, Unknowns, conclusion and result_kind for the supplied business research_case_id.',
    parameters: {
      research_case_id: { type: 'string', required: true, description: 'Existing AI Editorial Desk business Research Case id.' },
    },
    output: {
      schema: RESEARCH_RESULT_SCHEMA,
      render: (_args, value) => [{ type: 'text', text: renderResearchResult(value) }],
      presentationMeta: (_args, value) => value,
    },
    async execute(args, exec) {
      if (args.research_case_id.trim().length === 0) throw new Error('research_case_id must be non-empty')
      return fetchResult(args.research_case_id, exec.signal)
    },
    presentCall: args => ({
      card: 'generic',
      title: '读取 Research Case 结果',
      kind: 'read',
      rawInput: args.research_case_id,
    }),
  }))
}
