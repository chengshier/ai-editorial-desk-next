import { Bell, Bot, Search, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const primaryItems = [
  ['/today', '今日'], ['/opportunities', '机会'], ['/research', '研究'], ['/programming', '编排'],
  ['/creation', '创作'], ['/publication', '发布'], ['/performance', '表现'], ['/knowledge', '知识'],
] as const

export function TopNav({ onSubmit }: { onSubmit: () => void }) {
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
        <Search size={15}/><span>搜索线索、机会、素材……</span><small>即将开放</small>
      </div>
      <button className="icon-button" type="button" aria-label="系统通知（即将开放）" disabled>
        <Bell size={17}/>
      </button>
      <span className="runtime-pill">集成预览</span>
      <button className="agent-button" type="button" title="S4 接入 Harness Agent" disabled><Bot size={16}/>问 AI</button>
      <button className="primary-button primary-button--compact" type="button" onClick={onSubmit}>
        交给编辑部
      </button>
    </div>
  </header>
}
