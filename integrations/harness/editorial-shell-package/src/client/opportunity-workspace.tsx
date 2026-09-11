import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createEditorialResearchCase,
  inspectEditorialOpportunity,
  listEditorialOpportunities,
  type OpportunitySummary,
} from './editorial.ts'
import { readProductParam, writeProductParams } from './product-state.ts'

type WorkspaceKind = 'today' | 'library'
type InspectorTab = 'overview' | 'evidence' | 'research' | 'timeline' | 'history'
type LayoutMode = 'cards' | 'compact'
type LibrarySort = 'readiness' | 'confidence' | 'research' | 'headline'

export interface ResearchTarget {
  researchCaseId: string
  opportunityId: string
}

interface OpportunityWorkspaceProps {
  apiBase: string
  kind: WorkspaceKind
  onResearchTarget(target: ResearchTarget): void
}

const colors = {
  panel: '#ffffff',
  border: '#e5eaf1',
  heading: '#172033',
  text: '#475569',
  muted: '#94a3b8',
  brand: '#4f46e5',
  brandSoft: '#eef2ff',
  danger: '#b91c1c',
  warning: '#a16207',
  success: '#15803d',
}

const levelRank: Record<string, number> = { high: 3, medium: 2, low: 1 }
const researchRank: Record<string, number> = { running: 3, not_started: 2, completed: 1 }
const inspectorTabs: Array<[InspectorTab, string]> = [
  ['overview', '概览'],
  ['evidence', '证据'],
  ['research', '研究'],
  ['timeline', '时间线'],
  ['history', '历史'],
]

function recommendationLabel(value: string): string {
  if (value === 'today_main') return '今日主推'
  if (value === 'evergreen') return '长期储备'
  if (value === 'watch') return '观察'
  return value
}

function researchLabel(value: string): string {
  if (value === 'not_started') return '待研究'
  if (value === 'running') return '研究中'
  if (value === 'completed') return '研究完成'
  return value
}

function normalizeTab(value: string | null): InspectorTab {
  return inspectorTabs.some(([tab]) => tab === value) ? value as InspectorTab : 'overview'
}

function normalizeLayout(value: string | null): LayoutMode {
  return value === 'compact' ? 'compact' : 'cards'
}

function normalizeSort(value: string | null): LibrarySort {
  return value === 'confidence' || value === 'research' || value === 'headline' ? value : 'readiness'
}

function matchesSearch(item: OpportunitySummary, query: string): boolean {
  if (!query) return true
  const haystack = [
    item.headline,
    item.angle,
    item.theme,
    item.audience_promise,
    item.why_now,
    item.subject.name,
    item.subject.type,
    ...item.value_highlights,
  ].join(' ').toLowerCase()
  return haystack.includes(query.toLowerCase())
}

function sortItems(items: OpportunitySummary[], sort: LibrarySort): OpportunitySummary[] {
  return [...items].sort((left, right) => {
    if (sort === 'headline') return left.headline.localeCompare(right.headline, 'zh-CN')
    if (sort === 'confidence') return (levelRank[right.confidence] ?? 0) - (levelRank[left.confidence] ?? 0)
    if (sort === 'research') return (researchRank[right.research_status] ?? 0) - (researchRank[left.research_status] ?? 0)
    return (levelRank[right.production_readiness] ?? 0) - (levelRank[left.production_readiness] ?? 0)
  })
}

function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'brand' | 'success' | 'warning' }) {
  const palette = tone === 'brand'
    ? { background: colors.brandSoft, color: colors.brand }
    : tone === 'success'
      ? { background: '#ecfdf3', color: colors.success }
      : tone === 'warning'
        ? { background: '#fffbeb', color: colors.warning }
        : { background: '#f8fafc', color: colors.text }
  return <span style={{ ...palette, borderRadius: 999, padding: '3px 8px', fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap' }}>{children}</span>
}

function OpportunityCard({ item, selected, onSelect, onResearch, researchBusy }: {
  item: OpportunitySummary
  selected: boolean
  onSelect(): void
  onResearch(): void
  researchBusy: boolean
}) {
  return <article style={{
    background: colors.panel,
    border: `1px solid ${selected ? '#a5b4fc' : colors.border}`,
    boxShadow: selected ? '0 0 0 2px #eef2ff' : 'none',
    borderRadius: 14,
    padding: '15px 17px',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Pill tone={item.recommendation === 'today_main' ? 'brand' : 'neutral'}>{recommendationLabel(item.recommendation)}</Pill>
        <Pill tone={item.research_status === 'completed' ? 'success' : item.research_status === 'running' ? 'warning' : 'neutral'}>{researchLabel(item.research_status)}</Pill>
      </div>
      <code style={{ color: colors.muted, fontSize: 9 }}>{item.opportunity_id}</code>
    </div>
    <button type="button" onClick={onSelect} style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}>
      <h3 style={{ margin: '11px 0 5px', color: colors.heading, fontSize: 15 }}>{item.headline}</h3>
      <p style={{ margin: 0, color: colors.text, fontSize: 12, lineHeight: 1.65 }}>{item.angle}</p>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, color: colors.muted, fontSize: 10 }}>
        <span>{item.theme}</span><span>置信度 {item.confidence}</span><span>就绪度 {item.production_readiness}</span>
      </div>
    </button>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginTop: 12, paddingTop: 11, borderTop: `1px solid ${colors.border}` }}>
      <span style={{ color: colors.muted, fontSize: 10 }}>开放未知项 {item.evidence_state.open_unknown_count}</span>
      <button type="button" onClick={onResearch} disabled={researchBusy} style={{ border: 0, borderRadius: 8, background: colors.brand, color: '#fff', padding: '7px 10px', fontSize: 11, fontWeight: 800, cursor: researchBusy ? 'wait' : 'pointer', opacity: researchBusy ? .6 : 1 }}>
        {item.latest_research_case_id ? '进入研究' : '开始研究'}
      </button>
    </div>
  </article>
}

function InspectorEmpty({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ padding: '24px 18px', textAlign: 'center', color: colors.muted }}>
    <strong style={{ display: 'block', color: colors.heading, fontSize: 13, marginBottom: 6 }}>{title}</strong>
    <div style={{ fontSize: 11, lineHeight: 1.7 }}>{children}</div>
  </div>
}

function OpportunityInspector({
  item,
  selectedId,
  tab,
  loading,
  error,
  researchBusy,
  researchError,
  onTab,
  onClose,
  onRetry,
  onResearch,
}: {
  item: OpportunitySummary | null
  selectedId: string | null
  tab: InspectorTab
  loading: boolean
  error: string | null
  researchBusy: boolean
  researchError: string | null
  onTab(tab: InspectorTab): void
  onClose(): void
  onRetry(): void
  onResearch(): void
}) {
  return <aside aria-label="机会详情" style={{ minWidth: 0, background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden', alignSelf: 'start', position: 'sticky', top: 18 }}>
    <div style={{ minHeight: 44, padding: '0 13px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <strong style={{ fontSize: 12 }}>{selectedId ? 'Opportunity Inspector' : '机会洞察'}</strong>
      {selectedId ? <button type="button" aria-label="关闭机会详情" onClick={onClose} style={{ border: 0, background: 'transparent', color: colors.muted, cursor: 'pointer', fontSize: 16 }}>×</button> : null}
    </div>
    {!selectedId ? <InspectorEmpty title="选择一个编辑机会">点击左侧卡片查看推荐角度、读者承诺、研究状态与下一步。</InspectorEmpty>
      : loading ? <InspectorEmpty title="正在读取机会详情">Editorial API 正在返回最新有效 Opportunity。</InspectorEmpty>
        : error ? <div><InspectorEmpty title="机会详情读取失败">{error}</InspectorEmpty><div style={{ padding: '0 16px 16px' }}><button type="button" onClick={onRetry}>重新读取详情</button></div></div>
          : item ? <>
            <div style={{ padding: '15px 15px 12px' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><Pill tone="brand">{recommendationLabel(item.recommendation)}</Pill><Pill>{researchLabel(item.research_status)}</Pill></div>
              <h2 style={{ margin: '10px 0 4px', fontSize: 17 }}>{item.headline}</h2>
              <div style={{ color: colors.muted, fontSize: 10 }}>{item.subject.name} · {item.subject.type}</div>
              <p style={{ color: colors.text, fontSize: 11, lineHeight: 1.65, margin: '9px 0 0' }}>{item.angle}</p>
            </div>
            <div role="tablist" aria-label="Opportunity Inspector" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
              {inspectorTabs.map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => onTab(value)} style={{ border: 0, borderBottom: tab === value ? `2px solid ${colors.brand}` : '2px solid transparent', background: 'transparent', color: tab === value ? colors.brand : colors.muted, padding: '9px 2px 7px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>{label}</button>)}
            </div>
            <div role="tabpanel" style={{ minHeight: 245, padding: 15 }}>
              {tab === 'overview' ? <div style={{ display: 'grid', gap: 11 }}>
                <div><strong style={{ fontSize: 11 }}>读者承诺</strong><p style={{ margin: '4px 0 0', color: colors.text, fontSize: 11, lineHeight: 1.65 }}>{item.audience_promise}</p></div>
                <div><strong style={{ fontSize: 11 }}>为什么是现在</strong><p style={{ margin: '4px 0 0', color: colors.text, fontSize: 11, lineHeight: 1.65 }}>{item.why_now}</p></div>
                <div><strong style={{ fontSize: 11 }}>价值亮点</strong><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>{item.value_highlights.map(value => <Pill key={value}>{value}</Pill>)}</div></div>
              </div> : null}
              {tab === 'evidence' ? <InspectorEmpty title="证据详情暂未开放">当前 Opportunity read model 尚未提供结构化证据列表。现有开放未知项：{item.evidence_state.open_unknown_count}。</InspectorEmpty> : null}
              {tab === 'research' ? <div style={{ display: 'grid', gap: 12 }}>
                <div><strong style={{ fontSize: 11 }}>Research 状态</strong><p style={{ margin: '4px 0 0', color: colors.text, fontSize: 11 }}>{researchLabel(item.research_status)}</p></div>
                <div><strong style={{ fontSize: 11 }}>Research Case</strong><p style={{ margin: '4px 0 0', color: colors.text, fontSize: 11 }}>{item.latest_research_case_id ?? '尚未创建'}</p></div>
                <p style={{ margin: 0, color: colors.muted, fontSize: 10, lineHeight: 1.65 }}>N2 负责创建/复用业务 Research Case；N3 再由 Runtime Adapter 主动绑定 Harness Session 并执行 Agent。</p>
              </div> : null}
              {tab === 'timeline' ? <InspectorEmpty title="时间线暂未开放">当前尚未提供正式业务事件流；本批不伪造时间线。</InspectorEmpty> : null}
              {tab === 'history' ? <InspectorEmpty title="决策历史暂未开放">Human Decision API 尚未接入；本批不伪造 Adopt / Watch / Drop 历史。</InspectorEmpty> : null}
            </div>
            <div style={{ borderTop: `1px solid ${colors.border}`, padding: 12 }}>
              {researchError ? <div role="alert" style={{ color: colors.danger, fontSize: 10, marginBottom: 8 }}>研究操作失败：{researchError}</div> : null}
              <button type="button" onClick={onResearch} disabled={researchBusy} style={{ width: '100%', border: 0, borderRadius: 9, background: colors.brand, color: '#fff', padding: '9px 12px', fontSize: 11, fontWeight: 800, cursor: researchBusy ? 'wait' : 'pointer', opacity: researchBusy ? .6 : 1 }}>
                {researchBusy ? '处理中…' : item.latest_research_case_id ? '进入已有 Research Case' : '创建 Research Case'}
              </button>
            </div>
          </> : null}
  </aside>
}

export function OpportunityWorkspace({ apiBase, kind, onResearchTarget }: OpportunityWorkspaceProps) {
  const [items, setItems] = useState<OpportunitySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(() => readProductParam('opportunity'))
  const [selected, setSelected] = useState<OpportunitySummary | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailRevision, setDetailRevision] = useState(0)
  const [tab, setTab] = useState<InspectorTab>(() => normalizeTab(readProductParam('inspector')))
  const [researchBusy, setResearchBusy] = useState<string | null>(null)
  const [researchError, setResearchError] = useState<string | null>(null)
  const researchPending = useRef(false)

  const [todayView, setTodayView] = useState(() => readProductParam('today_view') ?? 'all')
  const [query, setQuery] = useState(() => readProductParam('library_q') ?? '')
  const [recommendation, setRecommendation] = useState(() => readProductParam('library_recommendation') ?? 'all')
  const [research, setResearch] = useState(() => readProductParam('library_research') ?? 'all')
  const [readiness, setReadiness] = useState(() => readProductParam('library_readiness') ?? 'all')
  const [sort, setSort] = useState<LibrarySort>(() => normalizeSort(readProductParam('library_sort')))
  const [layout, setLayout] = useState<LayoutMode>(() => normalizeLayout(readProductParam('library_layout')))

  const load = useCallback(async () => {
    const controller = new AbortController()
    setLoading(true)
    setListError(null)
    try {
      const response = await listEditorialOpportunities(apiBase, controller.signal)
      setItems(response.items)
      setDetailRevision(value => value + 1)
    } catch (reason: unknown) {
      if ((reason as { name?: string }).name === 'AbortError') return
      setItems([])
      setListError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setLoading(false)
    }
    return () => controller.abort()
  }, [apiBase])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      setDetailError(null)
      return
    }
    const controller = new AbortController()
    setDetailLoading(true)
    setDetailError(null)
    inspectEditorialOpportunity(apiBase, selectedId, controller.signal)
      .then(setSelected)
      .catch((reason: unknown) => {
        if ((reason as { name?: string }).name !== 'AbortError') setDetailError(reason instanceof Error ? reason.message : String(reason))
      })
      .finally(() => setDetailLoading(false))
    return () => controller.abort()
  }, [apiBase, selectedId, detailRevision])

  const visibleItems = useMemo(() => {
    if (kind === 'today') {
      if (todayView === 'all') return items
      if (todayView === 'research') return items.filter(item => item.research_status === 'running')
      return items.filter(item => item.recommendation === todayView)
    }
    const filtered = items.filter(item => {
      if (!matchesSearch(item, query)) return false
      if (recommendation !== 'all' && item.recommendation !== recommendation) return false
      if (research !== 'all' && item.research_status !== research) return false
      if (readiness !== 'all' && item.production_readiness !== readiness) return false
      return true
    })
    return sortItems(filtered, sort)
  }, [items, kind, todayView, query, recommendation, research, readiness, sort])

  const selectOpportunity = (item: OpportunitySummary): void => {
    setSelectedId(item.opportunity_id)
    setTab('overview')
    writeProductParams({ opportunity: item.opportunity_id, inspector: 'overview' })
  }

  const closeInspector = (): void => {
    setSelectedId(null)
    setSelected(null)
    writeProductParams({ opportunity: null, inspector: null })
  }

  const changeTab = (next: InspectorTab): void => {
    setTab(next)
    writeProductParams({ inspector: next })
  }

  const openResearch = async (item: OpportunitySummary): Promise<void> => {
    if (researchPending.current) return
    researchPending.current = true
    setResearchBusy(item.opportunity_id)
    setResearchError(null)
    try {
      let researchCaseId = item.latest_research_case_id
      if (!researchCaseId) {
        const created = await createEditorialResearchCase(apiBase, item.opportunity_id)
        researchCaseId = created.research_case_id
        setItems(current => current.map(candidate => candidate.opportunity_id === item.opportunity_id
          ? { ...candidate, latest_research_case_id: researchCaseId, research_status: 'running' }
          : candidate))
      }
      onResearchTarget({ researchCaseId, opportunityId: item.opportunity_id })
    } catch (reason: unknown) {
      setResearchError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      researchPending.current = false
      setResearchBusy(null)
    }
  }

  const inspectorItem = selected ?? items.find(item => item.opportunity_id === selectedId) ?? null

  return <div style={{ display: 'grid', gridTemplateColumns: selectedId ? 'minmax(0, 1fr) 360px' : 'minmax(0, 1fr) 300px', gap: 14, alignItems: 'start' }}>
    <section aria-label={kind === 'today' ? '编辑机会信息流' : '机会库'} style={{ minWidth: 0 }}>
      {kind === 'today' ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 13 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([['all', '全部'], ['today_main', '今日主推'], ['evergreen', '长期储备'], ['research', '研究中']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => {
            setTodayView(value)
            writeProductParams({ today_view: value === 'all' ? null : value })
          }} style={{ border: `1px solid ${todayView === value ? '#a5b4fc' : colors.border}`, borderRadius: 999, background: todayView === value ? colors.brandSoft : colors.panel, color: todayView === value ? colors.brand : colors.text, padding: '6px 10px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>{label}</button>)}
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.panel, padding: '6px 9px', color: colors.text, fontSize: 10, cursor: 'pointer' }}>刷新</button>
      </div> : <>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.7fr) repeat(4, minmax(120px, .7fr)) auto', gap: 7, marginBottom: 9 }}>
          <input aria-label="搜索机会" value={query} onChange={event => { setQuery(event.target.value); writeProductParams({ library_q: event.target.value || null }) }} placeholder="搜索标题、角度、主题、受众承诺……" style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 11 }}/>
          <select aria-label="推荐去向" value={recommendation} onChange={event => { setRecommendation(event.target.value); writeProductParams({ library_recommendation: event.target.value === 'all' ? null : event.target.value }) }}><option value="all">全部推荐</option><option value="today_main">今日主推</option><option value="evergreen">长期储备</option><option value="watch">观察</option></select>
          <select aria-label="研究状态" value={research} onChange={event => { setResearch(event.target.value); writeProductParams({ library_research: event.target.value === 'all' ? null : event.target.value }) }}><option value="all">全部研究状态</option><option value="not_started">待研究</option><option value="running">研究中</option><option value="completed">研究完成</option></select>
          <select aria-label="生产就绪度" value={readiness} onChange={event => { setReadiness(event.target.value); writeProductParams({ library_readiness: event.target.value === 'all' ? null : event.target.value }) }}><option value="all">全部就绪度</option><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select>
          <select aria-label="排序" value={sort} onChange={event => { const value = normalizeSort(event.target.value); setSort(value); writeProductParams({ library_sort: value === 'readiness' ? null : value }) }}><option value="readiness">按就绪度</option><option value="confidence">按置信度</option><option value="research">按研究状态</option><option value="headline">按标题</option></select>
          <div style={{ display: 'flex', gap: 4 }}><button type="button" aria-label="卡片视图" onClick={() => { setLayout('cards'); writeProductParams({ library_layout: null }) }} style={{ border: `1px solid ${colors.border}`, background: layout === 'cards' ? colors.brandSoft : colors.panel, borderRadius: 7, padding: '6px 8px' }}>▦</button><button type="button" aria-label="紧凑列表" onClick={() => { setLayout('compact'); writeProductParams({ library_layout: 'compact' }) }} style={{ border: `1px solid ${colors.border}`, background: layout === 'compact' ? colors.brandSoft : colors.panel, borderRadius: 7, padding: '6px 8px' }}>☷</button></div>
        </div>
        <div style={{ color: colors.muted, fontSize: 9, marginBottom: 12 }}>保存视图、批量 Watch / Archive、Series Fit、Integrity、Attention 等需要后续 canonical contract；当前不伪造。</div>
      </>}

      {listError ? <div role="alert" style={{ border: '1px solid #fecaca', background: '#fff7f7', color: colors.danger, borderRadius: 12, padding: 14, fontSize: 11 }}><strong>Editorial API 读取失败：</strong> {listError}<button type="button" onClick={() => void load()} style={{ marginLeft: 10 }}>重新读取</button></div>
        : loading ? <div role="status" style={{ color: colors.muted, fontSize: 12 }}>正在从 Editorial API 读取 Opportunity corpus…</div>
          : visibleItems.length === 0 ? <InspectorEmpty title={items.length ? '没有匹配的机会' : '当前还没有编辑机会'}>{items.length ? '调整筛选条件后再试。' : 'API 已返回空列表，可以稍后刷新。'}</InspectorEmpty>
            : layout === 'compact' && kind === 'library' ? <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', background: colors.panel }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) repeat(4,minmax(70px,.5fr))', gap: 8, padding: '8px 10px', background: '#f8fafc', color: colors.muted, fontSize: 9, fontWeight: 800 }}><span>机会</span><span>推荐</span><span>研究</span><span>就绪</span><span>置信度</span></div>
              {visibleItems.map(item => <button key={item.opportunity_id} type="button" onClick={() => selectOpportunity(item)} style={{ width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,2fr) repeat(4,minmax(70px,.5fr))', gap: 8, border: 0, borderTop: `1px solid ${colors.border}`, background: selectedId === item.opportunity_id ? colors.brandSoft : colors.panel, padding: '10px', textAlign: 'left', cursor: 'pointer', fontSize: 10 }}><span><strong style={{ display: 'block', color: colors.heading }}>{item.headline}</strong><small style={{ color: colors.muted }}>{item.theme}</small></span><span>{recommendationLabel(item.recommendation)}</span><span>{researchLabel(item.research_status)}</span><span>{item.production_readiness}</span><span>{item.confidence}</span></button>)}
            </div> : <div style={{ display: 'grid', gap: 10 }}>{visibleItems.map(item => <OpportunityCard key={item.opportunity_id} item={item} selected={selectedId === item.opportunity_id} onSelect={() => selectOpportunity(item)} onResearch={() => void openResearch(item)} researchBusy={researchBusy !== null}/>)}</div>}
    </section>

    <OpportunityInspector
      item={inspectorItem}
      selectedId={selectedId}
      tab={tab}
      loading={detailLoading}
      error={detailError}
      researchBusy={researchBusy !== null}
      researchError={researchError}
      onTab={changeTab}
      onClose={closeInspector}
      onRetry={() => setDetailRevision(value => value + 1)}
      onResearch={() => inspectorItem ? void openResearch(inspectorItem) : undefined}
    />
  </div>
}
