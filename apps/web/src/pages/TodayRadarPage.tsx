import {
  ArrowRight, BookOpen, CheckCircle2, CircleAlert, Clock3, FileSearch,
  FlaskConical, Loader2, MoreHorizontal, RefreshCw, Search, Sparkles, X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  createEditorialResearchCase,
  inspectEditorialOpportunity,
  listEditorialOpportunities,
  type OpportunitySummary,
} from '../lib/editorial'
import './today.css'

type InspectorTab = 'overview' | 'evidence' | 'research' | 'timeline' | 'history'
type ViewFilter = 'all' | 'today-main' | 'high-confidence' | 'needs-research' | 'evergreen'

const inspectorTabs: Array<[InspectorTab, string]> = [
  ['overview', '概览'],
  ['evidence', '证据'],
  ['research', '研究'],
  ['timeline', '时间线'],
  ['history', '历史'],
]

const filters: Array<[ViewFilter, string]> = [
  ['all', '全部'],
  ['today-main', '今日主推'],
  ['high-confidence', '高置信'],
  ['needs-research', '待研究'],
  ['evergreen', '长期储备'],
]

function normalizeTab(value: string | null): InspectorTab {
  return inspectorTabs.some(([tab]) => tab === value) ? value as InspectorTab : 'overview'
}

function normalizeFilter(value: string | null): ViewFilter {
  return filters.some(([filter]) => filter === value) ? value as ViewFilter : 'all'
}

function filterOpportunity(item: OpportunitySummary, view: ViewFilter): boolean {
  if (view === 'today-main') return item.recommendation === 'today_main'
  if (view === 'high-confidence') return item.confidence === 'high'
  if (view === 'needs-research') return item.research_status === 'not_started'
  if (view === 'evergreen') return item.recommendation === 'evergreen'
  return true
}

function recommendationLabel(value: string): string {
  if (value === 'today_main') return '今日主推'
  if (value === 'evergreen') return '长期储备'
  if (value === 'watch') return '观察'
  return value
}

function researchLabel(value: string): string {
  if (value === 'completed') return '研究完成'
  if (value === 'running') return '研究中'
  return '待研究'
}

function readinessLabel(value: string): string {
  if (value === 'high') return '就绪度高'
  if (value === 'medium') return '就绪度中'
  if (value === 'low') return '就绪度低'
  return value
}

function OpportunityCard({
  item,
  selected,
  onSelect,
  onResearch,
  researchBusy,
}: {
  item: OpportunitySummary
  selected: boolean
  onSelect: () => void
  onResearch: () => void
  researchBusy: boolean
}) {
  return <article
    className={`opportunity-card${selected ? ' is-selected' : ''}`}
    onClick={onSelect}
  >
    <div className="opportunity-card__topline">
      <div className="opportunity-card__badges">
        <span className={`status-chip status-chip--${item.recommendation === 'evergreen' ? 'evergreen' : 'primary'}`}>
          {recommendationLabel(item.recommendation)}
        </span>
        <span className={`status-chip status-chip--research-${item.research_status}`}>
          {researchLabel(item.research_status)}
        </span>
      </div>
      <span className="opportunity-card__id">{item.opportunity_id}</span>
    </div>

    <h2>{item.headline}</h2>
    <p className="opportunity-card__angle">{item.angle}</p>

    <div className="opportunity-card__promise">
      <span>读者承诺</span>
      <strong>{item.audience_promise}</strong>
    </div>

    <div className="opportunity-card__tags">
      {item.value_highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}
    </div>

    <footer className="opportunity-card__footer">
      <div className="opportunity-card__metrics">
        <span><strong>{item.evidence_state.open_unknown_count}</strong> 未知项</span>
        <span>{readinessLabel(item.production_readiness)}</span>
        <span>置信度 {item.confidence}</span>
      </div>
      <div className="opportunity-card__actions">
        <button
          type="button"
          className="subtle-button"
          onClick={(event) => {
            event.stopPropagation()
            onSelect()
          }}
        >
          查看详情
        </button>
        <button
          type="button"
          className="research-button"
          onClick={(event) => {
            event.stopPropagation()
            onResearch()
          }}
          disabled={researchBusy}
        >
          {researchBusy ? <Loader2 size={14} className="spin"/> : <BookOpen size={14}/>}
          {item.latest_research_case_id ? '进入研究' : '开始研究'}
        </button>
      </div>
    </footer>
  </article>
}

function EmptyInspector() {
  return <div className="today-inspector__empty">
    <div className="today-inspector__empty-icon"><FileSearch size={24}/></div>
    <strong>选择一个编辑机会</strong>
    <p>在左侧列表选择 Opportunity 后，这里展示 Angle、读者承诺、研究状态与后续动作。</p>
  </div>
}

function InspectorSection({ label, children }: { label: string; children: ReactNode }) {
  return <section className="inspector-section">
    <h4>{label}</h4>
    {children}
  </section>
}

function OpportunityInspector({
  item,
  tab,
  onTab,
  onClose,
  onResearch,
  researchBusy,
}: {
  item: OpportunitySummary | null
  tab: InspectorTab
  onTab: (tab: InspectorTab) => void
  onClose: () => void
  onResearch: () => void
  researchBusy: boolean
}) {
  if (!item) {
    return <aside className="today-inspector"><EmptyInspector/></aside>
  }

  return <aside className="today-inspector is-open">
    <div className="today-inspector__header">
      <div className="today-inspector__status">
        <span className={`status-chip status-chip--${item.recommendation === 'evergreen' ? 'evergreen' : 'primary'}`}>
          {recommendationLabel(item.recommendation)}
        </span>
        <span className="today-inspector__id">{item.opportunity_id}</span>
      </div>
      <button className="icon-button" type="button" aria-label="关闭机会详情" onClick={onClose}><X size={16}/></button>
    </div>

    <div className="today-inspector__title">
      <h2>{item.headline}</h2>
      <p>{item.subject.name} · {item.subject.type}</p>
    </div>

    <nav className="today-inspector__tabs" aria-label="Opportunity Inspector">
      {inspectorTabs.map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={tab === value ? 'is-active' : ''}
          onClick={() => onTab(value)}
        >
          {label}
        </button>
      ))}
    </nav>

    <div className="today-inspector__body">
      {tab === 'overview' ? <>
        <InspectorSection label="Angle">
          <p className="inspector-highlight">{item.angle}</p>
        </InspectorSection>
        <InspectorSection label="主题"><p>{item.theme}</p></InspectorSection>
        <InspectorSection label="读者承诺"><p>{item.audience_promise}</p></InspectorSection>
        <InspectorSection label="为什么是现在"><p>{item.why_now}</p></InspectorSection>
        <InspectorSection label="编辑价值信号">
          <div className="inspector-tags">
            {item.value_highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}
          </div>
        </InspectorSection>
        <div className="inspector-kpis">
          <div><span>研究状态</span><strong>{researchLabel(item.research_status)}</strong></div>
          <div><span>未知项</span><strong>{item.evidence_state.open_unknown_count}</strong></div>
          <div><span>生产就绪</span><strong>{item.production_readiness}</strong></div>
        </div>
      </> : null}

      {tab === 'evidence' ? <>
        <div className="inspector-callout">
          <FileSearch size={18}/>
          <div>
            <strong>Evidence 不在 Shell 中伪造</strong>
            <p>当前 Opportunity read model 只提供 Unknown 数量。结构化 Evidence 仍由 Research Result / Editorial API 提供。</p>
          </div>
        </div>
        <InspectorSection label="当前缺口">
          <p>仍有 <strong>{item.evidence_state.open_unknown_count}</strong> 个开放 Unknown。</p>
        </InspectorSection>
        {item.research_status === 'completed' ? (
          <div className="inspector-success"><CheckCircle2 size={17}/>该机会已有完成的研究，可进入 Research Workspace 查看结果。</div>
        ) : null}
      </> : null}

      {tab === 'research' ? <>
        <InspectorSection label="Research Case">
          <div className="research-state-card">
            <span className={`research-state-card__dot is-${item.research_status}`}/>
            <div>
              <strong>{researchLabel(item.research_status)}</strong>
              <p>{item.latest_research_case_id ?? '尚未建立 Research Case'}</p>
            </div>
          </div>
        </InspectorSection>
        <InspectorSection label="研究目标">
          <p>围绕当前 Angle 补齐主要证据、反方证据与关键未知项，并保留条件化结论。</p>
        </InspectorSection>
        <button className="inspector-primary-action" type="button" onClick={onResearch} disabled={researchBusy}>
          {researchBusy ? <Loader2 size={15} className="spin"/> : <BookOpen size={15}/>}
          {item.latest_research_case_id ? '进入研究工作区' : '为这条机会启动研究'}
          {!researchBusy ? <ArrowRight size={14}/> : null}
        </button>
      </> : null}

      {tab === 'timeline' ? (
        <div className="inspector-placeholder-state">
          <Clock3 size={22}/>
          <strong>Timeline 还没有正式业务事件流</strong>
          <p>S2 不根据前端点击伪造 Timeline；后续由服务端 canonical event/history 提供。</p>
        </div>
      ) : null}

      {tab === 'history' ? (
        <div className="inspector-placeholder-state">
          <Sparkles size={22}/>
          <strong>Decision History 后续接入</strong>
          <p>Human Decision 必须 append-only；在对应服务端契约完成前，这里不制造假的采纳/放弃历史。</p>
        </div>
      ) : null}
    </div>

    <div className="today-inspector__footer">
      <button type="button" className="subtle-button" disabled title="S6 接入 Programming / Human Decision 后开放">
        <MoreHorizontal size={14}/>更多动作
      </button>
      <button type="button" className="research-button research-button--wide" onClick={onResearch} disabled={researchBusy}>
        {researchBusy ? <Loader2 size={14} className="spin"/> : <BookOpen size={14}/>}
        {item.latest_research_case_id ? '进入研究' : '开始研究'}
      </button>
    </div>
  </aside>
}

export function TodayRadarPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<OpportunitySummary[]>([])
  const [selected, setSelected] = useState<OpportunitySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [researchBusy, setResearchBusy] = useState<string | null>(null)

  const selectedId = searchParams.get('opportunity')
  const activeTab = normalizeTab(searchParams.get('inspector'))
  const activeFilter = normalizeFilter(searchParams.get('view'))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await listEditorialOpportunities()
      setItems(response.items)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Editorial API 暂时不可用')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    let cancelled = false
    if (!selectedId) {
      setSelected(null)
      return
    }

    setDetailLoading(true)
    inspectEditorialOpportunity(selectedId)
      .then((item) => {
        if (!cancelled) {
          setSelected(item)
          setError(null)
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setSelected(null)
          setError(requestError instanceof Error ? requestError.message : 'Opportunity 详情读取失败')
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedId])

  const filteredItems = useMemo(
    () => items.filter((item) => filterOpportunity(item, activeFilter)),
    [items, activeFilter],
  )

  const selectOpportunity = (item: OpportunitySummary) => {
    setSelected(item)
    const next = new URLSearchParams(searchParams)
    next.set('opportunity', item.opportunity_id)
    next.set('inspector', 'overview')
    setSearchParams(next)
  }

  const closeInspector = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('opportunity')
    next.delete('inspector')
    setSearchParams(next)
    setSelected(null)
  }

  const changeInspectorTab = (tab: InspectorTab) => {
    if (!selectedId) return
    const next = new URLSearchParams(searchParams)
    next.set('opportunity', selectedId)
    next.set('inspector', tab)
    setSearchParams(next)
  }

  const changeFilter = (view: ViewFilter) => {
    const next = new URLSearchParams(searchParams)
    if (view === 'all') next.delete('view')
    else next.set('view', view)
    next.delete('opportunity')
    next.delete('inspector')
    setSearchParams(next)
    setSelected(null)
  }

  const openResearch = async (item: OpportunitySummary) => {
    setResearchBusy(item.opportunity_id)
    setError(null)
    try {
      let researchCaseId = item.latest_research_case_id
      if (!researchCaseId) {
        const created = await createEditorialResearchCase(item.opportunity_id)
        researchCaseId = created.research_case_id
      }
      const returnPath = `/today?opportunity=${encodeURIComponent(item.opportunity_id)}&inspector=research`
      navigate(
        `/research/${encodeURIComponent(researchCaseId)}?opportunity=${encodeURIComponent(item.opportunity_id)}&return=${encodeURIComponent(returnPath)}`,
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Research Case 创建失败')
    } finally {
      setResearchBusy(null)
    }
  }

  return <div className="today-radar">
    <section className="today-feed">
      <header className="today-feed__header">
        <div>
          <div className="eyebrow">P01 · Today / Editorial Radar</div>
          <div className="today-feed__title-row">
            <h1>今日 / 编辑雷达</h1>
            <span className="today-feed__count">{loading ? '读取中' : `${filteredItems.length} 条`}</span>
          </div>
          <p>不是“什么最热”，而是“今天什么值得讲、为什么值得讲、还缺什么”。</p>
        </div>
        <button className="refresh-button" type="button" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''}/>刷新
        </button>
      </header>

      <div className="today-feed__toolbar">
        <div className="radar-filter-group" aria-label="Today filters">
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={activeFilter === value ? 'is-active' : ''}
              onClick={() => changeFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="radar-source-badge" title="S2 暂时复用现有 Editorial API Harness Spike read model">
          <FlaskConical size={13}/>Integration fixture
        </div>
      </div>

      {error ? (
        <div className="radar-error">
          <CircleAlert size={17}/>
          <div><strong>当前数据读取失败</strong><span>{error}</span></div>
          <button type="button" onClick={() => void load()}>重试</button>
        </div>
      ) : null}

      <div className="today-feed__scroll">
        {loading ? (
          <div className="radar-loading"><Loader2 size={22} className="spin"/><span>正在从 Editorial API 读取 Opportunity…</span></div>
        ) : null}

        {!loading && filteredItems.length === 0 ? (
          <div className="radar-loading"><Search size={22}/><span>这个视图当前没有 Opportunity。</span></div>
        ) : null}

        {!loading ? filteredItems.map((item) => (
          <OpportunityCard
            key={item.opportunity_id}
            item={item}
            selected={selectedId === item.opportunity_id}
            onSelect={() => selectOpportunity(item)}
            onResearch={() => void openResearch(item)}
            researchBusy={researchBusy === item.opportunity_id}
          />
        )) : null}

        {!loading && filteredItems.length > 0 ? (
          <div className="today-feed__end">当前 S2 只展示 Editorial API 已返回的 {filteredItems.length} 条机会，不在浏览器生成补位内容。</div>
        ) : null}
      </div>
    </section>

    <OpportunityInspector
      item={selected}
      tab={activeTab}
      onTab={changeInspectorTab}
      onClose={closeInspector}
      onResearch={() => selected ? void openResearch(selected) : undefined}
      researchBusy={Boolean(selected && researchBusy === selected.opportunity_id)}
    />

    {detailLoading ? <div className="detail-loading-indicator"><Loader2 size={13} className="spin"/>刷新详情</div> : null}
  </div>
}
