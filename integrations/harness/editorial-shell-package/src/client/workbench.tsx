import { useState } from 'react'
import { OpportunityWorkspace, type ResearchTarget } from './opportunity-workspace.tsx'
import { persistSection, readProductParam, readSection, sections, type SectionId } from './product-state.ts'

const MODE_KEY = 'ai-editorial-desk:workspace-mode'
const API_BASE_KEY = 'ai-editorial-desk:api-base'
const DEFAULT_API_BASE = 'http://127.0.0.1:18000'

type WorkspaceMode = 'editorial' | 'harness'

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

function readResearchTarget(): ResearchTarget | null {
  const researchCaseId = readProductParam('research_case')
  const opportunityId = readProductParam('research_opportunity')
  return researchCaseId && opportunityId ? { researchCaseId, opportunityId } : null
}

function MigrationPlaceholder({ section }: { section: SectionId }) {
  const label = sections.find(item => item.id === section)?.label ?? section
  return <section style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 24 }}>
    <div style={{ color: colors.brand, fontSize: 11, fontWeight: 850 }}>HARNESS-NATIVE PRODUCT SHELL</div>
    <h2 style={{ margin: '8px 0 6px', fontSize: 20 }}>{label}</h2>
    <p style={{ margin: 0, color: colors.text, lineHeight: 1.7 }}>
      正式 Product Shell 已接管 Harness；该业务页面将在对应迁移批次从 apps/web 的业务能力中提取并迁入。当前不生成虚构业务数据。
    </p>
  </section>
}

function ResearchCasePanel({ target, onBack }: { target: ResearchTarget | null; onBack(): void }) {
  return <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 14 }}>
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 22 }}>
      <div style={{ color: colors.brand, fontSize: 10, fontWeight: 850 }}>S4-N2 · RESEARCH CASE ENTRY</div>
      <h2 style={{ margin: '8px 0 6px', fontSize: 20 }}>{target ? 'Research Case 已就绪' : '研究'}</h2>
      {target ? <>
        <p style={{ color: colors.text, fontSize: 12, lineHeight: 1.7 }}>
          Product Shell 已创建或恢复业务 Research Case。下一批 N3 会由 Runtime Adapter 自动绑定 Harness Session、rehydrate 业务上下文并执行 Agent；不要求用户进入聊天框手工 prompt。
        </p>
        <dl style={{ display: 'grid', gap: 9, margin: '18px 0 0' }}>
          <div><dt style={{ color: colors.muted, fontSize: 10 }}>research_case_id</dt><dd style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 800 }}>{target.researchCaseId}</dd></div>
          <div><dt style={{ color: colors.muted, fontSize: 10 }}>opportunity_id</dt><dd style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 800 }}>{target.opportunityId}</dd></div>
        </dl>
      </> : <p style={{ color: colors.text, fontSize: 12, lineHeight: 1.7 }}>从“今日视野”或“全部机会”的 Inspector 进入研究；Product Shell 始终以 Research Case 业务 ID 为主键。</p>}
      <button type="button" onClick={onBack} style={{ marginTop: 18, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.panel, padding: '8px 11px', color: colors.text, fontSize: 11, fontWeight: 750, cursor: 'pointer' }}>返回机会</button>
    </div>
    <aside style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 18 }}>
      <strong style={{ fontSize: 12 }}>Runtime boundary</strong>
      <div style={{ marginTop: 10, color: colors.text, fontSize: 11, lineHeight: 1.75 }}>
        <div>业务事实：Editorial API</div>
        <div>Agent Runtime：DeepSeek Harness</div>
        <div>Session / Job：运行时对象</div>
        <div>业务主键：Research Case</div>
      </div>
      <div style={{ marginTop: 14, padding: 10, borderRadius: 9, background: '#fff7ed', color: '#9a3412', fontSize: 10, lineHeight: 1.6 }}>N3 未完成前，这里不会伪造“Agent 已开始研究”。</div>
    </aside>
  </section>
}

export function EditorialWorkbenchRoot() {
  const [section, setSection] = useState<SectionId>(() => readSection())
  const [researchTarget, setResearchTarget] = useState<ResearchTarget | null>(() => readResearchTarget())
  const apiBase = readApiBase()

  const chooseSection = (next: SectionId): void => {
    setSection(next)
    persistSection(next)
  }

  const openResearchTarget = (target: ResearchTarget): void => {
    setResearchTarget(target)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('ed_research_case', target.researchCaseId)
      url.searchParams.set('ed_research_opportunity', target.opportunityId)
      url.searchParams.set('ed_section', 'research')
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
      window.localStorage.setItem('ai-editorial-desk:section', 'research')
    }
    setSection('research')
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
        {sections.map(item => <button key={item.id} type="button" onClick={() => chooseSection(item.id)} style={{
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

    <main style={{ minWidth: 0, padding: '22px 24px 40px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 18 }}>
        <div>
          <div style={{ color: colors.brand, fontSize: 10, fontWeight: 850, letterSpacing: '.06em' }}>S4-N2 · HARNESS-NATIVE</div>
          <h1 style={{ margin: '6px 0 5px', fontSize: 24 }}>{sections.find(item => item.id === section)?.label}</h1>
          <p style={{ margin: 0, color: colors.text, fontSize: 12 }}>结构化业务工作台直接运行在 DeepSeek Harness Web 内；业务事实来自 Editorial API。</p>
        </div>
        <div style={{ border: `1px solid ${colors.border}`, background: colors.panel, borderRadius: 10, padding: '8px 11px', color: colors.text, fontSize: 10, alignSelf: 'flex-start' }}>
          API: {apiBase} · Runtime: DeepSeek Harness
        </div>
      </header>

      {section === 'today' ? <OpportunityWorkspace apiBase={apiBase} kind="today" onResearchTarget={openResearchTarget}/>
        : section === 'opportunities' ? <OpportunityWorkspace apiBase={apiBase} kind="library" onResearchTarget={openResearchTarget}/>
          : section === 'research' ? <ResearchCasePanel target={researchTarget} onBack={() => chooseSection('opportunities')}/>
            : <MigrationPlaceholder section={section}/>} 
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
