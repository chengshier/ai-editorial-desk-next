import {
  Archive, ArrowLeft, ArrowRight, Bell, BookOpen, Bot, Boxes, CircleHelp, Command,
  Compass, Construction, Database, Eye, Flame, FolderKanban, LayoutDashboard,
  Leaf, Lightbulb, Link2, PanelRight, Route as RouteIcon, Search, Send, Settings,
  ShieldCheck, SlidersHorizontal, Sparkles, X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useParams,
} from 'react-router-dom'
import { HarnessSurfaceHost } from './integrations/harness'

const primaryItems = [
  ['/today', '今日'], ['/opportunities', '机会'], ['/research', '研究'], ['/programming', '编排'],
  ['/creation', '创作'], ['/publication', '发布'], ['/performance', '表现'], ['/knowledge', '知识'],
] as const

const todayViews = [
  ['/today', '全部机会', Sparkles],
  ['/today', '正在升温', Flame],
  ['/today', '值得一看', Compass],
  ['/today', '潜力发现', CircleHelp],
  ['/today', '长期储备', Leaf],
  ['/research', '正在研究', FolderKanban],
] as const

const manageItems = [
  ['/manage/acquisition', '采集任务', Boxes],
  ['/manage/configuration', '配置中心', SlidersHorizontal],
  ['/manage/system', '系统设置', Settings],
] as const

function TopNav({ onSubmit }: { onSubmit: () => void }) {
  return <header className="top-nav">
    <div className="top-nav__left">
      <NavLink to="/today" className="brand-mark" aria-label="AI Editorial Desk 首页">
        <span className="brand-mark__logo"><Sparkles size={16} /></span>
        <span className="brand-mark__name">AI Editorial Desk</span>
        <span className="brand-mark__badge">NEXT</span>
      </NavLink>
      <nav className="primary-nav" aria-label="全局产品导航">
        {primaryItems.map(([to, label]) => <NavLink key={to} to={to} className={({isActive}) => `primary-nav__item${isActive ? ' is-active' : ''}`}>{label}</NavLink>)}
      </nav>
    </div>
    <div className="top-nav__right">
      <div className="global-search" title="S2 后续接入全局搜索"><Search size={15}/><span>搜索线索、机会、素材……</span><kbd><Command size={11}/>K</kbd></div>
      <button className="icon-button" type="button" aria-label="系统通知"><Bell size={17}/><span className="notification-dot"/></button>
      <span className="runtime-pill"><span className="runtime-pill__dot"/>AI 运行中</span>
      <button className="agent-button" type="button" title="S4 接入 Harness Agent"><Bot size={16}/>问 AI</button>
      <button className="primary-button primary-button--compact" type="button" onClick={onSubmit}>交给编辑部</button>
    </div>
  </header>
}

function Sidebar({ onSubmit }: { onSubmit: () => void }) {
  const location = useLocation()
  const isToday = location.pathname === '/today'
  const isResearch = location.pathname.startsWith('/research')
  return <aside className="sidebar">
    <div className="sidebar__cta"><button className="primary-button primary-button--wide" type="button" onClick={onSubmit}><Sparkles size={16}/><span>交给编辑部</span></button></div>
    <div className="sidebar__scroll">
      <section className="sidebar-section">
        <div className="sidebar-section__title"><Compass size={14}/><span>工作视野</span></div>
        <nav className="sidebar-list">
          {todayViews.map(([to, label, Icon], index) => {
            const active = to === '/research' ? isResearch : isToday && index === 0
            return <NavLink key={label} to={to} title={label} className={`sidebar-link${active ? ' is-active' : ''}`}><Icon size={15}/><span>{label}</span></NavLink>
          })}
        </nav>
      </section>
      <section className="sidebar-section">
        <div className="sidebar-section__title"><BookOpen size={14}/><span>栏目与长期池</span></div>
        <div className="sidebar-note"><Archive size={15}/><span>Series / Evergreen 将在后续业务批次接入真实数据。</span></div>
      </section>
      <section className="sidebar-section sidebar-section--manage">
        <div className="sidebar-section__title"><ShieldCheck size={14}/><span>管理</span></div>
        <nav className="sidebar-list">
          {manageItems.map(([to, label, Icon]) => <NavLink key={to} to={to} title={label} className={({isActive}) => `sidebar-link${isActive ? ' is-active' : ''}`}><Icon size={15}/><span>{label}</span></NavLink>)}
        </nav>
      </section>
    </div>
    <div className="sidebar__footer"><div className="workspace-avatar">ED</div><div className="workspace-copy"><strong>编辑部</strong><span>Hybrid Shell</span></div></div>
  </aside>
}

function HumanSubmissionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [value, setValue] = useState('')
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="submission-modal" role="dialog" aria-modal="true" aria-labelledby="submission-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="submission-modal__header"><div><div className="eyebrow">Human Submission</div><h2 id="submission-title">交给编辑部</h2></div><button className="icon-button" type="button" aria-label="关闭" onClick={onClose}><X size={18}/></button></div>
      <p className="submission-modal__hint">刚看到什么值得我们看一下？可以粘贴链接、文字、问题、想法或观察。</p>
      <textarea autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="粘贴链接、文字、问题、想法……" rows={7}/>
      <div className="submission-modal__chips"><span><Link2 size={14}/>URL</span><span><Lightbulb size={14}/>Text / Question / Idea</span></div>
      <div className="submission-modal__footer"><p>S1 仅完成全局入口与交互壳；S5 接入 HumanSubmission API 后才会真正提交。</p><button type="button" className="primary-button" disabled={!value.trim()} title="S5 接入后开放提交"><Send size={15}/>S5 接入后提交</button></div>
    </section>
  </div>
}

function AppShell() {
  const [submissionOpen, setSubmissionOpen] = useState(false)
  return <div className="app-shell"><TopNav onSubmit={() => setSubmissionOpen(true)}/><div className="app-shell__body"><Sidebar onSubmit={() => setSubmissionOpen(true)}/><main className="app-shell__main"><Outlet/></main></div><HumanSubmissionModal open={submissionOpen} onClose={() => setSubmissionOpen(false)}/></div>
}

function WorkspaceLayout({ title, description, eyebrow, badge, children, inspector }: { title: string; description: string; eyebrow?: string; badge?: string; children: ReactNode; inspector?: ReactNode }) {
  return <div className={`workspace${inspector ? ' workspace--with-inspector' : ''}`}><section className="workspace__content"><header className="page-header"><div>{eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}<div className="page-header__title-row"><h1>{title}</h1>{badge ? <span className="page-badge">{badge}</span> : null}</div><p>{description}</p></div></header><div className="workspace__canvas">{children}</div></section>{inspector ? <aside className="inspector-host">{inspector}</aside> : null}</div>
}

function FoundationPanel({ icon: Icon, title, description, note }: { icon: typeof Sparkles; title: string; description: string; note?: string }) {
  return <article className="foundation-panel"><div className="foundation-panel__icon"><Icon size={18}/></div><div><h3>{title}</h3><p>{description}</p>{note ? <span className="foundation-panel__note">{note}</span> : null}</div><ArrowRight size={16} className="foundation-panel__arrow"/></article>
}

function InspectorPlaceholder() {
  return <div className="inspector-placeholder"><div className="inspector-placeholder__head"><div><span className="eyebrow">Opportunity Inspector</span><h2>机会检查器</h2></div><span className="page-badge">S2</span></div><div className="inspector-placeholder__tabs"><span className="is-active">概览</span><span>证据</span><span>研究</span><span>时间线</span><span>历史</span></div><div className="inspector-empty"><PanelRight size={28}/><strong>Inspector 容器已经就位</strong><p>S2 接入 Opportunity 数据后，这里展示业务详情；当 Opportunity 已有关联 Research Case 时，“研究”入口会进入对应 /research/:researchCaseId。</p></div></div>
}

function TodayPage() {
  return <WorkspaceLayout eyebrow="P01 · Product Shell Foundation" title="今日 / 编辑雷达" badge="S1" description="回答“今天有什么值得讲、为什么值得我看、下一步做什么”。本批只建立正式 Shell 与可复用布局，不伪造业务数据。" inspector={<InspectorPlaceholder/>}>
    <div className="foundation-grid">
      <FoundationPanel icon={LayoutDashboard} title="统一工作区骨架" description="固定 56px 顶栏、240px 侧栏、弹性主区与 416px Inspector 基线。" note="来自 Stitch 视觉语言，尺寸重新统一"/>
      <FoundationPanel icon={RouteIcon} title="业务路由已落位" description="Today、机会、研究、编排、创作、发布、表现、知识与管理页都有稳定产品 URL。"/>
      <FoundationPanel icon={Eye} title="Inspector Host" description="P01/P02 共用右侧检查器容器，避免重复制造第二套机会详情页。"/>
      <FoundationPanel icon={Sparkles} title="全局 Human Submission" description="“交给编辑部”入口已成为 Shell 全局能力，S5 再接真实 HumanSubmission API。"/>
      <FoundationPanel icon={Search} title="Search / Command 预留" description="顶部统一搜索与命令入口只保留视觉位置，本批不冒充已实现搜索。"/>
      <FoundationPanel icon={PanelRight} title="Harness Surface Boundary" description="S1 只定义宿主边界；S4 通过稳定 launch descriptor 接 Harness，不耦合私有 URL。"/>
    </div>
    <div className="visual-baseline-note"><div className="visual-baseline-note__swatch"/><div><strong>视觉基线</strong><p>保留 Stitch 的浅色编辑工作台、蓝紫主色、细边框与高信息密度，但统一各页漂移的侧栏、顶部与 Inspector 尺寸。</p></div></div>
  </WorkspaceLayout>
}

function PlaceholderPage({ code, title, description, nextBatch }: { code: string; title: string; description: string; nextBatch: string }) {
  return <WorkspaceLayout eyebrow={code} title={title} badge="Foundation" description={description}><div className="placeholder-page"><div className="placeholder-page__hero"><Construction size={30}/><div><h2>产品路由已经可用</h2><p>当前页面只验证 Shell、导航与页面边界，不放置虚构业务数据。</p></div></div><div className="foundation-grid foundation-grid--compact"><FoundationPanel icon={RouteIcon} title="Stable product route" description="该页面由 Web Shell 路由拥有，不依赖 Harness Session。"/><FoundationPanel icon={Database} title="Canonical state later" description="真实数据将统一来自 Editorial API / PostgreSQL，而不是浏览器内 mock。"/></div><div className="next-batch">下一实现批次：<strong>{nextBatch}</strong></div></div></WorkspaceLayout>
}

function ResearchIndexPage() {
  return <WorkspaceLayout eyebrow="P03 · Research Hub" title="研究" badge="Hybrid" description="这里是全局 Research 入口；具体研究对象仍以 Research Case 业务 ID 进入独立工作区。">
    <div className="placeholder-page">
      <div className="placeholder-page__hero"><FolderKanban size={30}/><div><h2>研究入口已经可用</h2><p>顶部“研究”和左侧“正在研究”现在都会进入这里。S4 接入真实 Research Case 列表、恢复与 Harness launch。</p></div></div>
      <div className="foundation-grid foundation-grid--compact">
        <FoundationPanel icon={RouteIcon} title="Research Hub" description="/research 是全局入口，不依赖用户先知道某个 Research Case ID。"/>
        <FoundationPanel icon={Bot} title="Case Workspace" description="具体研究仍使用 /research/:researchCaseId；页面外壳属于 AI Editorial Desk，内部 Agent / Tool / Replay 由 Harness 驱动。"/>
      </div>
      <div className="next-batch">S4 将把 <strong>Research Hub → Research Case → Harness Workspace</strong> 正式串起来；当前不伪造研究列表。</div>
    </div>
  </WorkspaceLayout>
}

function ResearchPage() {
  const { researchCaseId = 'unknown' } = useParams()
  return <WorkspaceLayout eyebrow="P03 · Research Case" title="研究" badge="Hybrid" description="这是某一个 Research Case 的产品工作区。Web Shell 保留产品导航与业务 URL；Harness 负责内部 Agent / Tool / Replay / Research Workspace 交互。"><HarnessSurfaceHost intent="research" researchCaseId={researchCaseId} returnPath={`/research/${encodeURIComponent(researchCaseId)}`} title="Research Workspace 宿主边界"/></WorkspaceLayout>
}

function NotFoundPage() {
  return <div className="not-found"><span className="eyebrow">404</span><h1>没有这个产品页面</h1><p>当前 Shell 只接受冻结在 Hybrid Shell Contract 中的正式业务路由。</p><Link className="primary-button" to="/today"><ArrowLeft size={15}/>返回今日</Link></div>
}

export function App() {
  return <Routes><Route element={<AppShell/>}><Route index element={<Navigate to="/today" replace/>}/><Route path="/today" element={<TodayPage/>}/><Route path="/opportunities" element={<PlaceholderPage code="P02" title="机会库" description="长期浏览、筛选与管理完整 Opportunity corpus。" nextBatch="S3 · Opportunities Library"/>}/><Route path="/research" element={<ResearchIndexPage/>}/><Route path="/research/:researchCaseId" element={<ResearchPage/>}/><Route path="/programming" element={<PlaceholderPage code="P04" title="编排" description="跨 Session 的 Candidate Pool / Today Main / Series / Watch / Evergreen 编排空间。" nextBatch="S6 · Programming foundation"/>}/><Route path="/creation" element={<PlaceholderPage code="P05" title="创作" description="Brief、大纲、稿件、脚本、版本与引用的正式创作工作室。" nextBatch="后续 Creation batch"/>}/><Route path="/publication" element={<PlaceholderPage code="P06" title="发布" description="发布审阅、队列、排期与 frozen provenance。" nextBatch="后续 Publication batch"/>}/><Route path="/performance" element={<PlaceholderPage code="P07" title="表现" description="内容表现、预测与实际、Decision Review 与 Learning。" nextBatch="后续 Performance batch"/>}/><Route path="/knowledge" element={<PlaceholderPage code="P08" title="知识" description="编辑方法论、栏目知识、Audience Profile、Style Guide 与历史案例。" nextBatch="后续 Knowledge batch"/>}/><Route path="/manage/acquisition" element={<PlaceholderPage code="M01" title="采集任务" description="Search Missions、Feed、Momentum 与 Provider coverage 的管理空间。" nextBatch="Phase 0.5-B / Acquisition integration"/>}/><Route path="/manage/configuration" element={<PlaceholderPage code="M02" title="配置中心" description="Series、Mission、Editorial Profile、Rubric、Research Policy 与版本管理。" nextBatch="后续 Configuration batch"/>}/><Route path="/manage/system" element={<PlaceholderPage code="M03" title="系统设置" description="Provider、模型、预算、风险策略与 Runtime 状态。" nextBatch="后续 System batch"/>}/><Route path="*" element={<NotFoundPage/>}/></Route></Routes>
}
