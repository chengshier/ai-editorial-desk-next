import { Bot, ExternalLink, ShieldCheck } from 'lucide-react'

export type HarnessIntent = 'research' | 'agent'

export interface HarnessLaunchDescriptor {
  launchId: string
  intent: HarnessIntent
  opportunityId?: string
  researchCaseId?: string
  harnessSessionId?: string
  surfaceUrl: string
  returnUrl: string
  transport?: string
}

interface HarnessSurfaceHostProps {
  intent: HarnessIntent
  opportunityId?: string
  researchCaseId?: string
  returnPath: string
  title?: string
}

export function HarnessSurfaceHost({ intent, opportunityId, researchCaseId, returnPath, title = 'Harness Surface' }: HarnessSurfaceHostProps) {
  return <section className="harness-boundary" aria-label="Harness integration boundary">
    <div className="harness-boundary__icon"><Bot size={20}/></div>
    <div className="harness-boundary__copy">
      <div className="eyebrow">Harness integration boundary</div>
      <h2>{title}</h2>
      <p>S1 只建立稳定宿主边界，不写死 iframe、Harness 私有 URL 或 Session 路由。实际 launch adapter 将在 S4 按 Hybrid Shell Contract 接入。</p>
      <dl className="harness-meta">
        <div><dt>intent</dt><dd>{intent}</dd></div>
        {opportunityId ? <div><dt>opportunity</dt><dd>{opportunityId}</dd></div> : null}
        {researchCaseId ? <div><dt>research case</dt><dd>{researchCaseId}</dd></div> : null}
        <div><dt>return path</dt><dd>{returnPath}</dd></div>
      </dl>
    </div>
    <div className="harness-boundary__guard"><ShieldCheck size={16}/><span>业务 ID 优先</span><ExternalLink size={14}/></div>
  </section>
}
