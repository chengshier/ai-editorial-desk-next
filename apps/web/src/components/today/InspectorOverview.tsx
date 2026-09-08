import { Clock3, Compass, Layers, Sparkles, Users } from 'lucide-react'
import type { OpportunitySummary } from '../../lib/editorial'
import { levelLabel, researchLabel } from './presentation'

export function InspectorOverview({ item }: { item: OpportunitySummary }) {
  return <>
    <div className="inspector-perspective">
      <div><span><Compass size={14}/>推荐角度</span><p>{item.angle}</p></div>
      <div><span><Layers size={14}/>主题</span><p>{item.theme}</p></div>
      <div><span><Users size={14}/>读者承诺</span><p>{item.audience_promise}</p></div>
      <div><span><Clock3 size={14}/>为什么现在</span><p>{item.why_now}</p></div>
    </div>
    <section className="inspector-section">
      <h3>评价概览</h3>
      <dl className="inspector-kpis">
        <div><dt>置信度</dt><dd>{levelLabel(item.confidence)}</dd></div>
        <div><dt>生产就绪</dt><dd>{levelLabel(item.production_readiness)}</dd></div>
        <div><dt>研究状态</dt><dd>{researchLabel(item.research_status)}</dd></div>
        <div><dt>开放未知项</dt><dd>{item.evidence_state.open_unknown_count}<small> 项待澄清</small></dd></div>
      </dl>
    </section>
    <section className="inspector-section">
      <h3><Sparkles size={14}/>编辑价值亮点</h3>
      {item.value_highlights.length ? <ul className="inspector-highlights">
        {item.value_highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
      </ul> : <p>当前尚未提供编辑价值亮点。</p>}
    </section>
  </>
}
