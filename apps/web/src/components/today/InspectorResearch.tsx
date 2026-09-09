import { BookOpen, CircleHelp } from 'lucide-react'
import type { OpportunitySummary } from '../../lib/editorial'
import { researchLabel } from './presentation'

export function InspectorResearch({ item }: { item: OpportunitySummary }) {
  return <>
    <section className="inspector-section inspector-section--first">
      <h3>Research Case</h3>
      <div className="research-state-card">
        <span className="research-state-card__icon"><BookOpen size={20}/></span>
        <div>
          <span className={`research-state-badge is-${item.research_status}`}>{researchLabel(item.research_status)}</span>
          <strong>{item.latest_research_case_id ?? '尚未建立 Research Case'}</strong>
          <p>{item.latest_research_case_id
            ? '已存在稳定业务 Research Case，可以直接进入继续研究。'
            : '当前机会还没有 Research Case，开始研究后会创建稳定业务 ID。'}</p>
        </div>
      </div>
    </section>

    <section className="inspector-section">
      <h3>开放未知项</h3>
      <div className="inspector-questions">
        <div className="inspector-question">
          <CircleHelp size={14}/>
          <span>{item.evidence_state.open_unknown_count} 项待澄清；Research Workspace 会围绕证据、反方信息与这些未知项继续推进，不在 Web Shell 中伪造研究结论。</span>
        </div>
      </div>
    </section>

    <section className="inspector-section">
      <h3>{item.latest_research_case_id ? '推荐行动' : '下一步'}</h3>
      <p>{item.latest_research_case_id
        ? '使用底部「进入研究」回到已有 Research Case，继续补齐证据与关键未知项。'
        : '使用底部「开始研究」建立 Research Case，再进入 Harness-powered Research Workspace。'}</p>
    </section>
  </>
}
