import { CircleHelp, Clock3, Compass, Layers, Sparkles, Users } from 'lucide-react'
import type { OpportunitySummary } from '../../lib/editorial'
import { levelLabel, researchLabel } from './presentation'

function levelTone(value: string): string {
  if (value === 'high' || value === 'completed') return 'is-positive'
  if (value === 'medium' || value === 'running') return 'is-attention'
  return 'is-neutral'
}

export function InspectorOverview({ item }: { item: OpportunitySummary }) {
  return <>
    <section className="inspector-decision">
      <h3>编辑判断</h3>
      <div className="inspector-perspective">
        <div><span><Compass size={14}/>推荐角度</span><p>{item.angle}</p></div>
        <div><span><Layers size={14}/>主题</span><p>{item.theme}</p></div>
        <div><span><Users size={14}/>读者承诺</span><p>{item.audience_promise}</p></div>
        <div><span><Clock3 size={14}/>为什么现在</span><p>{item.why_now}</p></div>
      </div>
    </section>

    <section className="inspector-section">
      <h3>评价概览</h3>
      <dl className="inspector-kpis">
        <div><dt>置信度</dt><dd className={levelTone(item.confidence)}>{levelLabel(item.confidence)}</dd></div>
        <div><dt>生产就绪</dt><dd className={levelTone(item.production_readiness)}>{levelLabel(item.production_readiness)}</dd></div>
        <div><dt>研究状态</dt><dd className={levelTone(item.research_status)}>{researchLabel(item.research_status)}</dd></div>
        <div><dt>开放未知项</dt><dd className={item.evidence_state.open_unknown_count > 0 ? 'is-attention' : 'is-positive'}>
          {item.evidence_state.open_unknown_count}<small> 项待澄清</small>
        </dd></div>
      </dl>
    </section>

    <section className="inspector-section">
      <h3><Sparkles size={14}/>核心亮点</h3>
      {item.value_highlights.length ? <ul className="inspector-highlights">
        {item.value_highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
      </ul> : <p>当前尚未提供编辑价值亮点。</p>}
    </section>

    <section className="inspector-section">
      <h3><CircleHelp size={14}/>关键问题</h3>
      <div className="inspector-question-card">
        <CircleHelp size={16}/>
        <div>
          <strong>{item.evidence_state.open_unknown_count > 0
            ? `仍有 ${item.evidence_state.open_unknown_count} 个开放未知项`
            : '当前没有开放未知项'}</strong>
          <p>{item.evidence_state.open_unknown_count > 0
            ? '具体问题尚未通过 Web Shell 的 canonical contract 暴露；进入研究工作区后继续补齐和核验。'
            : '当前 Opportunity 状态没有开放未知项；后续研究仍应以正式 Evidence contract 为准。'}</p>
        </div>
      </div>
    </section>
  </>
}
