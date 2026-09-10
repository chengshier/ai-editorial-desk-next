import { useCallback, useEffect, useState } from 'react'

const MODE_KEY = 'ai-editorial-desk:workspace-mode'
const API_BASE_KEY = 'ai-editorial-desk:api-base'
const SECTION_KEY = 'ai-editorial-desk:section'
const DEFAULT_API_BASE = 'http://127.0.0.1:18000'

type WorkspaceMode = 'editorial' | 'harness'
type SectionId = 'today' | 'opportunities' | 'research' | 'programming' | 'creation' | 'publication' | 'performance' | 'knowledge'

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

const nav: Array<{ id: SectionId; label: string }> = [
  { id: 'today', label: '今日视野' },
  { id: 'opportunities', label: '全部机会' },
  { id: 'research', label: '研究' },
  { id: 'programming', label: '编排' },
  { id: 'creation', label: '创作' },
  { id: 'publication', label: '发布' },
  { id: 'performance', label: '表现' },
  { id: 'knowledge', label: '知识' },
]

const colors = {
  page: '#f6f8fb',
  panel: '#ffffff',
  border: '#e5eaf1',
  heading: '#172033',
  text: '#475569',
  muted: '#94a3b8',
  brand: '#4f46e5',
  brandSoft: '#eef2ff',
  danger: '#b91c1c',
}

export function readMode(): WorkspaceMode {
  if (typeof window === 'undefined') return 'editorial'
  return window.localStorage.getItem(MODE_KEY) === 'harness' ? 'harness' : 'editorial'
}

function setMode(mode: WorkspaceMode): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MODE_KEY, mode)
  window.location.reload()
}

export function readApiBase(): string {
  if (typeof window === 'undefined') return DEFAULT_API_BASE
  return (window.localStorage.getItem(API_BASE_KEY) ?? DEFAULT_API_BASE).replace(/\/$/u, '')
}

function readSection(): SectionId {
  if (typeof window === 'undefined') return 'today'
  const value = window.localStorage.getItem(SECTION_KEY)
  return nav.some(item => item.id === value) ? value as SectionId : 'today'
}

function OpportunityCard({ item }: { item: OpportunitySummary }) {
  return <article style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '16px 18px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
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
    <h3 style={{ margin: '12px 0 6px', color: colors.heading, fontSize: 16 }}>{item.headline}</h3>
    <p style={{ margin: 0, color: colors.text, fontSize: 13, lineHeight: 1.65 }}>{item.angle}</p>
    <div style={{ display: 'flex', gap: 16, marginTop: 12, color: colors.muted, fontSize: 11 }}>
      <span>置信度 {item.confidence}</span>
      <span>未知项 {item.evidence_state.open_unknown_count}</span>
    </div>
  </article>
}

function MigrationPlaceholder({ section }: { section: SectionId }) {
  const label = nav.find(item => item.id === section)?.label ?? section
  return <section style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 24 }}>
    <div style={{ color: colors.brand, fontSize: 11, fontWeight: 850 }}>S4-N1 PRODUCT SHELL FOUNDATION</div>
    <h2 style={{ margin: '8px 0 6px', fontSize: 20 }}>{label}</h2>
    <p style={{ margin: 0, color: colors.text, lineHeight: 1.7 }}>
      正式 Product Shell 已接管 Harness；该业务页面将在对应迁移批次从 apps/web 搬入。当前不生成虚构业务数据。
    </p>
  </section>
}

export function EditorialWorkbenchRoot() {
  const [section, setSection] = useState<SectionId>(() => readSection())
  const [data, setData] = useState<OpportunityList | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadToday = useCallback(async () => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${readApiBase()}/api/v1/spike/opportunities`, { signal: controller.signal })
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      setData(await response.json() as OpportunityList)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setLoading(false)
    }
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (section !== 'today') return
    void loadToday()
  }, [loadToday, section])

  const chooseSection = (next: SectionId): void => {
    setSection(next)
    window.localStorage.setItem(SECTION_KEY, next)
  }

  return <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', background: colors.page, color: colors.heading }}>
    <aside style={{ background: colors.panel, borderRight: `1px solid ${colors.border}`, padding: '18px 14px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 8px 18px' }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: colors.brand, color: '#fff', fontWeight: 900 }}>AI</div>
        <div>
          <div style={{ fontWeight: 850, fontSize: 14 }}>AI Editorial Desk</div>
          <div style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>Harness-native Product Shell</div>
        </div>
      </div>
      <nav style={{ display: 'grid', gap: 4 }}>
        {nav.map(item => <button key={item.id} type="button" onClick={() => chooseSection(item.id)} style={{
          border: 0,
          borderRadius: 9,
          background: section === item.id ? colors.brandSoft : 'transparent',
          color: section === item.id ? colors.brand : colors.text,
          padding: '9px 10px',
          textAlign: 'left',
          fontSize: 12,
          fontWeight: section === item.id ? 800 : 650,
          cursor: 'pointer',
        }}>{item.label}</button>)}
      </nav>
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
        <button type="button" onClick={() => setMode('harness')} style={{ border: `1px solid ${colors.border}`, borderRadius: 9, background: colors.panel, padding: '8px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          切换到 Harness 原生工作台
        </button>
      </div>
    </aside>

    <main style={{ minWidth: 0, padding: '24px 28px 40px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 22 }}>
        <div>
          <div style={{ color: colors.brand, fontSize: 11, fontWeight: 850, letterSpacing: '.06em' }}>S4-N1</div>
          <h1 style={{ margin: '6px 0 5px', fontSize: 24 }}>{nav.find(item => item.id === section)?.label}</h1>
          <p style={{ margin: 0, color: colors.text, fontSize: 13 }}>AI Editorial Desk 直接运行在 DeepSeek Harness Web 内；业务事实来自 Editorial API。</p>
        </div>
        <div style={{ border: `1px solid ${colors.border}`, background: colors.panel, borderRadius: 10, padding: '8px 11px', color: colors.text, fontSize: 11 }}>
          API: {readApiBase()} · Runtime: DeepSeek Harness
        </div>
      </header>

      {section === 'today' ? <>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14 }}><div style={{ color: colors.muted, fontSize: 11 }}>机会总数</div><strong style={{ display: 'block', marginTop: 5, fontSize: 22 }}>{data?.count ?? '—'}</strong></div>
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14 }}><div style={{ color: colors.muted, fontSize: 11 }}>工作台模式</div><strong style={{ display: 'block', marginTop: 7, fontSize: 13 }}>AI Editorial Desk</strong></div>
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14 }}><div style={{ color: colors.muted, fontSize: 11 }}>Harness UI</div><strong style={{ display: 'block', marginTop: 7, fontSize: 13 }}>可随时切回</strong></div>
        </section>
        {error ? <div style={{ border: '1px solid #fecaca', background: '#fff7f7', color: colors.danger, borderRadius: 12, padding: 14, fontSize: 12 }}>
          <strong>Editorial API 暂时不可用：</strong> {error}
          <button type="button" onClick={() => void loadToday()} style={{ marginLeft: 12, border: '1px solid #fecaca', borderRadius: 8, background: '#fff', padding: '5px 9px', cursor: 'pointer' }}>重新连接</button>
        </div> : null}
        {!error && loading ? <div style={{ color: colors.muted, fontSize: 13 }}>正在读取 Editorial API…</div> : null}
        {data ? <div style={{ display: 'grid', gap: 12 }}>{data.items.map(item => <OpportunityCard key={item.opportunity_id} item={item}/>)}</div> : null}
      </> : <MigrationPlaceholder section={section}/>} 
    </main>
  </div>
}

export function NativeWorkbenchSwitch({ wide }: { wide: boolean }) {
  return <button
    type="button"
    aria-label="进入 AI Editorial Desk"
    title="进入 AI Editorial Desk"
    onClick={() => setMode('editorial')}
    style={{
      height: 36,
      minWidth: wide ? 92 : 36,
      border: `1px solid ${colors.border}`,
      borderRadius: 9,
      background: colors.panel,
      color: colors.brand,
      padding: wide ? '0 10px' : 0,
      fontSize: 12,
      fontWeight: 800,
      cursor: 'pointer',
      display: 'inline-grid',
      placeItems: 'center',
      whiteSpace: 'nowrap',
    }}
  >{wide ? 'AI 编辑部' : 'AI'}</button>
}
