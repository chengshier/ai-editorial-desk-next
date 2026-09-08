import { CircleAlert, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createEditorialResearchCase, inspectEditorialOpportunity, listEditorialOpportunities, type OpportunitySummary } from '../lib/editorial'
import { OpportunityCard } from '../components/today/OpportunityCard'
import { OpportunityInspector } from '../components/today/OpportunityInspector'
import { TodayToolbar } from '../components/today/TodayToolbar'
import { filterOpportunity, normalizeFilter, normalizeTab, type InspectorTab, type ViewFilter } from '../components/today/presentation'
import './today.css'

export function TodayRadarPage() {
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
  const activeFilter = normalizeFilter(searchParams.get('view'))

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
      setSelected(null)
      return
    }

    setDetailLoading(true)
    inspectEditorialOpportunity(selectedId)
      .then((item) => {
        if (!cancelled) {
          setSelected(item)
          setDetailError(null)
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setSelected(null)
          setDetailError(requestError instanceof Error ? requestError.message : 'Opportunity 详情读取失败')
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedId, detailRevision])

  const filteredItems = useMemo(
    () => items.filter((item) => filterOpportunity(item, activeFilter)),
    [items, activeFilter],
  )

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
      const returnPath = `/today?opportunity=${encodeURIComponent(item.opportunity_id)}&inspector=research`
      navigate(
        `/research/${encodeURIComponent(researchCaseId)}?opportunity=${encodeURIComponent(item.opportunity_id)}&return=${encodeURIComponent(returnPath)}`,
      )
    } catch (requestError) {
      setResearchError({ id: item.opportunity_id, message: requestError instanceof Error ? requestError.message : 'Research Case 创建失败' })
    } finally {
      researchPending.current = false
      setResearchBusy(null)
    }
  }

  return <div className="today-radar">
    <section className="today-feed" aria-label="编辑机会信息流">
      <TodayToolbar count={filteredItems.length} loading={loading} failed={Boolean(listError)}
        activeFilter={activeFilter} onFilter={changeFilter} onRefresh={() => void load()}/>
      <div className="today-feed__scroll" aria-busy={loading}>
        {listError ? <div className="radar-error" role="alert">
          <CircleAlert size={24}/>
          <h2>暂时无法读取编辑机会</h2>
          <p>Editorial API 连接失败，请检查服务后重试。</p>
          <span>{listError}</span>
          <button className="subtle-button" type="button" onClick={() => void load()}>重新读取</button>
        </div> : loading ? <div className="radar-skeleton" role="status">
          <span className="radar-loading-label"><Loader2 size={16} className="spin"/>正在从 Editorial API 读取机会…</span>
          {[0, 1, 2].map((index) => <div key={index} className="skeleton-card" aria-hidden="true">
            <i/><i/><i/><i/><div><i/><i/></div>
          </div>)}
        </div> : <>
          {researchError ? <div className="radar-action-error" role="alert"><CircleAlert size={16}/>
            <span>研究操作失败：{researchError.message}。请重新点击研究按钮重试。</span>
          </div> : null}
          {filteredItems.length === 0 ? <div className="radar-empty">
            <Search size={26}/><h2>{items.length ? '当前筛选下没有机会' : '当前还没有编辑机会'}</h2>
            <p>{items.length ? '试试其他视图，或查看全部机会。' : 'API 已返回空列表，可以稍后刷新。'}</p>
            {activeFilter !== 'all' ? <button className="subtle-button" type="button" onClick={() => changeFilter('all')}>查看全部机会</button> : null}
          </div> : filteredItems.map((item) => <OpportunityCard key={item.opportunity_id} item={item}
            selected={selectedId === item.opportunity_id} onSelect={() => selectOpportunity(item)}
            onResearch={() => void openResearch(item)} researchBusy={researchBusy !== null}/>)}
          {filteredItems.length > 0 ? <div className="today-feed__end">已展示当前视图的 {filteredItems.length} 条机会</div> : null}
        </>}
      </div>
    </section>
    <OpportunityInspector item={selected} selectedId={selectedId} tab={activeTab}
      loading={detailLoading} error={detailError} onRetry={() => setDetailRevision((revision) => revision + 1)}
      onTab={changeInspectorTab} onClose={closeInspector}
      onResearch={() => selected ? void openResearch(selected) : undefined}
      researchBusy={researchBusy !== null}
      researchError={researchError?.id === selectedId ? researchError.message : null}/>
  </div>
}
