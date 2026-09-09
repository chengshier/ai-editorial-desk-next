import { createElement, useEffect, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'

const MODE_KEY = 'ai-editorial-desk:workspace-mode'
const API_BASE_KEY = 'ai-editorial-desk:api-base'

type WorkspaceMode = 'editorial' | 'harness'

interface OpportunitySummary {
  opportunity_id: string
  headline: string
  angle: string
  recommendation: string
  confidence: string
  research_status: string
  evidence_state: { open_unknown_count: number }
}

interface OpportunityList {
  count: number
  items: OpportunitySummary[]
}

function readMode(): WorkspaceMode {
  if (typeof window === 'undefined') return 'editorial'
  return window.localStorage.getItem(MODE_KEY) === 'harness' ? 'harness' : 'editorial'
}

function setMode(mode: WorkspaceMode): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MODE_KEY, mode)
  window.location.reload()
}

function readApiBase(): string {
  if (typeof window === 'undefined') return 'http://127.0.0.1:8000'
  return (window.localStorage.getItem(API_BASE_KEY) ?? 'http://127.0.0.1:8000').replace(/\/$/u, '')
}

const colors = {
  page: '#f6f8fb',
  panel: '#ffffff',
  border: '#e5eaf1',
  heading: '#172033',
  text: '#475569',
  muted: '#94a3b8',
  brand: '#4f46e5',
  brandSoft: '#eef2ff',
}

function ModeButton({ target, children }: { target: WorkspaceMode; children: string }) {
  return <button
    type="button"
    onClick={() => setMode(target)}
    style={{
      border: `1px solid ${colors.border}`,
      borderRadius: 9,
      background: colors.panel,
      color: colors.heading,
      padding: '8px 11px',
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
    }}
  >{children}</button>
}

function OpportunityCard({ item }: { item: OpportunitySummary }) {
  return <article style={{
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: '16px 18px',
    boxShadow: '0 1px 2px rgba(15,23,42,.03)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        <span style={{ borderRadius: 999, background: colors.brandSoft, color: colors.brand, padding: '3px 8px', fontSize: 11, fontWeight: 800 }}>
          {item.recommendation === 'today_main' ? '今日主推' : item.recommendation}
        </span>
        <span style={{ borderRadius: 999, background: '#f8fafc', color: colors.text, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
          {item.research_status === 'not_started' ? '待研究' : item.research_status}
        </span>
      </div>
      <code style={{ color: colors.muted, fontSize: 10 }}>{item.opportunity_id}</code>
    </div>
    <h3 style={{ margin: '12px 0 6px', color: colors.heading, fontSize: 16, lineHeight: 1.45 }}>{item.headline}</h3>
    <p style={{ margin: 0, color: colors.text, fontSize: 13, lineHeight: 1.65 }}>{item.angle}</p>
    <div style={{ display: 'flex', gap: 16, marginTop: 12, color: colors.muted, fontSize: 11 }}>
      <span>置信度 {item.confidence}</span>
      <span>未知项 {item.evidence_state.open_unknown_count}</span>
    </div>
  </article>
}

function EditorialWorkbenchRoot() {
  const [data, setData] = useState<OpportunityList | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    void fetch(`${readApiBase()}/api/v1/spike/opportunities`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
        return response.json() as Promise<OpportunityList>
      })
      .then(value => setData(value))
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : String(reason))
      })
    return () => controller.abort()
  }, [])

  const nav = ['今日视野', '全部机会', '研究', '编排', '创作', '发布', '表现', '知识']
  return <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', background: colors.page, color: colors.heading }}>
    <aside style={{ background: colors.panel, borderRight: `1px solid ${colors.border}`, padding: '18px 14px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 8px 18px' }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: colors.brand, color: '#fff', fontWeight: 900 }}>AI</div>
        <div>
          <div style={{ fontWeight: 850, fontSize: 14 }}>AI Editorial Desk</div>
          <div style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>Harness-native spike</div>
        </div>
      </div>
      <nav style={{ display: 'grid', gap: 4 }}>
        {nav.map((label, index) => <button key={label} type="button" style={{
          border: 0,
          borderRadius: 9,
          background: index === 0 ? colors.brandSoft : 'transparent',
          color: index === 0 ? colors.brand : colors.text,
          padding: '9px 10px',
          textAlign: 'left',
          fontSize: 12,
          fontWeight: index === 0 ? 800 : 650,
          cursor: 'default',
        }}>{label}</button>)}
      </nav>
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
        <ModeButton target="harness">切换到 Harness 原生工作台</ModeButton>
      </div>
    </aside>

    <main style={{ minWidth: 0, padding: '24px 28px 40px' }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 22 }}>
        <div>
          <div style={{ color: colors.brand, fontSize: 11, fontWeight: 850, letterSpacing: '.06em' }}>TODAY</div>
          <h1 style={{ margin: '6px 0 5px', fontSize: 24 }}>今日视野</h1>
          <p style={{ margin: 0, color: colors.text, fontSize: 13 }}>这个页面直接运行在 DeepSeek Harness Web 内，但业务数据来自 Editorial API。</p>
        </div>
        <div style={{ border: `1px solid ${colors.border}`, background: colors.panel, borderRadius: 10, padding: '8px 11px', color: colors.text, fontSize: 11 }}>
          Runtime: DeepSeek Harness
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
        <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14 }}><div style={{ color: colors.muted, fontSize: 11 }}>机会总数</div><strong style={{ display: 'block', marginTop: 5, fontSize: 22 }}>{data?.count ?? '—'}</strong></div>
        <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14 }}><div style={{ color: colors.muted, fontSize: 11 }}>工作台模式</div><strong style={{ display: 'block', marginTop: 7, fontSize: 13 }}>AI Editorial Desk</strong></div>
        <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14 }}><div style={{ color: colors.muted, fontSize: 11 }}>Harness UI</div><strong style={{ display: 'block', marginTop: 7, fontSize: 13 }}>可随时切回</strong></div>
      </section>

      {error ? <div style={{ border: '1px solid #fecaca', background: '#fff7f7', color: '#b91c1c', borderRadius: 12, padding: 14, fontSize: 12 }}>
        Editorial API 读取失败：{error}
      </div> : null}
      {!error && data === null ? <div style={{ color: colors.muted, fontSize: 13 }}>正在读取 Editorial API…</div> : null}
      {data ? <div style={{ display: 'grid', gap: 12 }}>{data.items.map(item => <OpportunityCard key={item.opportunity_id} item={item}/>)}</div> : null}
    </main>
  </div>
}

function NativeWorkbenchSwitch() {
  return <div style={{ position: 'fixed', left: 14, bottom: 14, pointerEvents: 'auto', zIndex: 10000 }}>
    <button type="button" onClick={() => setMode('editorial')} style={{
      border: '1px solid rgba(255,255,255,.2)',
      borderRadius: 10,
      background: '#111827',
      color: '#fff',
      padding: '9px 12px',
      fontSize: 12,
      fontWeight: 800,
      boxShadow: '0 8px 24px rgba(15,23,42,.22)',
      cursor: 'pointer',
    }}>进入 AI Editorial Desk</button>
  </div>
}

export const name = 'ai-editorial-desk-harness-native-shell-spike-client'
export const inject = ['slots']

export function apply(ctx: ClientContext): void {
  if (readMode() === 'editorial') {
    // `root` is the built-in single slot. A dynamic registration shadows the
    // shipped AppFrame without patching Harness core. Reloading with mode
    // `harness` simply skips this registration, restoring the stock UI.
    ctx.slots.register({ name: 'root' }, EditorialWorkbenchRoot)
    return
  }

  // In stock Harness mode, keep the shipped AppFrame and add only an opt-in
  // switch through its additive overlay seat.
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'ai-editorial-desk-workbench-switch',
    order: 1000,
  }, NativeWorkbenchSwitch))
}
