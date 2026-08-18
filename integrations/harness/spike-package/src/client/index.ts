import { createElement } from 'react'
import type {
  ClientContext,
  ConversationLocation,
  ConversationNodeContext,
  ConversationNodeDefinition,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { ChatNodeViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
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

declare module '@deepseek-ai/dsh-client-ui-conversation/client' {
  interface ChatNodeDataMap {
    'editorial-research': ResearchNodeData
  }
}

declare module '@deepseek-ai/dsh-client-runtime/client' {
  interface ConversationStepDataMap {
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
  buildLocationData(context, scope) {
    if (scope !== 'step' || context.state === undefined) return null
    return {
      kind: 'step',
      key: 'editorial-research',
      value: viewData(context.state),
    }
  },
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

function ResearchNodeView({ node }: ChatNodeViewProps<'editorial-research'>) {
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

export const name = 'ai-editorial-desk-harness-spike-client'
export const inject = ['conversationEvents', 'slots']

export function apply(ctx: ClientContext): void {
  ctx.conversationEvents.register(researchDefinition)
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'editorial-research',
  }, ResearchNodeView))
}
