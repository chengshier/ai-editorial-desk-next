import { createElement } from 'react'
import type {
  ClientContext,
  ConversationLocation,
  ConversationNodeContext,
  ConversationNodeDefinition,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { ChatNodeViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ToolCallViewProps } from '@deepseek-ai/dsh-client-ui-tool/client'
import '../events.ts'

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

function fallbackOpportunityRow(block: ToolCallViewProps['block']) {
  return createElement('div', {
    style: {
      border: '1px solid var(--dsw-alias-border-default, #e2e8f0)',
      borderRadius: 12,
      padding: '12px 14px',
      margin: '8px 0',
      background: 'var(--dsw-alias-surface-card, #fff)',
    },
  },
  createElement('div', { style: { fontWeight: 650, marginBottom: 8 } }, '编辑机会'),
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
  if (list === null && detail === null) return fallbackOpportunityRow(block)

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

export const name = 'ai-editorial-desk-harness-spike-client'
export const inject = ['conversationEvents', 'slots']

export function apply(ctx: ClientContext): void {
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
  })
}
