import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { TopNav } from '../components/shell/TopNav'
import { Sidebar } from '../components/shell/Sidebar'
import { HumanSubmissionModal } from '../components/shell/HumanSubmissionModal'

export function AppShell() {
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
