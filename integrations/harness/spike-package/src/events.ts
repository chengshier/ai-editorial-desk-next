import type {} from '@deepseek-ai/dsh-jobs'

export interface EditorialResearchStartEvent {
  researchCaseId: string
  opportunityId: string
  title: string
  status: 'queued' | 'running'
  progress: number
  message: string
}

export interface EditorialResearchProgressEvent {
  researchCaseId: string
  opportunityId: string
  status: 'queued' | 'running'
  stage: string
  progress: number
  message: string
  newEvidenceCount: number
  openUnknownCount: number
}

export interface EditorialResearchEndEvent {
  researchCaseId: string
  opportunityId: string
  status: 'completed' | 'failed' | 'cancelled'
  progress: number
  message: string
  newEvidenceCount: number
  openUnknownCount: number
}

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    'editorial/research-start': EditorialResearchStartEvent
    'editorial/research-progress': EditorialResearchProgressEvent
    'editorial/research-end': EditorialResearchEndEvent
  }
}

declare module '@deepseek-ai/dsh-jobs' {
  interface JobKindMap {
    'editorial-research': 'editorial-research'
  }
}
