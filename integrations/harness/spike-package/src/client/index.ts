import { createElement } from 'react'
import type {
  ClientContext,
  ConversationLocation,
  ConversationNodeContext,
  ConversationNodeDefinition,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { ChatNodeViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ToolCallViewProps } from '@deepseek-ai/dsh-client-ui-tool/client'
import { ResearchWorkspaceView } from './research-workspace.tsx'
import '../events.ts'

/** Legacy-only projection for sessions written before the cold-replay fix. */
interface ResearchNodeData {
  title: string
  progress: number
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  message: string
  newEvidenceCount: number
  openUnknownCount: number
}

interface ResearchState extends ResearchNodeData {
  opportunityId: string
}

interface OpportunityView {
  opportunity_id: string
  headline: string
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

interface OpportunityListView {
  count: number
  items: OpportunityView[]
}

interface ResearchStartView {
  research_case_id: string
  opportunity_id: string
  job_id: string
}

interface ResearchEvidenceView {
  evidence_id: string
  claim: string
  stance: string
  source_title: string
  source_type: string
  locator: string
  summary: string
  confidence: string
}

interface ResearchUnknownView {
  unknown_id: string
  question: string
  status: string
}

interface ResearchResultView {
  research_case_id: string
  opportunity_id: string
  goal: string
  status: string
  result_kind: string
  evidence_count: number
  open_unknown_count: number
  evidence: ResearchEvidenceView[]
  unknowns: ResearchUnknownView[]
  conclusion: string
}

type ResearchNodeViewProps = Pick<ChatNodeViewProps<'editorial-research'>, 'node'>

declare module '@deepseek-ai/dsh-client-ui-conversation/client' {
  interface ChatNodeDataMap {
    'editorial-research': ResearchNodeData
  }
}

function locationOf(context: ConversationNodeContext): ConversationLocation {
  return context.start?.location ?? context.matches[0]?.location ?? { kind: 'unresolved' }
}

function viewData(state: ResearchState): ResearchNodeData {
  return {
    title: state.title,
    progress: state.progress,
    status: state.status,
    message: state.message,
    newEvidenceCount: state.newEvidenceCount,
    openUnknownCount: state.openUnknownCount,
  }
}

/**
 * Keep the old event projection so explicitly repaired legacy sessions still
 * render their historical Research Node. New sessions no longer emit these
 * plugin-owned durable events; current Research state lives in Editorial API
 * and completed results are persisted as ordinary tool/result events.
 */
const researchDefinition: ConversationNodeDefinition<ResearchState> = {
  kind: 'editorial-research',
  target: 'chat',
  match(event) {
    if (event.type === 'editorial/research-start') {
      return { id: event.data.researchCaseId, role: 'start' }
    }
    if (event.type === 'editorial/research-progress' || event.type === 'editorial/research-end') {
      return { id: event.data.researchCaseId, role: 'update' }
    }
    return null
  },
  start(_context, match) {
    if (match.event.type !== 'editorial/research-start') {
      throw new Error('editorial-research requires editorial/research-start')
    }
    return {
      opportunityId: match.event.data.opportunityId,
      title: match.event.data.title,
      progress: match.event.data.progress,
      status: match.event.data.status,
      message: match.event.data.message,
      newEvidenceCount: 0,
      openUnknownCount: 0,
    }
  },
  update(context, match) {
    if (context.state === undefined) return context.state
    if (match.event.type === 'editorial/research-progress') {
      return {
        ...context.state,
        progress: match.event.data.progress,
        status: match.event.data.status,
        message: match.event.data.message,
        newEvidenceCount: match.event.data.newEvidenceCount,
        openUnknownCount: match.event.data.openUnknownCount,
      }
    }
    if (match.event.type === 'editorial/research-end') {
      return {
        ...context.state,
        progress: match.event.data.progress,
        status: match.event.data.status,
        message: match.event.data.message,
        newEvidenceCount: match.event.data.newEvidenceCount,
        openUnknownCount: match.event.data.openUnknownCount,
      }
    }
    return context.state
  },
  publication: match => match.event.type === 'editorial/research-progress'
    ? 'animation-frame'
    : 'immediate',
  buildViewNode(context) {
    if (context.state === undefined) return null
    return {
      key: context.key,
      kind: 'editorial-research',
      id: context.id,
      target: 'chat',
      anchorSeq: context.start?.event.seq ?? context.matches[0]?.event.seq ?? 0,
      location: locationOf(context),
      visibility: 'visible',
      data: viewData(context.state),
    }
  },
}

function ResearchNodeView({ node }: ResearchNodeViewProps) {
  const data = node.data
  const title = `${data.status === 'completed' ? '✓' : '⌕'} ${data.title}`
  const meta = `${data.progress}% · 证据 ${data.newEvidenceCount} · 未知项 ${data.openUnknownCount}`
  return createElement(
    'div',
    {
      style: {
        border: '1px solid var(--dsw-alias-border-default, #d8dee8)',
        borderRadius: 12,
        padding: '12px 14px',
        margin: '8px 0',
      },
    },
    createElement('div', { style: { fontWeight: 600 } }, title),
    createElement('div', { style: { marginTop: 6, fontSize: 13, opacity: 0.72 } }, meta),
    createElement('div', { style: { marginTop: 8 } }, data.message),
    createElement(
      'div',
      {
        style: {
          height: 4,
          borderRadius: 999,
          background: 'rgba(127,127,127,.18)',
          marginTop: 10,
          overflow: 'hidden',
        },
      },
      createElement('div', {
        style: {
          height: '100%',
          width: `${Math.max(0, Math.min(100, data.progress))}%`,
          background: 'currentColor',
          opacity: 0.65,
        },
      }),
    ),
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(value: Record<string, unknown>, key: string): string | null {
  const field = value[key]
  return typeof field === 'string' ? field : null
}

function numberField(value: Record<string, unknown>, key: string): number | null {
  const field = value[key]
  return typeof field === 'number' ? field : null
}

function parseOpportunity(value: unknown): OpportunityView | null {
  if (!isRecord(value)) return null
  const evidence = value.evidence_state
  if (!isRecord(evidence) || typeof evidence.open_unknown_count !== 'number') return null
  const highlights = value.value_highlights
  if (!Array.isArray(highlights) || !highlights.every(item => typeof item === 'string')) return null
  const opportunityId = stringField(value, 'opportunity_id')
  const headline = stringField(value, 'headline')
  const angle = stringField(value, 'angle')
  const theme = stringField(value, 'theme')
  const audiencePromise = stringField(value, 'audience_promise')
  const whyNow = stringField(value, 'why_now')
  const recommendation = stringField(value, 'recommendation')
  const confidence = stringField(value, 'confidence')
  const researchStatus = stringField(value, 'research_status')
  const readiness = stringField(value, 'production_readiness')
  if (
    opportunityId === null || headline === null || angle === null || theme === null
    || audiencePromise === null || whyNow === null || recommendation === null
    || confidence === null || researchStatus === null || readiness === null
  ) return null
  return {
    opportunity_id: opportunityId,
    headline,
    angle,
    theme,
    audience_promise: audiencePromise,
    why_now: whyNow,
    recommendation,
    confidence,
    value_highlights: highlights,
    research_status: researchStatus,
    evidence_state: { open_unknown_count: evidence.open_unknown_count },
    production_readiness: readiness,
  }
}

function parseOpportunityList(value: unknown): OpportunityListView | null {
  if (!isRecord(value) || typeof value.count !== 'number' || !Array.isArray(value.items)) return null
  const items = value.items.map(parseOpportunity)
  if (items.some(item => item === null)) return null
  return { count: value.count, items: items as OpportunityView[] }
}

function parseResearchStart(value: unknown): ResearchStartView | null {
  if (!isRecord(value)) return null
  const researchCaseId = stringField(value, 'research_case_id')
  const opportunityId = stringField(value, 'opportunity_id')
  const jobId = stringField(value, 'job_id')
  if (researchCaseId === null || opportunityId === null || jobId === null) return null
  return { research_case_id: researchCaseId, opportunity_id: opportunityId, job_id: jobId }
}

function parseResearchEvidence(value: unknown): ResearchEvidenceView | null {
  if (!isRecord(value)) return null
  const evidenceId = stringField(value, 'evidence_id')
  const claim = stringField(value, 'claim')
  const stance = stringField(value, 'stance')
  const sourceTitle = stringField(value, 'source_title')
  const sourceType = stringField(value, 'source_type')
  const locator = stringField(value, 'locator')
  const summary = stringField(value, 'summary')
  const confidence = stringField(value, 'confidence')
  if (
    evidenceId === null || claim === null || stance === null || sourceTitle === null
    || sourceType === null || locator === null || summary === null || confidence === null
  ) return null
  return {
    evidence_id: evidenceId,
    claim,
    stance,
    source_title: sourceTitle,
    source_type: sourceType,
    locator,
    summary,
    confidence,
  }
}

function parseResearchUnknown(value: unknown): ResearchUnknownView | null {
  if (!isRecord(value)) return null
  const unknownId = stringField(value, 'unknown_id')
  const question = stringField(value, 'question')
  const status = stringField(value, 'status')
  if (unknownId === null || question === null || status === null) return null
  return { unknown_id: unknownId, question, status }
}

function parseResearchResult(value: unknown): ResearchResultView | null {
  if (!isRecord(value) || !Array.isArray(value.evidence) || !Array.isArray(value.unknowns)) return null
  const researchCaseId = stringField(value, 'research_case_id')
  const opportunityId = stringField(value, 'opportunity_id')
  const goal = stringField(value, 'goal')
  const status = stringField(value, 'status')
  const resultKind = stringField(value, 'result_kind')
  const conclusion = stringField(value, 'conclusion')
  const evidenceCount = numberField(value, 'evidence_count')
  const unknownCount = numberField(value, 'open_unknown_count')
  const evidence = value.evidence.map(parseResearchEvidence)
  const unknowns = value.unknowns.map(parseResearchUnknown)
  if (
    researchCaseId === null || opportunityId === null || goal === null || status === null
    || resultKind === null || conclusion === null || evidenceCount === null || unknownCount === null
    || evidence.some(item => item === null) || unknowns.some(item => item === null)
  ) return null
  return {
    research_case_id: researchCaseId,
    opportunity_id: opportunityId,
    goal,
    status,
    result_kind: resultKind,
    evidence_count: evidenceCount,
    open_unknown_count: unknownCount,
    evidence: evidence as ResearchEvidenceView[],
    unknowns: unknowns as ResearchUnknownView[],
    conclusion,
  }
}

function presentationMeta(block: ToolCallViewProps['block']): unknown {
  if (!('kind' in block)) return undefined
  return (block as unknown as { meta?: unknown }).meta
}

function resultText(block: ToolCallViewProps['block']): string {
  if (!('kind' in block)) return '正在读取编辑机会…'
  return block.content
    .map(item => item.type === 'text' ? item.text : JSON.stringify(item, null, 2))
    .join('\n')
}

function recommendationLabel(value: string): string {
  switch (value) {
    case 'today_main': return '今日主推'
    case 'evergreen': return '长青储备'
    case 'watch': return '观察'
    case 'potential': return '潜力发现'
    default: return value
  }
}

function researchLabel(value: string): string {
  switch (value) {
    case 'not_started': return '待研究'
    case 'running': return '研究中'
    case 'completed': return '研究完成'
    default: return value
  }
}

function readinessLabel(value: string): string {
  switch (value) {
    case 'high': return '就绪度高'
    case 'medium': return '就绪度中'
    case 'low': return '就绪度低'
    default: return value
  }
}

function stanceLabel(value: string): string {
  switch (value) {
    case 'supporting': return '支持证据'
    case 'contradicting': return '反向证据'
    case 'context': return '条件背景'
    default: return value
  }
}

function badge(text: string, tone: 'primary' | 'neutral' | 'warning' = 'neutral', key?: string) {
  const background = tone === 'primary'
    ? 'rgba(79,70,229,.10)'
    : tone === 'warning' ? 'rgba(245,158,11,.11)' : 'rgba(100,116,139,.10)'
  const color = tone === 'primary'
    ? 'var(--dsw-alias-content-accent, #4f46e5)'
    : tone === 'warning' ? '#a16207' : 'var(--dsw-alias-content-secondary, #64748b)'
  return createElement('span', {
    key,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      borderRadius: 999,
      background,
      color,
      fontSize: 12,
      lineHeight: 1.4,
      fontWeight: 600,
    },
  }, text)
}

function infoSection(label: string, text: string, key?: string) {
  return createElement('div', { key, style: { minWidth: 0 } },
    createElement('div', {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.02em',
        color: 'var(--dsw-alias-content-tertiary, #94a3b8)',
        marginBottom: 4,
      },
    }, label),
    createElement('div', {
      style: {
        fontSize: 13,
        lineHeight: 1.6,
        color: 'var(--dsw-alias-content-primary, #172033)',
      },
    }, text),
  )
}

function OpportunityCard(item: OpportunityView, detailed: boolean, key?: string) {
  const highlightNodes = item.value_highlights.map((value, index) => badge(value, 'neutral', `${key ?? item.opportunity_id}-h-${index}`))
  return createElement('article', {
    key,
    style: {
      border: '1px solid var(--dsw-alias-border-default, #e2e8f0)',
      borderRadius: 12,
      background: 'var(--dsw-alias-surface-card, #fff)',
      padding: detailed ? '16px 18px' : '14px 16px',
      boxShadow: '0 1px 2px rgba(15,23,42,.03)',
    },
  },
  createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 10,
    },
  },
  createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
    badge(recommendationLabel(item.recommendation), 'primary'),
    badge(researchLabel(item.research_status), item.research_status === 'not_started' ? 'warning' : 'neutral'),
  ),
  createElement('span', {
    style: {
      fontSize: 11,
      color: 'var(--dsw-alias-content-tertiary, #94a3b8)',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    },
  }, item.opportunity_id)),
  createElement('div', {
    style: {
      fontSize: detailed ? 18 : 16,
      fontWeight: 700,
      lineHeight: 1.45,
      color: 'var(--dsw-alias-content-primary, #111827)',
    },
  }, item.headline),
  createElement('div', {
    style: {
      marginTop: 8,
      fontSize: 13,
      lineHeight: 1.65,
      color: 'var(--dsw-alias-content-secondary, #475569)',
    },
  }, item.angle),
  highlightNodes.length === 0 ? null : createElement('div', {
    style: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  }, ...highlightNodes),
  detailed ? createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
      gap: '14px 20px',
      padding: '14px 0',
      marginTop: 14,
      borderTop: '1px solid var(--dsw-alias-border-subtle, #eef2f7)',
      borderBottom: '1px solid var(--dsw-alias-border-subtle, #eef2f7)',
    },
  },
  infoSection('主题', item.theme),
  infoSection('受众承诺', item.audience_promise),
  infoSection('为什么是现在', item.why_now),
  infoSection('置信度', item.confidence === 'high' ? '高' : item.confidence === 'medium' ? '中' : item.confidence),
  ) : null,
  createElement('div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 14,
      marginTop: 12,
      fontSize: 12,
      color: 'var(--dsw-alias-content-secondary, #64748b)',
    },
  },
  createElement('span', null, `未知项 ${item.evidence_state.open_unknown_count}`),
  createElement('span', null, readinessLabel(item.production_readiness)),
  ),
  )
}

function fallbackToolRow(title: string, block: ToolCallViewProps['block']) {
  return createElement('div', {
    style: {
      border: '1px solid var(--dsw-alias-border-default, #e2e8f0)',
      borderRadius: 12,
      padding: '12px 14px',
      margin: '8px 0',
      background: 'var(--dsw-alias-surface-card, #fff)',
    },
  },
  createElement('div', { style: { fontWeight: 650, marginBottom: 8 } }, title),
  createElement('pre', {
    style: {
      margin: 0,
      whiteSpace: 'pre-wrap',
      fontFamily: 'inherit',
      fontSize: 13,
      lineHeight: 1.6,
      color: 'var(--dsw-alias-content-secondary, #475569)',
    },
  }, resultText(block)),
  )
}

function OpportunityToolView({ toolName, block }: ToolCallViewProps) {
  const meta = presentationMeta(block)
  const list = toolName === 'list_editorial_opportunities' ? parseOpportunityList(meta) : null
  const detail = toolName === 'inspect_editorial_opportunity' ? parseOpportunity(meta) : null
  if (list === null && detail === null) return fallbackToolRow('编辑机会', block)

  if (list !== null) {
    return createElement('section', {
      style: {
        border: '1px solid var(--dsw-alias-border-default, #dbe3ef)',
        borderRadius: 14,
        padding: 14,
        margin: '8px 0',
        background: 'var(--dsw-alias-surface-subtle, #f8fafc)',
      },
    },
    createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
      },
    },
    createElement('div', { style: { fontSize: 15, fontWeight: 750 } }, '编辑机会'),
    createElement('div', { style: { fontSize: 12, color: 'var(--dsw-alias-content-secondary, #64748b)' } }, `${list.count} 条`),
    ),
    createElement('div', { style: { display: 'grid', gap: 10 } },
      ...list.items.map((item, index) => OpportunityCard(item, false, `opportunity-${index}`)),
    ),
    )
  }

  return createElement('section', {
    style: {
      margin: '8px 0',
      maxWidth: 820,
    },
  }, OpportunityCard(detail as OpportunityView, true, 'opportunity-detail'))
}

function ResearchStartToolView({ block }: ToolCallViewProps) {
  const value = parseResearchStart(presentationMeta(block))
  if (value === null) return fallbackToolRow('研究已启动', block)
  return createElement('section', {
    style: {
      border: '1px solid var(--dsw-alias-border-default, #dbe3ef)',
      borderRadius: 14,
      padding: '14px 16px',
      margin: '8px 0',
      background: 'var(--dsw-alias-surface-subtle, #f8fafc)',
      maxWidth: 820,
    },
  },
  createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 12 } },
    createElement('div', { style: { fontSize: 15, fontWeight: 750 } }, '后台研究已启动'),
    badge('运行中', 'primary'),
  ),
  createElement('div', {
    style: { marginTop: 8, fontSize: 13, color: 'var(--dsw-alias-content-secondary, #475569)' },
  }, `机会 ${value.opportunity_id}`),
  createElement('div', {
    style: { marginTop: 8, fontSize: 12, color: 'var(--dsw-alias-content-tertiary, #94a3b8)' },
  }, `Research Case ${value.research_case_id} · Harness Job ${value.job_id}`),
  createElement('div', {
    style: { marginTop: 10, fontSize: 12, lineHeight: 1.6, color: 'var(--dsw-alias-content-secondary, #64748b)' },
  }, '运行进度以 Editorial API 的 Research Case 为事实源；任务完成后会生成可重放的研究结果卡。'),
  )
}

function ResearchResultToolView({ block }: ToolCallViewProps) {
  const value = parseResearchResult(presentationMeta(block))
  if (value === null) return fallbackToolRow('研究结果', block)
  return createElement('section', {
    style: {
      border: '1px solid var(--dsw-alias-border-default, #dbe3ef)',
      borderRadius: 14,
      padding: '16px 18px',
      margin: '8px 0',
      background: 'var(--dsw-alias-surface-card, #fff)',
      maxWidth: 900,
    },
  },
  createElement('div', {
    style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  },
  createElement('div', { style: { fontSize: 16, fontWeight: 750 } }, '研究结果'),
  createElement('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' } },
    badge(`证据 ${value.evidence_count}`, 'primary'),
    badge(`未知项 ${value.open_unknown_count}`, value.open_unknown_count > 0 ? 'warning' : 'neutral'),
    value.result_kind === 'deterministic_spike_mock' ? badge('Spike 模拟结果', 'warning') : null,
  )),
  createElement('div', {
    style: { marginTop: 10, fontSize: 13, lineHeight: 1.65, color: 'var(--dsw-alias-content-secondary, #475569)' },
  }, value.goal),
  createElement('div', { style: { display: 'grid', gap: 10, marginTop: 14 } },
    ...value.evidence.map((item, index) => createElement('article', {
      key: item.evidence_id,
      style: {
        border: '1px solid var(--dsw-alias-border-subtle, #eef2f7)',
        borderRadius: 10,
        padding: '11px 12px',
        background: 'var(--dsw-alias-surface-subtle, #f8fafc)',
      },
    },
    createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
      badge(stanceLabel(item.stance), item.stance === 'contradicting' ? 'warning' : 'neutral'),
      createElement('span', { style: { fontSize: 12, opacity: 0.62 } }, `#${index + 1}`),
    ),
    createElement('div', { style: { marginTop: 7, fontSize: 13, fontWeight: 650, lineHeight: 1.55 } }, item.claim),
    createElement('div', { style: { marginTop: 5, fontSize: 12, lineHeight: 1.55, color: 'var(--dsw-alias-content-secondary, #64748b)' } }, item.summary),
    createElement('div', { style: { marginTop: 6, fontSize: 11, color: 'var(--dsw-alias-content-tertiary, #94a3b8)' } }, `${item.source_title} · ${item.source_type} · ${item.confidence}`),
    )),
  ),
  value.unknowns.length === 0 ? null : createElement('div', {
    style: {
      marginTop: 14,
      paddingTop: 12,
      borderTop: '1px solid var(--dsw-alias-border-subtle, #eef2f7)',
    },
  },
  createElement('div', { style: { fontSize: 12, fontWeight: 700, marginBottom: 6 } }, '仍待确认'),
  ...value.unknowns.map(item => createElement('div', {
    key: item.unknown_id,
    style: { fontSize: 13, lineHeight: 1.6, color: 'var(--dsw-alias-content-secondary, #475569)' },
  }, `• ${item.question}`)),
  ),
  createElement('div', {
    style: {
      marginTop: 14,
      paddingTop: 12,
      borderTop: '1px solid var(--dsw-alias-border-subtle, #eef2f7)',
      fontSize: 13,
      lineHeight: 1.65,
    },
  }, value.conclusion),
  createElement('div', {
    style: { marginTop: 10, fontSize: 11, color: 'var(--dsw-alias-content-tertiary, #94a3b8)' },
  }, `${value.research_case_id} · ${value.opportunity_id}`),
  )
}

export const name = 'ai-editorial-desk-harness-spike-client'
export const inject = ['conversationEvents', 'slots']

export function apply(ctx: ClientContext): void {
  // Legacy-only: repaired pre-fix sessions can still project their old Research Node.
  ctx.conversationEvents.register(researchDefinition)
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'editorial-research',
  }, ResearchNodeView))
  ctx.slots.inject('tool.call.toolview', function* () {
    yield ctx.slots.register({
      name: 'tool.call.toolview',
      key: 'list_editorial_opportunities',
    }, OpportunityToolView)
    yield ctx.slots.register({
      name: 'tool.call.toolview',
      key: 'inspect_editorial_opportunity',
    }, OpportunityToolView)
    yield ctx.slots.register({
      name: 'tool.call.toolview',
      key: 'start_editorial_research',
    }, ResearchStartToolView)
    yield ctx.slots.register({
      name: 'tool.call.toolview',
      key: 'get_editorial_research_result',
    }, ResearchResultToolView)
  })
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'editorial-research-workspace',
    order: 20,
    label: '研究工作台',
  }, ResearchWorkspaceView))
}
