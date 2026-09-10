import { useEffect, useState } from 'react'

interface SchedulerTaskStatus {
  task_id: string
  trigger_kind: string
  enabled: boolean
  schedule_kind: string | null
  schedule_expression: string | null
  retry_max_attempts: number
  next_run_at: string | null
  last_run_at: string | null
}

interface SchedulerRunStatus {
  run_id: string
  task_id: string | null
  trigger_kind: string
  status: string
  attempt: number
  started_at: string
  finished_at: string | null
  next_retry_at: string | null
  failure_code: string | null
}

interface ResearchSchedulerStatus {
  research_case_id: string
  persistence: 'postgresql' | 'transitional_in_memory'
  durable_scheduler_configured: boolean
  tasks: SchedulerTaskStatus[]
  runs: SchedulerRunStatus[]
}

const colors = {
  border: '#e5eaf1',
  text: '#475569',
  muted: '#94a3b8',
  heading: '#172033',
  brand: '#4f46e5',
  success: '#15803d',
  warning: '#a16207',
  danger: '#b91c1c',
}

function statusLabel(value: string): string {
  if (value === 'succeeded') return '成功'
  if (value === 'failed') return '失败'
  if (value === 'running') return '运行中'
  if (value === 'queued') return '排队中'
  if (value === 'cancelled') return '已取消'
  if (value === 'skipped') return '已跳过'
  return value
}

function triggerLabel(value: string): string {
  if (value === 'manual') return '手动'
  if (value === 'schedule') return '定时'
  if (value === 'event') return '事件'
  return value
}

export function SchedulerStatusCard({ apiBase, researchCaseId }: { apiBase: string; researchCaseId: string }) {
  const [status, setStatus] = useState<ResearchSchedulerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetch(`${apiBase}/api/v1/integrations/harness/scheduler/research/${encodeURIComponent(researchCaseId)}/status`, {
      signal: controller.signal,
    })
      .then(async response => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
        return response.json() as Promise<ResearchSchedulerStatus>
      })
      .then(setStatus)
      .catch((reason: unknown) => {
        if ((reason as { name?: string }).name !== 'AbortError') {
          setError(reason instanceof Error ? reason.message : String(reason))
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [apiBase, researchCaseId, revision])

  const latest = status?.runs[0] ?? null
  const tone = latest?.status === 'failed'
    ? colors.danger
    : latest?.status === 'succeeded'
      ? colors.success
      : colors.warning

  return <div style={{ marginTop: 14, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 11, background: '#fff' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <strong style={{ color: colors.heading, fontSize: 11 }}>Scheduler / Headless</strong>
      <button type="button" onClick={() => setRevision(value => value + 1)} disabled={loading} style={{ border: `1px solid ${colors.border}`, borderRadius: 7, background: '#fff', color: colors.text, padding: '4px 7px', fontSize: 9, cursor: 'pointer' }}>刷新</button>
    </div>
    {loading ? <div style={{ marginTop: 8, color: colors.muted, fontSize: 10 }}>正在读取后台编排状态…</div> : null}
    {error ? <div role="alert" style={{ marginTop: 8, color: colors.danger, fontSize: 10 }}>Scheduler 状态读取失败：{error}</div> : null}
    {!loading && !error && status ? <div style={{ marginTop: 8, display: 'grid', gap: 7, color: colors.text, fontSize: 10, lineHeight: 1.55 }}>
      <div>
        Scheduler store: <strong>{status.durable_scheduler_configured ? 'PostgreSQL durable' : 'process-memory fallback'}</strong>
      </div>
      <div>后台任务：{status.tasks.length} · 运行记录：{status.runs.length}</div>
      {latest ? <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 7 }}>
        <div style={{ color: tone, fontWeight: 800 }}>最近运行：{statusLabel(latest.status)}</div>
        <div style={{ marginTop: 3 }}>触发：{triggerLabel(latest.trigger_kind)} · attempt {latest.attempt}</div>
        <div style={{ marginTop: 3, color: colors.muted, wordBreak: 'break-all' }}>{latest.run_id}</div>
        {latest.failure_code ? <div style={{ marginTop: 3, color: colors.danger }}>失败码：{latest.failure_code}</div> : null}
      </div> : <div style={{ color: colors.muted }}>暂无后台运行记录；Product Shell 不会伪造 Scheduler 状态。</div>}
      {status.tasks.length > 0 ? <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 7 }}>
        {status.tasks.slice(0, 3).map(task => <div key={task.task_id} style={{ marginTop: 3 }}>
          {triggerLabel(task.trigger_kind)} · {task.enabled ? '启用' : '停用'} · {task.schedule_expression ?? task.schedule_kind ?? '无表达式'}
        </div>)}
      </div> : null}
    </div> : null}
  </div>
}
