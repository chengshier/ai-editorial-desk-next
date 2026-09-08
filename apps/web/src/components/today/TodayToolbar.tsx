import { FlaskConical, RefreshCw } from 'lucide-react'
import { filters, type ViewFilter } from './presentation'

export function TodayToolbar({ count, loading, failed, activeFilter, onFilter, onRefresh }: {
  count: number
  loading: boolean
  failed: boolean
  activeFilter: ViewFilter
  onFilter: (view: ViewFilter) => void
  onRefresh: () => void
}) {
  return <header className="today-toolbar">
    <div className="today-feed__header">
      <div className="today-feed__title-row">
        <h1>今日 · 编辑雷达</h1>
        <span className="today-feed__count" role="status">{loading ? '读取中' : failed ? '读取失败' : `${count} 条机会`}</span>
      </div>
      <button className="refresh-button" type="button" onClick={onRefresh} disabled={loading}>
        <RefreshCw size={14} className={loading ? 'spin' : ''}/>刷新
      </button>
    </div>
    <div className="today-feed__toolbar">
      <div className="radar-filter-group" aria-label="Today filters">
        {filters.map(([value, label]) => <button key={value} type="button"
          className={activeFilter === value ? 'is-active' : ''} aria-pressed={activeFilter === value}
          onClick={() => onFilter(value)}>{label}</button>)}
      </div>
    </div>
    <div className="radar-source-note"><FlaskConical size={13}/>
      <span>集成预览 · Editorial API 开发样本，非真实外部发现结果</span>
    </div>
  </header>
}
