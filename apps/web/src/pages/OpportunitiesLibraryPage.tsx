import { CircleAlert, LayoutGrid, List, Loader2, RefreshCw, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { OpportunityCard } from '../components/today/OpportunityCard'
import { OpportunityInspector } from '../components/today/OpportunityInspector'
import { normalizeTab, type InspectorTab } from '../components/today/presentation'
import {
  createEditorialResearchCase,
  inspectEditorialOpportunity,
  listEditorialOpportunities,
  type OpportunitySummary,
} from '../lib/editorial'
import './today.css'
import './opportunities.css'

type LayoutMode = 'cards' | 'compact'
type LibrarySort = 'readiness' | 'confidence' | 'research' | 'headline'

const levelRank: Record<string, number> = { high: 3, medium: 2, low: 1 }
const researchRank: Record<string, number> = { running: 3, not_started: 2, completed: 1 }

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

export function OpportunitiesLibraryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<OpportunitySummary[]>([])
  const [selected, setSelected] = useState<OpportunitySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [researchError, setResearchError] = useState<{ id: string; message: string } | null>(null)
  const [detailRevision, setDetailRevision] = useState(0)
  const researchPending = useRef(false)
  const [researchBusy, setResearchBusy] = useState<string | null>(null)

  const selectedId = searchParams.get('opportunity')
  const activeTab = normalizeTab(searchParams.get('inspector'))
  const query = searchParams.get('q')?.trim() ?? ''
  const recommendation = searchParams.get('recommendation') ?? 'all'
  const research = searchParams.get('research') ?? 'all'
  const readiness = searchParams.get('readiness') ?? 'all'
  const sort = normalizeSort(searchParams.get('sort'))
  const layout = normalizeLayout(searchParams.get('layout'))

  const updateParam = (key: string, value: string, defaultValue = 'all') => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === defaultValue) next.delete(key)
    else next.set(key, value)
    next.delete('opportunity')
    next.delete('inspector')
    setSearchParams(next)
    setSelected(null)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setListError(null)
    try {
      const response = await listEditorialOpportunities()
      setItems(response.items)
      setDetailRevision((revision) => revision + 1)
    } catch (requestError) {
      setItems([])
      setListError(requestError instanceof Error ? requestError.message : 'Editorial API 暂时不可用')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    let cancelled = false
    setSelected(null)
    setDetailError(null)
    if (!selectedId) {
      setDetailLoading(false)
      return
    }

    setDetailLoading(true)
    inspectEditorialOpportunity(selectedId)
      .then((item) => {
        if (!cancelled) setSelected(item)
      })
      .catch((requestError) => {
        if (!cancelled) setDetailError(requestError instanceof Error ? requestError.message : 'Opportunity 详情读取失败')
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedId, detailRevision])

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (!matchesSearch(item, query)) return false
      if (recommendation !== 'all' && item.recommendation !== recommendation) return false
      if (research !== 'all' && item.research_status !== research) return false
      if (readiness !== 'all' && item.production_readiness !== readiness) return false
      return true
    })
    return sortItems(filtered, sort)
  }, [items, query, recommendation, research, readiness, sort])

  const selectOpportunity = (item: OpportunitySummary) => {
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

  const setLayout = (mode: LayoutMode) => {
    const next = new URLSearchParams(searchParams)
    if (mode === 'cards') next.delete('layout')
    else next.set('layout', mode)
    setSearchParams(next)
  }

  const openResearch = async (item: OpportunitySummary) => {
    if (researchPending.current) return
    researchPending.current = true
    setResearchBusy(item.opportunity_id)
    setResearchError(null)
    try {
      let researchCaseId = item.latest_research_case_id
      if (!researchCaseId) {
        const created = await createEditorialResearchCase(item.opportunity_id)
        researchCaseId = created.research_case_id
      }
      const returnParams = new URLSearchParams(searchParams)
      returnParams.set('opportunity', item.opportunity_id)
      returnParams.set('inspector', 'research')
      const returnPath = `/opportunities?${returnParams.toString()}`
      navigate(
        `/research/${encodeURIComponent(researchCaseId)}?opportunity=${encodeURIComponent(item.opportunity_id)}&return=${encodeURIComponent(returnPath)}`,
      )
    } catch (requestError) {
      setResearchError({
        id: item.opportunity_id,
        message: requestError instanceof Error ? requestError.message : 'Research Case 创建失败',
      })
    } finally {
      researchPending.current = false
      setResearchBusy(null)
    }
  }

  return <div className="opportunities-library">
    <section className="opportunities-library__main" aria-label="机会库">
      <header className="opportunities-library__header">
        <div>
          <div className="eyebrow">P02 · Opportunities Library</div>
          <div className="opportunities-library__title-row">
            <h1>机会库</h1>
            <span>{loading ? '读取中' : listError ? '读取失败' : `${visibleItems.length} / ${items.length}`}</span>
          </div>
          <p>长期浏览、搜索和筛选全部可用 Editorial Opportunity；当前仍使用集成 read model，不代表生产全量 corpus。</p>
        </div>
        <button className="refresh-button" type="button" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''}/>刷新
        </button>
      </header>

      <div className="opportunities-library__controls">
        <label className="library-search">
          <Search size={15}/>
          <input
            value={query}
            onChange={(event) => updateParam('q', event.target.value, '')}
            placeholder="搜索标题、角度、主题、受众承诺、标签……"
            aria-label="搜索机会"
          />
        </label>
        <select value={recommendation} onChange={(event) => updateParam('recommendation', event.target.value)} aria-label="推荐去向">
          <option value="all">全部推荐</option>
          <option value="today_main">今日主推</option>
          <option value="evergreen">长期储备</option>
          <option value="watch">观察</option>
        </select>
        <select value={research} onChange={(event) => updateParam('research', event.target.value)} aria-label="研究状态">
          <option value="all">全部研究状态</option>
          <option value="not_started">待研究</option>
          <option value="running">研究中</option>
          <option value="completed">研究完成</option>
        </select>
        <select value={readiness} onChange={(event) => updateParam('readiness', event.target.value)} aria-label="生产就绪度">
          <option value="all">全部就绪度</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
        <select value={sort} onChange={(event) => updateParam('sort', event.target.value, 'readiness')} aria-label="排序">
          <option value="readiness">按就绪度</option>
          <option value="confidence">按置信度</option>
          <option value="research">按研究状态</option>
          <option value="headline">按标题</option>
        </select>
        <div className="library-layout-toggle" aria-label="列表视图">
          <button type="button" className={layout === 'cards' ? 'is-active' : ''} aria-label="卡片视图" onClick={() => setLayout('cards')}><LayoutGrid size={15}/></button>
          <button type="button" className={layout === 'compact' ? 'is-active' : ''} aria-label="紧凑列表" onClick={() => setLayout('compact')}><List size={15}/></button>
        </div>
      </div>

      <div className="opportunities-library__notice">
        保存视图、批量 Watch / Archive、Series Fit、Integrity、Attention、时间范围与来源类型筛选需要后续 canonical contract；本批不伪造这些行为。
      </div>

      <div className="opportunities-library__scroll" aria-busy={loading}>
        {listError ? <div className="radar-error" role="alert">
          <CircleAlert size={24}/><h2>暂时无法读取机会库</h2><p>Editorial API 连接失败，请检查服务后重试。</p><span>{listError}</span>
          <button className="subtle-button" type="button" onClick={() => void load()}>重新读取</button>
        </div> : loading ? <div className="library-loading" role="status"><Loader2 size={18} className="spin"/>正在读取 Opportunity corpus…</div> : visibleItems.length === 0 ? <div className="radar-empty">
          <Search size={26}/><h2>{items.length ? '没有匹配的机会' : '当前机会库为空'}</h2>
          <p>{items.length ? '调整搜索或筛选条件后再试。' : 'API 已返回空列表，可以稍后刷新。'}</p>
        </div> : layout === 'cards' ? visibleItems.map((item) => <OpportunityCard
          key={item.opportunity_id}
          item={item}
          selected={selectedId === item.opportunity_id}
          onSelect={() => selectOpportunity(item)}
          onResearch={() => void openResearch(item)}
          researchBusy={researchBusy !== null}
        />) : <div className="library-compact-list">
          <div className="library-compact-list__head"><span>机会</span><span>推荐</span><span>研究</span><span>就绪度</span><span>置信度</span></div>
          {visibleItems.map((item) => <button
            key={item.opportunity_id}
            type="button"
            className={`library-compact-row${selectedId === item.opportunity_id ? ' is-selected' : ''}`}
            onClick={() => selectOpportunity(item)}
          >
            <span className="library-compact-row__subject"><strong>{item.headline}</strong><small>{item.theme} · {item.subject.name}</small></span>
            <span>{item.recommendation}</span>
            <span>{item.research_status}</span>
            <span>{item.production_readiness}</span>
            <span>{item.confidence}</span>
          </button>)}
        </div>}
        {researchError ? <div className="radar-action-error" role="alert"><CircleAlert size={16}/><span>研究操作失败：{researchError.message}</span></div> : null}
      </div>
    </section>

    <OpportunityInspector
      item={selected}
      selectedId={selectedId}
      tab={activeTab}
      loading={detailLoading}
      error={detailError}
      onRetry={() => setDetailRevision((revision) => revision + 1)}
      onTab={changeInspectorTab}
      onClose={closeInspector}
      onResearch={() => selected ? void openResearch(selected) : undefined}
      researchBusy={researchBusy !== null}
      researchError={researchError?.id === selectedId ? researchError.message : null}
    />
  </div>
}
