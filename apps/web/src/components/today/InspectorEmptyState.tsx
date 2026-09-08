import { FileSearch, type LucideIcon } from 'lucide-react'

export function InspectorEmptyState({ icon: Icon = FileSearch, title, children }: {
  icon?: LucideIcon
  title: string
  children: React.ReactNode
}) {
  return <div className="inspector-empty-state">
    <div className="inspector-empty-state__icon"><Icon size={24}/></div>
    <strong>{title}</strong>
    <p>{children}</p>
  </div>
}
