import { useMemo, type ReactNode } from 'react'
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'

interface OpportunityView {
  opportunity_id: string
  headline: string
  angle: string
  theme: string
  audience_promise: string
  recommendation: string
  research_status: string
  evidence_state: { open_unknown_count: number }
  production_readiness: string
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
  const opportunityId = stringField(value, 'opportunity_id')
  const headline = stringField(value, 'headline')
  const angle = stringField(value, 'angle')
  const theme = stringField(value, 'theme')
  const audiencePromise = stringField(value, 'audience_promise')
  const recommendation = stringField(value, 'recommendation')
  const researchStatus = stringField(value, 'research_status')
  const readiness = stringField(value, 'production_readiness')
  if (
    opportunityId === null || headline === null || angle === null || theme === null
    || audiencePromise === null || recommendation === null || researchStatus === null || readiness === null
  ) return null
  return {
    opportunity_id: opportunityId,
    headline,
    angle,
    theme,
    audience_promise: audiencePromise,
    recommendation,
    research_status: researchStatus,
    evidence_state: { open_unknown_count: evidence.open_unknown_count },
    production_readiness: readiness,
  }
}

function parseOpportunityList(value: unknown): OpportunityView[] {
  if (!isRecord(value) || !Array.isArray(value.items)) return []
  return value.items.flatMap((item) => {
    const parsed = parseOpportunity(item)
    return parsed === null ? [] : [parsed]
  })
}

function durableToolMetadata(chatSnapshot: unknown): readonly unknown[] {
  if (!isRecord(chatSnapshot)) return []
  const legacy = chatSnapshot.legacy
  if (!isRecord(legacy) || !Array.isArray(legacy.nodes)) return []
  return legacy.nodes.flatMap((node) => {
    if (!isRecord(node) || node.kind !== 'tool-result') return []
    return [node.meta]
  })
}

function collectOpportunities(chatSnapshot: unknown): OpportunityView[] {
  const byId = new Map<string, OpportunityView>()
  for (const meta of durableToolMetadata(chatSnapshot)) {
    for (const item of parseOpportunityList(meta)) byId.set(item.opportunity_id, item)
    const detail = parseOpportunity(meta)
    if (detail !== null) byId.set(detail.opportunity_id, detail)
  }
  return [...byId.values()]
}

function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'primary' | 'neutral' | 'warning' }) {
  const style = tone === 'primary'
    ? { background: 'rgba(79,70,229,.10)', color: '#4f46e5' }
    : tone === 'warning'
      ? { background: 'rgba(245,158,11,.12)', color: '#a16207' }
      : { background: 'rgba(100,116,139,.10)', color: '#64748b' }
  return <span style={{ ...style, borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>{children}</span>
}

function readinessLabel(value: string): string {
  switch (value) {
    case 'high': return '就绪度高'
    case 'medium': return '就绪度中'
    case 'low': return '就绪度低'
    default: return value
  }
}

function researchLabel(value: string): string {
  switch (value) {
    case 'completed': return '研究完成'
    case 'running': return '研究中'
    case 'not_started': return '待研究'
    default: return value
  }
}

function CandidateCard({ item }: { item: OpportunityView }) {
  return (
    <article style={{
      border: '1px solid var(--dsw-alias-border-default, #e2e8f0)',
      borderRadius: 12,
      background: 'var(--dsw-alias-surface-card, #fff)',
      padding: 12,
      boxShadow: '0 1px 2px rgba(15,23,42,.03)',
    }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Pill tone={item.research_status === 'completed' ? 'neutral' : 'warning'}>{researchLabel(item.research_status)}</Pill>
        <Pill>{readinessLabel(item.production_readiness)}</Pill>
      </div>
      <div style={{ marginTop: 9, fontSize: 14, lineHeight: 1.5, fontWeight: 750 }}>{item.headline}</div>
      <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: '#64748b' }}>{item.angle}</div>
      <div style={{ marginTop: 9, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, color: '#94a3b8' }}>
        <span>{item.theme}</span>
        <span>Unknown {item.evidence_state.open_unknown_count}</span>
      </div>
    </article>
  )
}

interface Lane {
  id: string
  title: string
  subtitle: string
  items: OpportunityView[]
}

function lanesOf(items: OpportunityView[]): Lane[] {
  return [
    {
      id: 'main',
      title: '主推',
      subtitle: '今天最值得投入编辑资源',
      items: items.filter(item => item.recommendation === 'today_main'),
    },
    {
      id: 'backup',
      title: '备选',
      subtitle: '条件成熟即可上升',
      items: items.filter(item => item.recommendation === 'potential'),
    },
    {
      id: 'watch',
      title: '观察',
      subtitle: '等待事实、时机或讨论继续发展',
      items: items.filter(item => item.recommendation === 'watch'),
    },
    {
      id: 'hold',
      title: '暂缓 / Evergreen',
      subtitle: '不抢今天，但保留长期价值',
      items: items.filter(item => item.recommendation === 'evergreen'
        || !['today_main', 'potential', 'watch'].includes(item.recommendation)),
    },
  ]
}

function EmptyBoard() {
  return (
    <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 36, background: '#f8fafc' }}>
      <div style={{ maxWidth: 620, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>编排看板 · Hostability Control</div>
        <p style={{ marginTop: 10, color: '#64748b', lineHeight: 1.75 }}>
          当前 Session 还没有持久化的 Opportunity 列表。先回到“对话”让 Agent 列出编辑机会，本页会从该 Session 的 Tool Result 重建候选。
        </p>
        <p style={{ marginTop: 8, color: '#a16207', lineHeight: 1.7, fontSize: 13 }}>
          这也刻意暴露本轮要验证的边界：Programming 在目标产品里是全局业务模块，但 Harness 的 additive whole-page seam `conversation.view` 是 Session scoped。
        </p>
      </div>
    </div>
  )
}

export function ProgrammingBoardView({ useSession }: ConvViewProps) {
  const chatSnapshot = useSession(snapshot => snapshot.views.get('chat'))
  const opportunities = useMemo(() => collectOpportunities(chatSnapshot), [chatSnapshot])
  const lanes = useMemo(() => lanesOf(opportunities), [opportunities])
  if (opportunities.length === 0) return <EmptyBoard />

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#f8fafc', color: '#172033' }}>
      <div style={{ minWidth: 1120, padding: '18px 20px 28px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', paddingBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <Pill tone="primary">Programming Hostability Control</Pill>
              <Pill tone="warning">Session scoped</Pill>
            </div>
            <h2 style={{ margin: '10px 0 4px', fontSize: 22 }}>编排看板</h2>
            <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.65 }}>
              验证横向 Slate / Candidate Board 能否在 Harness 中承载；这不是最终产品导航模型。
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, lineHeight: 1.65, color: '#64748b' }}>
            <div>候选 {opportunities.length}</div>
            <div>来源：当前 Session durable Tool Result</div>
          </div>
        </header>

        <section style={{
          border: '1px solid rgba(245,158,11,.24)',
          background: 'rgba(245,158,11,.07)',
          borderRadius: 12,
          padding: '10px 12px',
          fontSize: 12,
          lineHeight: 1.65,
          color: '#854d0e',
          marginBottom: 14,
        }}>
          架构探针：本页可以作为 `conversation.view` 做复杂 Kanban，但它必须依附某个 Session；目标产品的 Programming 应跨 Session、跨 Agent 对话持续存在，并从全局一级导航直接进入。
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(245px, 1fr))', gap: 12, alignItems: 'start' }}>
          {lanes.map(lane => (
            <section key={lane.id} style={{
              border: '1px solid var(--dsw-alias-border-default, #e2e8f0)',
              borderRadius: 14,
              background: 'rgba(255,255,255,.72)',
              overflow: 'hidden',
              minHeight: 360,
            }}>
              <div style={{ padding: '12px 13px', borderBottom: '1px solid #eef2f7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{lane.title}</div>
                  <Pill>{lane.items.length}</Pill>
                </div>
                <div style={{ marginTop: 3, color: '#94a3b8', fontSize: 11, lineHeight: 1.5 }}>{lane.subtitle}</div>
              </div>
              <div style={{ padding: 10, display: 'grid', gap: 9 }}>
                {lane.items.length === 0
                  ? <div style={{ padding: '26px 10px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>当前无候选</div>
                  : lane.items.map(item => <CandidateCard key={item.opportunity_id} item={item} />)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
