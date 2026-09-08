import { BookOpen, CircleAlert, Clock3, FileSearch, History, Loader2, X } from 'lucide-react'
import { useRef } from 'react'
import type { OpportunitySummary } from '../../lib/editorial'
import { InspectorEmptyState } from './InspectorEmptyState'
import { InspectorOverview } from './InspectorOverview'
import { InspectorResearch } from './InspectorResearch'
import { inspectorTabs, recommendationLabel, type InspectorTab } from './presentation'

export function OpportunityInspector({ item, selectedId, tab, loading, error, onRetry, onTab, onClose, onResearch, researchBusy, researchError }: {
  item: OpportunitySummary | null
  selectedId: string | null
  tab: InspectorTab
  loading: boolean
  error: string | null
  onRetry: () => void
  onTab: (tab: InspectorTab) => void
  onClose: () => void
  onResearch: () => void
  researchBusy: boolean
  researchError: string | null
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  return <aside className={`today-inspector${selectedId ? ' is-open' : ''}`} aria-label="机会详情">
    <div className="today-inspector__header">
      <div className="today-inspector__status">
        {item ? <span className={`status-chip status-chip--${item.recommendation === 'evergreen' ? 'evergreen' : 'primary'}`}>
          {recommendationLabel(item.recommendation)}
        </span> : <span className="inspector-header-label"><FileSearch size={15}/>机会洞察</span>}
        {selectedId ? <span className="today-inspector__id" title={selectedId}>{selectedId}</span> : null}
      </div>
      {selectedId ? <button className="icon-button" type="button" aria-label="关闭机会详情" onClick={onClose}><X size={16}/></button> : null}
    </div>
    {!selectedId ? <InspectorEmptyState title="选择一个编辑机会">
      点击左侧卡片，查看推荐角度、读者承诺与研究状态，再决定下一步。
    </InspectorEmptyState> : loading ? <div className="inspector-loading" role="status"><Loader2 size={22} className="spin"/>正在读取机会详情…</div>
      : error ? <div className="inspector-failure" role="alert">
        <InspectorEmptyState icon={CircleAlert} title="机会详情读取失败">{error}</InspectorEmptyState>
        <button className="subtle-button" type="button" onClick={onRetry}>重新读取详情</button>
      </div> : item ? <>
        <div className="today-inspector__title"><h2>{item.headline}</h2><p>{item.subject.name} · {item.subject.type}</p></div>
        <div className="today-inspector__tabs" role="tablist" aria-label="Opportunity Inspector">
          {inspectorTabs.map(([value, label], index) => <button key={value} type="button" role="tab"
            id={`inspector-tab-${value}`} aria-controls="inspector-panel" aria-selected={tab === value}
            tabIndex={tab === value ? 0 : -1} ref={(element) => { tabRefs.current[index] = element }}
            className={tab === value ? 'is-active' : ''} onClick={() => onTab(value)}
            onKeyDown={(event) => {
              const next = event.key === 'ArrowRight' ? (index + 1) % inspectorTabs.length
                : event.key === 'ArrowLeft' ? (index + inspectorTabs.length - 1) % inspectorTabs.length
                  : event.key === 'Home' ? 0 : event.key === 'End' ? inspectorTabs.length - 1 : null
              if (next === null) return
              event.preventDefault()
              onTab(inspectorTabs[next][0])
              tabRefs.current[next]?.focus()
            }}>{label}</button>)}
        </div>
        <div key={`${item.opportunity_id}:${tab}`} className="today-inspector__body" id="inspector-panel" role="tabpanel" aria-labelledby={`inspector-tab-${tab}`} tabIndex={0}>
          {tab === 'overview' ? <InspectorOverview item={item}/> : null}
          {tab === 'research' ? <InspectorResearch item={item}/> : null}
          {tab === 'evidence' ? <>
            <InspectorEmptyState title="证据详情暂未开放">当前 Opportunity 尚未提供可供 Web Shell 读取的结构化证据。后续将在这里展示来源与核验结果。</InspectorEmptyState>
            <div className="inspector-unknown-note">当前有 <strong>{item.evidence_state.open_unknown_count}</strong> 个开放未知项。</div>
          </> : null}
          {tab === 'timeline' ? <InspectorEmptyState icon={Clock3} title="时间线暂未开放">当前尚未提供正式业务事件流。接入后可在这里追踪机会的演进过程。</InspectorEmptyState> : null}
          {tab === 'history' ? <InspectorEmptyState icon={History} title="决策历史暂未开放">当前尚未提供人工决策记录。接入后将保留每一次决定及其理由。</InspectorEmptyState> : null}
        </div>
        <div className="today-inspector__footer">
          {researchError ? <p className="research-error" role="alert">研究操作失败：{researchError}</p> : null}
          <span className="inspector-footer-hint">{item.latest_research_case_id ? '继续已有 Research Case' : '下一步 · 补齐证据与未知项'}</span>
          <button type="button" className="research-button research-button--wide" onClick={onResearch} disabled={researchBusy}>
            {researchBusy ? <Loader2 size={14} className="spin"/> : <BookOpen size={14}/>}
            {item.latest_research_case_id ? '进入研究' : '开始研究'}
          </button>
        </div>
      </> : null}
  </aside>
}
