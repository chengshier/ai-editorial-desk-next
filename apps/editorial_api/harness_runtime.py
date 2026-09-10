from __future__ import annotations

from threading import Lock

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from apps.editorial_api.spike_harness import _RESEARCH, _RESEARCH_LOCK

router = APIRouter(prefix="/api/v1/integrations/harness/runtime", tags=["harness-runtime"])


class HarnessResearchBinding(BaseModel):
    research_case_id: str
    opportunity_id: str
    harness_session_id: str | None = None
    bootstrap_required: bool = True


class HarnessSessionBindRequest(BaseModel):
    harness_session_id: str = Field(min_length=1)


class HarnessBootstrapCompleteRequest(BaseModel):
    harness_session_id: str = Field(min_length=1)


_RUNTIME_LOCK = Lock()
_RESEARCH_SESSION_BY_CASE: dict[str, str] = {}
_BOOTSTRAPPED_RESEARCH_SESSIONS: set[tuple[str, str]] = set()


def _research_opportunity_id(research_case_id: str) -> str:
    # Transitional S4 fixture boundary only. PostgreSQL remains the target
    # canonical store; Harness runtime metadata must never become business truth.
    with _RESEARCH_LOCK:
        record = _RESEARCH.get(research_case_id)
        if record is None:
            raise HTTPException(status_code=404, detail="research case not found")
        return record.opportunity_id


def _binding(research_case_id: str) -> HarnessResearchBinding:
    opportunity_id = _research_opportunity_id(research_case_id)
    session_id = _RESEARCH_SESSION_BY_CASE.get(research_case_id)
    bootstrap_required = session_id is None or (
        research_case_id,
        session_id,
    ) not in _BOOTSTRAPPED_RESEARCH_SESSIONS
    return HarnessResearchBinding(
        research_case_id=research_case_id,
        opportunity_id=opportunity_id,
        harness_session_id=session_id,
        bootstrap_required=bootstrap_required,
    )


@router.get("/research/{research_case_id}", response_model=HarnessResearchBinding)
async def get_research_runtime_binding(research_case_id: str) -> HarnessResearchBinding:
    with _RUNTIME_LOCK:
        return _binding(research_case_id)


@router.post("/research/{research_case_id}/session", response_model=HarnessResearchBinding)
async def bind_research_runtime_session(
    research_case_id: str,
    payload: HarnessSessionBindRequest,
) -> HarnessResearchBinding:
    with _RUNTIME_LOCK:
        _research_opportunity_id(research_case_id)
        previous = _RESEARCH_SESSION_BY_CASE.get(research_case_id)
        _RESEARCH_SESSION_BY_CASE[research_case_id] = payload.harness_session_id
        if previous != payload.harness_session_id:
            _BOOTSTRAPPED_RESEARCH_SESSIONS.discard((research_case_id, payload.harness_session_id))
        return _binding(research_case_id)


@router.post("/research/{research_case_id}/bootstrap-complete", response_model=HarnessResearchBinding)
async def mark_research_runtime_bootstrap_complete(
    research_case_id: str,
    payload: HarnessBootstrapCompleteRequest,
) -> HarnessResearchBinding:
    with _RUNTIME_LOCK:
        _research_opportunity_id(research_case_id)
        bound = _RESEARCH_SESSION_BY_CASE.get(research_case_id)
        if bound != payload.harness_session_id:
            raise HTTPException(status_code=409, detail="bootstrap session is not the bound session")
        _BOOTSTRAPPED_RESEARCH_SESSIONS.add((research_case_id, payload.harness_session_id))
        return _binding(research_case_id)
