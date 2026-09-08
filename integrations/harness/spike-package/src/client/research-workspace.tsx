import { useMemo, type ReactNode } from 'react'
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'

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

interface WorkspaceProjection {
  result: ResearchResultView | null
  opportunity: OpportunityView | null
  start: ResearchStartView | null
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
  const evidenceState = value.evidence_state
  const highlights = value.value_highlights
  if (!isRecord(evidenceState) || typeof evidenceState.open_unknown_count !== 'number') return null
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
    evidence_state: { open_unknown_count: evidenceState.open_unknown_count },
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

function parseResearchStart(value: unknown): ResearchStartView | null {
  if (!isRecord(value)) return null
  const researchCaseId = stringField(value, 'research_case_id')
  const opportunityId = stringField(value, 'opportunity_id')
  const jobId = stringField(value, 'job_id')
  if (researchCaseId === null || opportunityId === null || jobId === null) return null
  return { research_case_id: researchCaseId, opportunity_id: opportunityId, job_id: jobId }
}

function parseEvidence(value: unknown): ResearchEvidenceView | null {
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

function parseUnknown(value: unknown): ResearchUnknownView | null {
  if (!isRecord(value)) return null
  const unknownId = stringField(value, 'unknown_id')
  const question = stringField(value, 'question')
  const status = stringField(value, 'status')
  if (unknownId === null || question === null || status === null) return null
  return { unknown_id: unknownId, question, status }
}

function parseResearchResult(value: unknown): ResearchResultView | null {
  if (!isRecord(value)) return null
  const rawEvidence = value.evidence
  const rawUnknowns = value.unknowns
  if (!Array.isArray(rawEvidence) || !Array.isArray(rawUnknowns)) return null

  const researchCaseId = stringField(value, 'research_case_id')
  const opportunityId = stringField(value, 'opportunity_id')
  const goal = stringField(value, 'goal')
  const status = stringField(value, 'status')
  const resultKind = stringField(value, 'result_kind')
  const conclusion = stringField(value, 'conclusion')
  const evidenceCount = numberField(value, 'evidence_count')
  const unknownCount = numberField(value, 'open_unknown_count')
  const evidence = rawEvidence.map(parseEvidence)
  const unknowns = rawUnknowns.map(parseUnknown)
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

/**
 * Read only the stock Chat target's durable finalized ToolResult nodes.
 *
 * Do not recursively enumerate the whole Session snapshot: Cordis service
 * proxies can appear elsewhere on that object graph and intentionally throw
 * when arbitrary properties are read without a declared inject face.
 */
function durableToolMetadata(chatSnapshot: unknown): readonly unknown[] {
  if (!isRecord(chatSnapshot)) return []
  const legacy = chatSnapshot.legacy
  if (!isRecord(legacy) || !Array.isArray(legacy.nodes)) return []
  return legacy.nodes.flatMap((node) => {
    if (!isRecord(node) || node.kind !== 'tool-result') return []
    return [node.meta]
  })
}

function collectWorkspaceProjection(chatSnapshot: unknown): WorkspaceProjection {
  const starts: ResearchStartView[] = []
  const results: ResearchResultView[] = []
  const opportunities: OpportunityView[] = []

  for (const meta of durableToolMetadata(chatSnapshot)) {
    const result = parseResearchResult(meta)
    if (result !== null) results.push(result)
    const start = parseResearchStart(meta)
    if (start !== null) starts.push(start)
    const opportunity = parseOpportunity(meta)
    if (opportunity !== null) opportunities.push(opportunity)
    opportunities.push(...parseOpportunityList(meta))
  }

  const start = starts.at(-1) ?? null
  const result = start === null
    ? results.at(-1) ?? null
    : [...results].reverse().find(item => item.research_case_id === start.research_case_id)
      ?? results.at(-1)
      ?? null
  const opportunityId = result?.opportunity_id ?? start?.opportunity_id
  const opportunity = opportunityId === undefined
    ? opportunities.at(-1) ?? null
    : [...opportunities].reverse().find(item => item.opportunity_id === opportunityId)
      ?? null

  return { result, opportunity, start }
}

function stanceLabel(value: string): string {
  switch (value) {
    case 'supporting': return '支持证据'
    case 'contradicting': return '反向证据'
    case 'context': return '条件背景'
    default: return value
  }
}

function stanceTone(value: string): { background: string; color: string } {
  if (value === 'contradicting') return { background: 'rgba(245,158,11,.12)', color: '#a16207' }
  if (value === 'supporting') return { background: 'rgba(16,185,129,.10)', color: '#047857' }
  return { background: 'rgba(99,102,241,.10)', color: '#4f46e5' }
}

function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'primary' | 'neutral' | 'warning' }) {
  const style = tone === 'primary'
    ? { background: 'rgba(79,70,229,.10)', color: '#4f46e5' }
    : tone === 'warning'
      ? { background: 'rgba(245,158,11,.12)', color: '#a16207' }
      : { background: 'rgba(100,116,139,.10)', color: '#64748b' }
  return <span style={{ ...style, borderRadius: 999, padding: '3px 8px', fontSize: 12, fontWeight: 700 }}>{children}</span>
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{
      border: '1px solid var(--dsw-alias-border-default, #e2e8f0)',
      borderRadius: 14,
      background: 'var(--dsw-alias-surface-card, #fff)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--dsw-alias-border-subtle, #eef2f7)',
        fontSize: 13,
        fontWeight: 750,
      }}>{title}</div>
      <div style={{ padding: 14 }}>{children}</div>
    </section>
  )
}

function EmptyWorkspace() {
  return (
    <div style={{
      minHeight: '100%',
      display: 'grid',
      placeItems: 'center',
      padding: 36,
      background: 'var(--dsw-alias-surface-subtle, #f8fafc)',
    }}>
      <div style={{ maxWidth: 560, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>研究工作台</div>
        <p style={{ marginTop: 10, color: '#64748b', lineHeight: 1.7 }}>
          当前会话还没有可重建的 Research Result。先回到“对话”页启动一次研究并取得结果，
          本页会直接从该 Session 的 Chat target 持久 Tool Result 投影研究工作区。
        </p>
      </div>
    </div>
  )
}

export function ResearchWorkspaceView({ useSession }: ConvViewProps) {
  const chatSnapshot = useSession(snapshot => snapshot.views.get('chat'))
  const projection = useMemo(() => collectWorkspaceProjection(chatSnapshot), [chatSnapshot])
  const result = projection.result
  if (result === null) return <EmptyWorkspace />

  const opportunity = projection.opportunity
  const sources = result.evidence.map(item => ({
    id: item.evidence_id,
    title: item.source_title,
    type: item.source_type,
    locator: item.locator,
  }))
  const uniqueSources = sources.filter((source, index) =>
    sources.findIndex(candidate => candidate.title === source.title && candidate.locator === source.locator) === index)

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      background: 'var(--dsw-alias-surface-subtle, #f8fafc)',
      color: 'var(--dsw-alias-content-primary, #172033)',
    }}>
      <div style={{ minWidth: 1040, padding: '18px 20px 28px' }}>
        <header style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, paddingBottom: 16,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Pill tone="primary">Research Workspace</Pill>
              <Pill>{result.status === 'completed' ? '研究完成' : result.status}</Pill>
              {result.result_kind === 'deterministic_spike_mock' ? <Pill tone="warning">Spike 模拟结果</Pill> : null}
            </div>
            <h2 style={{ margin: '10px 0 4px', fontSize: 21, lineHeight: 1.4 }}>
              {opportunity?.headline ?? result.goal}
            </h2>
            <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>{result.goal}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Pill tone="primary">证据 {result.evidence_count}</Pill>
            <Pill tone={result.open_unknown_count > 0 ? 'warning' : 'neutral'}>未知项 {result.open_unknown_count}</Pill>
          </div>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(230px, .85fr) minmax(470px, 1.9fr) minmax(250px, 1fr)',
          gap: 14,
          alignItems: 'start',
        }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <Panel title="研究计划与目标">
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>{result.goal}</div>
              <div style={{ marginTop: 12, display: 'grid', gap: 8, fontSize: 12, color: '#64748b' }}>
                <div>✓ Research Case 已完成</div>
                <div>✓ 已形成 {result.evidence_count} 条 Evidence</div>
                <div>{result.open_unknown_count > 0 ? '○' : '✓'} 剩余 Unknown {result.open_unknown_count}</div>
              </div>
            </Panel>

            <Panel title="待解未知项 Unknowns">
              {result.unknowns.length === 0
                ? <div style={{ fontSize: 13, color: '#64748b' }}>当前没有开放 Unknown。</div>
                : <div style={{ display: 'grid', gap: 10 }}>
                    {result.unknowns.map(item => (
                      <div key={item.unknown_id} style={{
                        padding: 10,
                        borderRadius: 10,
                        background: 'rgba(245,158,11,.07)',
                        border: '1px solid rgba(245,158,11,.18)',
                        fontSize: 12,
                        lineHeight: 1.6,
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>待确认</div>
                        {item.question}
                      </div>
                    ))}
                  </div>}
            </Panel>

            <Panel title="机会上下文">
              <div style={{ fontSize: 12, lineHeight: 1.65, color: '#64748b' }}>
                <div><b>Opportunity</b> {result.opportunity_id}</div>
                {opportunity === null ? null : <>
                  <div style={{ marginTop: 8 }}><b>主题</b> {opportunity.theme}</div>
                  <div style={{ marginTop: 8 }}><b>受众承诺</b> {opportunity.audience_promise}</div>
                  <div style={{ marginTop: 8 }}><b>就绪度</b> {opportunity.production_readiness}</div>
                </>}
              </div>
            </Panel>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <Panel title="主张与证据 Claim & Evidence">
              <div style={{ display: 'grid', gap: 10 }}>
                {result.evidence.map((item, index) => {
                  const tone = stanceTone(item.stance)
                  return (
                    <article key={item.evidence_id} style={{
                      border: '1px solid var(--dsw-alias-border-subtle, #e9eef5)',
                      borderRadius: 12,
                      padding: 12,
                      background: 'var(--dsw-alias-surface-subtle, #f8fafc)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                        <span style={{ ...tone, borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 750 }}>
                          {stanceLabel(item.stance)}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: 11 }}>#{index + 1} · {item.confidence}</span>
                      </div>
                      <div style={{ marginTop: 8, fontWeight: 750, fontSize: 14, lineHeight: 1.55 }}>{item.claim}</div>
                      <div style={{ marginTop: 6, color: '#64748b', fontSize: 12, lineHeight: 1.65 }}>{item.summary}</div>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 9, paddingTop: 8,
                        borderTop: '1px solid var(--dsw-alias-border-subtle, #eef2f7)', color: '#94a3b8', fontSize: 11,
                      }}>
                        <span>{item.source_title}</span>
                        <span>{item.source_type}</span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </Panel>

            <Panel title="条件化结论">
              <div style={{ fontSize: 13, lineHeight: 1.75 }}>{result.conclusion}</div>
            </Panel>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <Panel title={`来源 Sources · ${uniqueSources.length}`}>
              <div style={{ display: 'grid', gap: 9 }}>
                {uniqueSources.map(source => (
                  <div key={source.id} style={{ paddingBottom: 9, borderBottom: '1px solid var(--dsw-alias-border-subtle, #eef2f7)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.5 }}>{source.title}</div>
                    <div style={{ marginTop: 3, fontSize: 11, color: '#94a3b8' }}>{source.type} · {source.locator}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="可观察的 Agent Activity">
              <div style={{ display: 'grid', gap: 10, fontSize: 12, lineHeight: 1.55 }}>
                <div><span style={{ color: '#10b981' }}>●</span> 后台 Research Job 已完成</div>
                <div><span style={{ color: '#6366f1' }}>●</span> Research Result 已写入标准 Tool Result</div>
                <div><span style={{ color: '#6366f1' }}>●</span> Evidence / Unknown 已可重放</div>
                <div><span style={{ color: '#94a3b8' }}>●</span> 当前仍为 deterministic Spike，不展示隐藏推理过程</div>
              </div>
            </Panel>

            <Panel title="宿主上下文">
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
                <div>Research Case: {result.research_case_id}</div>
                <div>Opportunity: {result.opportunity_id}</div>
                {projection.start === null ? null : <div>Harness Job: {projection.start.job_id}</div>}
                <div style={{ marginTop: 8 }}>本页作为 Harness `conversation.view`，从 Chat target 的 durable ToolResult.meta 投影。</div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
