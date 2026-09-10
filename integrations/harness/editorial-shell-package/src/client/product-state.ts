export type SectionId =
  | 'today'
  | 'opportunities'
  | 'research'
  | 'programming'
  | 'creation'
  | 'publication'
  | 'performance'
  | 'knowledge'

const SECTION_KEY = 'ai-editorial-desk:section'
const SECTION_PARAM = 'ed_section'

export const sections: Array<{ id: SectionId; label: string }> = [
  { id: 'today', label: '今日视野' },
  { id: 'opportunities', label: '全部机会' },
  { id: 'research', label: '研究' },
  { id: 'programming', label: '编排' },
  { id: 'creation', label: '创作' },
  { id: 'publication', label: '发布' },
  { id: 'performance', label: '表现' },
  { id: 'knowledge', label: '知识' },
]

function isSectionId(value: string | null): value is SectionId {
  return sections.some(item => item.id === value)
}

export function readProductParam(key: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(`ed_${key}`)
}

export function writeProductParams(changes: Record<string, string | null>): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(changes)) {
    const name = `ed_${key}`
    if (value === null || value === '') url.searchParams.delete(name)
    else url.searchParams.set(name, value)
  }
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

export function readSection(): SectionId {
  if (typeof window === 'undefined') return 'today'
  const fromUrl = new URLSearchParams(window.location.search).get(SECTION_PARAM)
  if (isSectionId(fromUrl)) return fromUrl
  const stored = window.localStorage.getItem(SECTION_KEY)
  return isSectionId(stored) ? stored : 'today'
}

export function persistSection(section: SectionId): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SECTION_KEY, section)
  writeProductParams({ section })
}
