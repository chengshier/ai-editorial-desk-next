import type { OpportunitySummary } from '../../lib/editorial'

export type InspectorTab = 'overview' | 'evidence' | 'research' | 'timeline' | 'history'
export type ViewFilter = 'all' | 'today-main' | 'high-confidence' | 'needs-research' | 'evergreen'

export const inspectorTabs: Array<[InspectorTab, string]> = [
  ['overview', '概览'], ['evidence', '证据'], ['research', '研究'],
  ['timeline', '时间线'], ['history', '历史'],
]

export const filters: Array<[ViewFilter, string]> = [
  ['all', '全部'], ['today-main', '今日主推'], ['high-confidence', '高置信'],
  ['needs-research', '待研究'], ['evergreen', '长期储备'],
]

export function normalizeTab(value: string | null): InspectorTab {
  return inspectorTabs.some(([tab]) => tab === value) ? value as InspectorTab : 'overview'
}

export function normalizeFilter(value: string | null): ViewFilter {
  return filters.some(([filter]) => filter === value) ? value as ViewFilter : 'all'
}

export function filterOpportunity(item: OpportunitySummary, view: ViewFilter): boolean {
  if (view === 'today-main') return item.recommendation === 'today_main'
  if (view === 'high-confidence') return item.confidence === 'high'
  if (view === 'needs-research') return item.research_status === 'not_started'
  if (view === 'evergreen') return item.recommendation === 'evergreen'
  return true
}

export function recommendationLabel(value: string): string {
  return ({ today_main: '今日主推', evergreen: '长期储备', watch: '观察' } as Record<string, string>)[value] ?? value
}

export function researchLabel(value: string): string {
  return ({ completed: '研究完成', running: '研究中', not_started: '待研究' } as Record<string, string>)[value] ?? value
}

export function levelLabel(value: string): string {
  return ({ high: '高', medium: '中', low: '低' } as Record<string, string>)[value] ?? value
}
