import {
  Archive, ArrowLeft, ArrowRight, Bell, BookOpen, Bot, Boxes, CircleHelp, Command,
  Compass, Construction, Database, Flame, FolderKanban, Leaf, Lightbulb, Link2,
  Route as RouteIcon, Search, Send, Settings, ShieldCheck, SlidersHorizontal, Sparkles, X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useParams,
} from 'react-router-dom'
import { HarnessSurfaceHost } from './integrations/harness'
import { TodayRadarPage } from './pages/TodayRadarPage'

const primaryItems = [
  ['/today', '今日'], ['/opportunities', '机会'], ['/research', '研究'], ['/programming', '编排'],
  ['/creation', '创作'], ['/publication', '发布'], ['/performance', '表现'], ['/knowledge', '知识'],
] as const

const todayViews = [
  ['/today', '全部机会', Sparkles],
  ['/today?view=today-main', '今日主推', Flame],
  ['/today?view=high-confidence', '高置信', Compass],
  ['/today?view=needs-research', '待研究', CircleHelp],
  ['/today?view=evergreen', '长期储备', Leaf],
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
        {primaryItems.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `primary-nav__item${isActive ? ' is-active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
    <div className="top-nav__right">
      <div className="global-search" title="后续接入全局搜索">
        <Search size={15}/><span>搜索线索、机会、素材……</span><kbd><Command size={11}/>K</kbd>
      </div>
      <button className="icon-button" type="button" aria-label="系统通知">
        <Bell size={17}/><span className="notification-dot"/>
      </button>
      <span className="runtime-pill"><span className="runtime-pill__dot"/>AI 运行中</span>
      <button className="agent-button" type="button" title="S4 接入 Harness Agent"><Bot size={16}/>问 AI</button>
      <button className="primary-button primary-button--compact" type="button" onClick={onSubmit}>
        交给编辑部
      </button>
    </div>
  </header>
}

function Sidebar({ onSubmit }: { onSubmit: () => void }) {
  const location = useLocation()
  const isToday = location.pathname === '/today'
  const isResearch = location.pathname.startsWith('/research')
  const activeView = new URLSearchParams(location.search).get('view') ?? 'all'

  return <aside className="sidebar">
    <div className="sidebar__cta">
      <button className="primary-button primary-button--wide" type="button" onClick={onSubmit}>
        <Sparkles size={16}/><span>交给编辑部</span>
      </button>
    </div>
    <div className="sidebar__scroll">
      <section className="sidebar-section">
        <div className="sidebar-section__title"><Compass size={14}/><span>工作视野</span></div>
        <nav className="sidebar-list">
          {todayViews.map(([to, label, Icon]) => {
            const target = new URL(to, 'https://shell.local')
            const targetView = target.searchParams.get('view') ?? 'all'
            const active = to === '/research'
              ? isResearch
              : isToday && activeView === targetView

            return (
              <Link
                key={label}
                to={to}
                title={label}
                className={`sidebar-link${active ? ' is-active' : ''}`}
              >
                <Icon size={15}/><span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </section>
      <section className="sidebar-section">
        <div className="sidebar-section__title"><BookOpen size={14}/><span>栏目与长期池</span></div>
        <div className="sidebar-note">
          <Archive size={15}/><span>Series / Evergreen 将在后续业务批次接入真实数据。</span>
        </div>
      </section>
      <section className="sidebar-section sidebar-section--manage">
        <div className="sidebar-section__title"><ShieldCheck size={14}/><span>管理</span></div>
        <nav className="sidebar-list">
          {manageItems.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={15}/><span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </section>
    </div>
    <div className="sidebar__footer">
      <div className="workspace-avatar">ED</div>
      <div className="workspace-copy"><strong>编辑部</strong><span>Hybrid Shell</span></div>
    </div>
  </aside>
}

function HumanSubmissionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [value, setValue] = useState('')
  if (!open) return null

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section
      className="submission-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-title"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="submission-modal__header">
        <div><div className="eyebrow">Human Submission</div><h2 id="submission-title">交给编辑部</h2></div>
        <button className="icon-button" type="button" aria-label="关闭" onClick={onClose}><X size={18}/></button>
      </div>
      <p className="submission-modal__hint">刚看到什么值得我们看一下？可以粘贴链接、文字、问题、想法或观察。</p>
      <textarea
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="粘贴链接、文字、问题、想法……"
        rows={7}
      />
      <div className="submission-modal__chips">
        <span><Link2 size={14}/>URL</span><span><Lightbulb size={14}/>Text / Question / Idea</span>
      </div>
      <div className="submission-modal__footer">
        <p>S5 接入 HumanSubmission API 后才会真正提交；当前入口不会伪造成功状态。</p>
        <button type="button" className="primary-button" disabled={!value.trim()} title="S5 接入后开放提交">
          <Send size={15}/>S5 接入后提交
        </button>
      </div>
    </section>
  </div>
}

function AppShell() {
  const [submissionOpen, setSubmissionOpen] = useState(false)
  return <div className="app-shell">
    <TopNav onSubmit={() => setSubmissionOpen(true)}/>
    <div className="app-shell__body">
      <Sidebar onSubmit={() => setSubmissionOpen(true)}/>
      <main className="app-shell__main"><Outlet/></main>
    </div>
    <HumanSubmissionModal open={submissionOpen} onClose={() => setSubmissionOpen(false)}/>
  </div>
}

function WorkspaceLayout({
  title, description, eyebrow, badge, children,
}: {
  title: string
  description: string
  eyebrow?: string
  badge?: string
  children: ReactNode
}) {
  return <div className="workspace">
    <section className="workspace__content">
      <header className="page-header">
        <div>
          {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
          <div className="page-header__title-row">
            <h1>{title}</h1>{badge ? <span className="page-badge">{badge}</span> : null}
          </div>
          <p>{description}</p>
        </div>
      </header>
      <div className="workspace__canvas">{children}</div>
    </section>
  </div>
}

function FoundationPanel({
  icon: Icon, title, description, note,
}: {
  icon: typeof Sparkles
  title: string
  description: string
  note?: string
}) {
  return <article className="foundation-panel">
    <div className="foundation-panel__icon"><Icon size={18}/></div>
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
      {note ? <span className="foundation-panel__note">{note}</span> : null}
    </div>
    <ArrowRight size={16} className="foundation-panel__arrow"/>
  </article>
}

function PlaceholderPage({
  code, title, description, nextBatch,
}: {
  code: string
  title: string
  description: string
  nextBatch: string
}) {
  return <WorkspaceLayout eyebrow={code} title={title} badge="Foundation" description={description}>
    <div className="placeholder-page">
      <div className="placeholder-page__hero">
        <Construction size={30}/>
        <div><h2>产品路由已经可用</h2><p>当前页面只验证 Shell、导航与页面边界，不放置虚构业务数据。</p></div>
      </div>
      <div className="foundation-grid foundation-grid--compact">
        <FoundationPanel icon={RouteIcon} title="Stable product route" description="该页面由 Web Shell 路由拥有，不依赖 Harness Session。"/>
        <FoundationPanel icon={Database} title="Canonical state later" description="真实数据将统一来自 Editorial API / PostgreSQL，而不是浏览器内 mock。"/>
      </div>
      <div className="next-batch">下一实现批次：<strong>{nextBatch}</strong></div>
    </div>
  </WorkspaceLayout>
}

function ResearchIndexPage() {
  return <WorkspaceLayout
    eyebrow="P03 · Research Hub"
    title="研究"
    badge="Hybrid"
    description="这里是全局 Research 入口；具体研究对象仍以 Research Case 业务 ID 进入独立工作区。"
  >
    <div className="placeholder-page">
      <div className="placeholder-page__hero">
        <FolderKanban size={30}/>
        <div>
          <h2>研究入口已经可用</h2>
          <p>Today 的 Opportunity Inspector 已能创建或恢复 Research Case；S4 再接真实 Research Case 列表与 Harness launch。</p>
        </div>
      </div>
      <div className="foundation-grid foundation-grid--compact">
        <FoundationPanel icon={RouteIcon} title="Research Hub" description="/research 是全局入口，不依赖用户先知道某个 Research Case ID。"/>
        <FoundationPanel icon={Bot} title="Case Workspace" description="具体研究使用 /research/:researchCaseId；页面外壳属于 AI Editorial Desk，Agent / Tool / Replay 由 Harness 驱动。"/>
      </div>
      <div className="next-batch">S4 将把 <strong>Research Hub → Research Case → Harness Workspace</strong> 正式串起来。</div>
    </div>
  </WorkspaceLayout>
}

function ResearchPage() {
  const { researchCaseId = 'unknown' } = useParams()
  return <WorkspaceLayout
    eyebrow="P03 · Research Case"
    title="研究"
    badge="Hybrid"
    description="这是某一个 Research Case 的产品工作区。Web Shell 保留产品导航与业务 URL；Harness 负责内部 Agent / Tool / Replay / Research Workspace 交互。"
  >
    <HarnessSurfaceHost
      intent="research"
      researchCaseId={researchCaseId}
      returnPath={`/research/${encodeURIComponent(researchCaseId)}`}
      title="Research Workspace 宿主边界"
    />
  </WorkspaceLayout>
}

function NotFoundPage() {
  return <div className="not-found">
    <span className="eyebrow">404</span>
    <h1>没有这个产品页面</h1>
    <p>当前 Shell 只接受冻结在 Hybrid Shell Contract 中的正式业务路由。</p>
    <Link className="primary-button" to="/today"><ArrowLeft size={15}/>返回今日</Link>
  </div>
}

export function App() {
  return <Routes>
    <Route element={<AppShell/>}>
      <Route index element={<Navigate to="/today" replace/>}/>
      <Route path="/today" element={<TodayRadarPage/>}/>
      <Route path="/opportunities" element={<PlaceholderPage code="P02" title="机会库" description="长期浏览、筛选与管理完整 Opportunity corpus。" nextBatch="S3 · Opportunities Library"/>}/>
      <Route path="/research" element={<ResearchIndexPage/>}/>
      <Route path="/research/:researchCaseId" element={<ResearchPage/>}/>
      <Route path="/programming" element={<PlaceholderPage code="P04" title="编排" description="跨 Session 的 Candidate Pool / Today Main / Series / Watch / Evergreen 编排空间。" nextBatch="S6 · Programming foundation"/>}/>
      <Route path="/creation" element={<PlaceholderPage code="P05" title="创作" description="Brief、大纲、稿件、脚本、版本与引用的正式创作工作室。" nextBatch="后续 Creation batch"/>}/>
      <Route path="/publication" element={<PlaceholderPage code="P06" title="发布" description="发布审阅、队列、排期与 frozen provenance。" nextBatch="后续 Publication batch"/>}/>
      <Route path="/performance" element={<PlaceholderPage code="P07" title="表现" description="内容表现、预测与实际、Decision Review 与 Learning。" nextBatch="后续 Performance batch"/>}/>
      <Route path="/knowledge" element={<PlaceholderPage code="P08" title="知识" description="编辑方法论、栏目知识、Audience Profile、Style Guide 与历史案例。" nextBatch="后续 Knowledge batch"/>}/>
      <Route path="/manage/acquisition" element={<PlaceholderPage code="M01" title="采集任务" description="Search Missions、Feed、Momentum 与 Provider coverage 的管理空间。" nextBatch="Phase 0.5-B / Acquisition integration"/>}/>
      <Route path="/manage/configuration" element={<PlaceholderPage code="M02" title="配置中心" description="Series、Mission、Editorial Profile、Rubric、Research Policy 与版本管理。" nextBatch="后续 Configuration batch"/>}/>
      <Route path="/manage/system" element={<PlaceholderPage code="M03" title="系统设置" description="Provider、模型、预算、风险策略与 Runtime 状态。" nextBatch="后续 System batch"/>}/>
      <Route path="*" element={<NotFoundPage/>}/>
    </Route>
  </Routes>
}
