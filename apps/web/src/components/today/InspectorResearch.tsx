import { BookOpen } from 'lucide-react'
import type { OpportunitySummary } from '../../lib/editorial'
import { researchLabel } from './presentation'

export function InspectorResearch({ item }: { item: OpportunitySummary }) {
  return <>
    <section className="inspector-section">
      <h3>Research Case</h3>
      <div className="research-state-card">
        <span className="research-state-card__icon"><BookOpen size={20}/></span>
        <div><strong>{researchLabel(item.research_status)}</strong>
          <p>{item.latest_research_case_id ?? '尚未建立 Research Case'}</p>
        </div>
      </div>
    </section>
    <section className="inspector-section">
      <h3>{item.latest_research_case_id ? '继续研究' : '准备开始研究'}</h3>
      <p>{item.latest_research_case_id
        ? '进入已有研究，继续围绕这个编辑机会补齐证据与关键未知项。'
        : '点击下方「开始研究」建立 Research Case，围绕当前角度补齐证据与关键未知项。'}</p>
    </section>
    <div className="inspector-unknown-note">当前有 <strong>{item.evidence_state.open_unknown_count}</strong> 个开放未知项。</div>
  </>
}
