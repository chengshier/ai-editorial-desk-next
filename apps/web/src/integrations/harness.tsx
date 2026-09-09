import { AlertTriangle, Bot, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

export type HarnessIntent = 'research' | 'agent'

interface HarnessLaunchDescriptorWire {
  launch_id: string
  intent: HarnessIntent
  opportunity_id?: string | null
  research_case_id?: string | null
  harness_session_id?: string | null
  surface_url: string
  return_url: string
  transport: string
  bootstrap_required?: boolean
}

export interface HarnessLaunchDescriptor {
  launchId: string
  intent: HarnessIntent
  opportunityId?: string
  researchCaseId?: string
  harnessSessionId?: string
  surfaceUrl: string
  returnUrl: string
  transport: string
  bootstrapRequired: boolean
}

interface HarnessSurfaceHostProps {
  intent: HarnessIntent
  opportunityId?: string
  researchCaseId?: string
  returnPath: string
  title?: string
}

function decodeLaunch(value: HarnessLaunchDescriptorWire): HarnessLaunchDescriptor {
  return {
    launchId: value.launch_id,
    intent: value.intent,
    ...(value.opportunity_id ? { opportunityId: value.opportunity_id } : {}),
    ...(value.research_case_id ? { researchCaseId: value.research_case_id } : {}),
    ...(value.harness_session_id ? { harnessSessionId: value.harness_session_id } : {}),
    surfaceUrl: value.surface_url,
    returnUrl: value.return_url,
    transport: value.transport,
    bootstrapRequired: value.bootstrap_required ?? false,
  }
}

async function createLaunch(
  intent: HarnessIntent,
  opportunityId: string | undefined,
  researchCaseId: string | undefined,
  returnPath: string,
  signal: AbortSignal,
): Promise<HarnessLaunchDescriptor> {
  const payload = await apiFetch<HarnessLaunchDescriptorWire>('/v1/integrations/harness/launches', {
    method: 'POST',
    signal,
    body: JSON.stringify({
      intent,
      ...(opportunityId ? { opportunity_id: opportunityId } : {}),
      ...(researchCaseId ? { research_case_id: researchCaseId } : {}),
      return_path: returnPath,
    }),
  })
  return decodeLaunch(payload)
}

const surfaceCardStyle = {
  minHeight: 560,
  height: 'calc(100vh - var(--header) - 160px)',
  maxHeight: 900,
  display: 'flex',
  flexDirection: 'column' as const,
  border: '1px solid var(--border)',
  borderRadius: 12,
  overflow: 'hidden',
  background: '#fff',
  boxShadow: 'var(--shadow-xs)',
}

const toolbarStyle = {
  minHeight: 46,
  padding: '0 12px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flex: '0 0 auto',
}

export function HarnessSurfaceHost({
  intent,
  opportunityId,
  researchCaseId,
  returnPath,
  title = 'Harness Surface',
}: HarnessSurfaceHostProps) {
  const [retryKey, setRetryKey] = useState(0)
  const [launch, setLaunch] = useState<HarnessLaunchDescriptor | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [frameLoaded, setFrameLoaded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLaunch(null)
    setError(null)
    setFrameLoaded(false)

    void createLaunch(intent, opportunityId, researchCaseId, returnPath, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setLaunch(value)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : String(reason))
      })

    return () => { controller.abort() }
  }, [intent, opportunityId, researchCaseId, returnPath, retryKey])

  if (error !== null) {
    return <section style={surfaceCardStyle} aria-label="Harness integration error">
      <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 28 }}>
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          <AlertTriangle size={28} style={{ color: 'var(--amber-600)' }}/>
          <h2 style={{ margin: '12px 0 6px', fontSize: 17 }}>Research Agent 暂时不可用</h2>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7 }}>
            Research Case 仍然由 Editorial API 保留；当前失败只影响 Harness runtime surface，不会把业务对象当成丢失。
          </p>
          <code style={{ display: 'block', marginTop: 12, color: '#94a3b8', fontSize: 11 }}>{error}</code>
          <button className="primary-button" style={{ marginTop: 16 }} onClick={() => setRetryKey(key => key + 1)}>
            <RefreshCw size={14}/>重新连接
          </button>
        </div>
      </div>
    </section>
  }

  if (launch === null) {
    return <section style={surfaceCardStyle} aria-label="Harness integration loading">
      <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 28 }}>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 10, color: 'var(--muted)' }}>
          <LoaderCircle size={24}/>
          <strong style={{ color: 'var(--heading)' }}>正在恢复 Research Workspace</strong>
          <span>通过稳定 launch contract 解析 Harness Session 与运行时入口…</span>
        </div>
      </div>
    </section>
  }

  if (launch.transport !== 'embedded') {
    return <section style={surfaceCardStyle} aria-label="Harness integration external transport">
      <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 28 }}>
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          <Bot size={28} style={{ color: 'var(--brand-600)' }}/>
          <h2 style={{ margin: '12px 0 6px', fontSize: 17 }}>{title}</h2>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7 }}>
            当前兼容配置使用 {launch.transport} transport。产品业务 URL 仍保持在 Research Case，Harness URL 只作为 opaque runtime surface。
          </p>
          <a className="primary-button" style={{ marginTop: 16 }} href={launch.surfaceUrl} target="_blank" rel="noreferrer">
            打开 Research Agent<ExternalLink size={14}/>
          </a>
        </div>
      </div>
    </section>
  }

  return <section style={surfaceCardStyle} aria-label="Harness Research Workspace">
    <div style={toolbarStyle}>
      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--brand-50)', color: 'var(--brand-600)' }}>
          <Bot size={16}/>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)' }}>{title}</div>
          <div style={{ marginTop: 1, color: '#94a3b8', fontSize: 10 }}>
            {launch.researchCaseId ?? researchCaseId} · Harness runtime surface
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--muted)', fontSize: 11 }}>
        {!frameLoaded ? <><LoaderCircle size={13}/>Harness 加载中</> : <><ShieldCheck size={13}/>业务 ID 优先</>}
        <a className="icon-button" href={launch.surfaceUrl} target="_blank" rel="noreferrer" title="在独立窗口打开 Harness surface">
          <ExternalLink size={14}/>
        </a>
      </div>
    </div>
    <iframe
      title={title}
      src={launch.surfaceUrl}
      onLoad={() => setFrameLoaded(true)}
      style={{ width: '100%', minHeight: 0, flex: 1, border: 0, background: '#fff' }}
      sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-downloads"
      referrerPolicy="same-origin"
    />
  </section>
}
