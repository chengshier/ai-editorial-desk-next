import { ArrowLeft, ArrowRight, Bot, Construction, Database, FolderKanban, Route as RouteIcon, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { HarnessSurfaceHost } from './integrations/harness'
import { AppShell } from './layouts/AppShell'
import { OpportunitiesLibraryPage } from './pages/OpportunitiesLibraryPage'
import { TodayRadarPage } from './pages/TodayRadarPage'

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
      <Route path="/opportunities" element={<OpportunitiesLibraryPage/>}/>
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
