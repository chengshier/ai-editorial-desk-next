import { ArrowUpRight, BookOpen, CircleHelp, Leaf, Loader2, Sparkles } from 'lucide-react'
import type { OpportunitySummary } from '../../lib/editorial'
import { levelLabel, recommendationLabel, researchLabel } from './presentation'

export function OpportunityCard({ item, selected, onSelect, onResearch, researchBusy }: {
  item: OpportunitySummary
  selected: boolean
  onSelect: () => void
  onResearch: () => void
  researchBusy: boolean
}) {
  const RecommendationIcon = item.recommendation === 'evergreen' ? Leaf : Sparkles
  return <article className={`opportunity-card${selected ? ' is-selected' : ''}`} onClick={onSelect}>
    <div className="opportunity-card__topline">
      <span className={`status-chip status-chip--${item.recommendation === 'evergreen' ? 'evergreen' : 'primary'}`}>
        <RecommendationIcon size={12}/>{recommendationLabel(item.recommendation)}
      </span>
      <span className={`research-status is-${item.research_status}`}>
        <span className="status-dot"/>{researchLabel(item.research_status)}
      </span>
    </div>
    <h2><button type="button" className="opportunity-card__headline" onClick={(event) => {
      event.stopPropagation()
      onSelect()
    }} aria-pressed={selected}>{item.headline}</button></h2>
    <p className="opportunity-card__angle">{item.angle}</p>
    <p className="opportunity-card__promise"><span>读者承诺</span>{item.audience_promise}</p>
    {item.value_highlights.length > 0 ? <div className="opportunity-card__tags">
      {item.value_highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}
    </div> : null}
    <footer className="opportunity-card__footer">
      <div className="opportunity-card__metrics">
        <span><CircleHelp size={12}/>未知 <strong>{item.evidence_state.open_unknown_count}</strong></span>
        <span>置信度 <strong>{levelLabel(item.confidence)}</strong></span>
        <span>生产就绪 <strong>{levelLabel(item.production_readiness)}</strong></span>
      </div>
      <div className="opportunity-card__actions">
        <button type="button" className="subtle-button" onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}>查看详情<ArrowUpRight size={13}/></button>
        <button type="button" className="research-button" disabled={researchBusy} onClick={(event) => {
          event.stopPropagation()
          onResearch()
        }}>
          {researchBusy ? <Loader2 size={14} className="spin"/> : <BookOpen size={14}/>}
          {item.latest_research_case_id ? '进入研究' : '开始研究'}
        </button>
      </div>
    </footer>
  </article>
}
