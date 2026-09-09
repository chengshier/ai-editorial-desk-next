import { Archive, BookOpen, Boxes, CircleHelp, Compass, Flame, FolderKanban, Leaf, Settings, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { listEditorialOpportunities } from '../../lib/editorial'

type ViewKey = 'all' | 'today-main' | 'high-confidence' | 'needs-research' | 'evergreen' | 'research'

const todayViews = [
  ['/today', '全部机会', Sparkles],
  ['/today?view=today-main', '今日主推', Flame],
  ['/today?view=high-confidence', '高置信', Compass],
  ['/today?view=needs-research', '待研究', CircleHelp],
  ['/today?view=evergreen', '长期储备', Leaf],
  ['/research', '正在研究', FolderKanban],
] as const

const countKeys: Record<string, ViewKey> = {
  全部机会: 'all',
  今日主推: 'today-main',
  高置信: 'high-confidence',
  待研究: 'needs-research',
  长期储备: 'evergreen',
  正在研究: 'research',
}

const manageItems = [
  ['/manage/acquisition', '采集任务', Boxes],
  ['/manage/configuration', '配置中心', SlidersHorizontal],
  ['/manage/system', '系统设置', Settings],
] as const

export function Sidebar({ onSubmit }: { onSubmit: () => void }) {
  const location = useLocation()
  const isToday = location.pathname === '/today'
  const isResearch = location.pathname.startsWith('/research')
  const activeView = new URLSearchParams(location.search).get('view') ?? 'all'
  const [counts, setCounts] = useState<Partial<Record<ViewKey, number>> | null>(null)

  useEffect(() => {
    let cancelled = false
    listEditorialOpportunities()
      .then(({ items }) => {
        if (cancelled) return
        setCounts({
          all: items.length,
          'today-main': items.filter((item) => item.recommendation === 'today_main').length,
          'high-confidence': items.filter((item) => item.confidence === 'high').length,
          'needs-research': items.filter((item) => item.research_status === 'not_started').length,
          evergreen: items.filter((item) => item.recommendation === 'evergreen').length,
          research: items.filter((item) => item.research_status === 'running').length,
        })
      })
      .catch(() => {
        // API 不可用时隐藏数量徽标，不阻断导航，也不伪造数字。
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <aside className="sidebar">
    <div className="sidebar__cta">
      <button className="primary-button primary-button--wide" type="button" onClick={onSubmit}>
        <Sparkles size={16}/><span>交给编辑部</span>
      </button>
    </div>
    <div className="sidebar__scroll">
      <section className="sidebar-section">
        <div className="sidebar-section__title"><Compass size={14}/><span>今日视野</span></div>
        <nav className="sidebar-list">
          {todayViews.map(([to, label, Icon]) => {
            const target = new URL(to, 'https://shell.local')
            const targetView = target.searchParams.get('view') ?? 'all'
            const active = to === '/research'
              ? isResearch
              : isToday && activeView === targetView
            const count = counts?.[countKeys[label]]

            return (
              <Link
                key={label}
                to={to}
                title={label}
                className={`sidebar-link${active ? ' is-active' : ''}`}
              >
                <Icon size={15}/><span>{label}</span>
                {count !== undefined ? <span className="sidebar-link__count">{count}</span> : null}
              </Link>
            )
          })}
        </nav>
      </section>
      <section className="sidebar-section">
        <div className="sidebar-section__title"><BookOpen size={14}/><span>栏目与长期池</span></div>
        <div className="sidebar-note">
          <Archive size={15}/><span>栏目将在后续开放，长期机会可在「长期储备」查看。</span>
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
