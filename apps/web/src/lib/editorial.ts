import { apiFetch } from './api'

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

// S2 deliberately consumes the existing Editorial API spike read model instead of
// hard-coding browser fixtures. The route remains transitional until canonical
// Opportunity persistence/read APIs replace the Harness spike endpoint.
export function listEditorialOpportunities(): Promise<OpportunityList> {
  return apiFetch<OpportunityList>('/v1/spike/shell/opportunities')
}

export function inspectEditorialOpportunity(opportunityId: string): Promise<OpportunitySummary> {
  return apiFetch<OpportunitySummary>(`/v1/spike/shell/opportunities/${encodeURIComponent(opportunityId)}`)
}

export function createEditorialResearchCase(
  opportunityId: string,
  goal?: string,
): Promise<ResearchCreated> {
  return apiFetch<ResearchCreated>('/v1/spike/research-cases', {
    method: 'POST',
    body: JSON.stringify({
      opportunity_id: opportunityId,
      ...(goal ? { goal } : {}),
    }),
  })
}
