from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from apps.editorial_api.spike_harness import (
    OPPORTUNITIES,
    OPPORTUNITY_BY_ID,
    OpportunitySummary,
    _RESEARCH_LOCK,
    _effective_opportunity,
    _latest_record_unlocked,
)

router = APIRouter(prefix="/api/v1/spike/shell", tags=["shell-spike"])


class ShellOpportunitySummary(OpportunitySummary):
    latest_research_case_id: str | None = None


class ShellOpportunityList(BaseModel):
    items: list[ShellOpportunitySummary]
    count: int


def _shell_opportunity(opportunity_id: str) -> ShellOpportunitySummary:
    base = OPPORTUNITY_BY_ID.get(opportunity_id)
    if base is None:
        raise HTTPException(status_code=404, detail="opportunity not found")

    effective = _effective_opportunity(base)
    with _RESEARCH_LOCK:
        record = _latest_record_unlocked(opportunity_id)
        research_case_id = record.research_case_id if record is not None else None

    return ShellOpportunitySummary(
        **effective.model_dump(),
        latest_research_case_id=research_case_id,
    )


@router.get("/opportunities", response_model=ShellOpportunityList)
async def list_shell_opportunities() -> ShellOpportunityList:
    """Transitional S2 read adapter over the deterministic Harness spike state."""
    items = [_shell_opportunity(item.opportunity_id) for item in OPPORTUNITIES]
    return ShellOpportunityList(items=items, count=len(items))


@router.get("/opportunities/{opportunity_id}", response_model=ShellOpportunitySummary)
async def inspect_shell_opportunity(opportunity_id: str) -> ShellOpportunitySummary:
    """Return the effective Opportunity plus its latest business Research Case id."""
    return _shell_opportunity(opportunity_id)
