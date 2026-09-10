export interface SubjectSummary {
  id: string
  type: string
  name: string
}

export interface EvidenceState {
  open_unknown_count: number
}

export interface OpportunitySummary {
  opportunity_id: string
  headline: string
  subject: SubjectSummary
  angle: string
  theme: string
  audience_promise: string
  why_now: string
  recommendation: string
  confidence: string
  value_highlights: string[]
  research_status: string
  evidence_state: EvidenceState
  production_readiness: string
  latest_research_case_id: string | null
}

export interface OpportunityList {
  items: OpportunitySummary[]
  count: number
}

export interface ResearchCreated {
  research_case_id: string
  opportunity_id: string
  status: string
  progress_url: string
}

async function requestJson<T>(apiBase: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${response.status} ${response.statusText}${text ? `: ${text}` : ''}`)
  }
  return response.json() as Promise<T>
}

export function listEditorialOpportunities(apiBase: string, signal?: AbortSignal): Promise<OpportunityList> {
  return requestJson<OpportunityList>(apiBase, '/api/v1/spike/shell/opportunities', { signal })
}

export function inspectEditorialOpportunity(
  apiBase: string,
  opportunityId: string,
  signal?: AbortSignal,
): Promise<OpportunitySummary> {
  return requestJson<OpportunitySummary>(
    apiBase,
    `/api/v1/spike/shell/opportunities/${encodeURIComponent(opportunityId)}`,
    { signal },
  )
}

export function createEditorialResearchCase(
  apiBase: string,
  opportunityId: string,
  goal?: string,
): Promise<ResearchCreated> {
  return requestJson<ResearchCreated>(apiBase, '/api/v1/spike/research-cases', {
    method: 'POST',
    body: JSON.stringify({
      opportunity_id: opportunityId,
      ...(goal ? { goal } : {}),
    }),
  })
}
