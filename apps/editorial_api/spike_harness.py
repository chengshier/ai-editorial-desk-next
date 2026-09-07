from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/spike", tags=["harness-spike"])


class SubjectSummary(BaseModel):
    id: str
    type: str
    name: str


class EvidenceState(BaseModel):
    open_unknown_count: int = Field(ge=0)


class OpportunitySummary(BaseModel):
    opportunity_id: str
    headline: str
    subject: SubjectSummary
    angle: str
    theme: str
    audience_promise: str
    why_now: str
    recommendation: str
    confidence: str
    value_highlights: list[str]
    research_status: str
    evidence_state: EvidenceState
    production_readiness: str


class OpportunityList(BaseModel):
    items: list[OpportunitySummary]
    count: int


class ResearchCreateRequest(BaseModel):
    opportunity_id: str
    goal: str | None = None


class ResearchCreated(BaseModel):
    research_case_id: str
    opportunity_id: str
    status: str
    progress_url: str


class ResearchProgress(BaseModel):
    research_case_id: str
    opportunity_id: str
    status: str
    stage: str
    progress: int = Field(ge=0, le=100)
    completed_steps: int = Field(ge=0)
    total_steps: int = Field(gt=0)
    message: str
    new_evidence_count: int = Field(ge=0)
    open_unknown_count: int = Field(ge=0)


OPPORTUNITIES: tuple[OpportunitySummary, ...] = (
    OpportunitySummary(
        opportunity_id="opp_dishwasher_water",
        headline="洗碗机真的可能比手洗更省水吗？",
        subject=SubjectSummary(id="subject_dishwasher", type="CONCEPT", name="洗碗机用水"),
        angle="父母认为洗碗机浪费水，事实可能刚好相反。",
        theme="代际生活方式与节约观念",
        audience_promise="看完能知道机器洗与手洗在什么条件下谁更省水。",
        why_now="家用洗碗机普及，节约与便利之间的代际讨论持续存在。",
        recommendation="today_main",
        confidence="high",
        value_highlights=["common-belief collision", "lived relevance", "social tension"],
        research_status="not_started",
        evidence_state=EvidenceState(open_unknown_count=2),
        production_readiness="medium",
    ),
    OpportunitySummary(
        opportunity_id="opp_job_scam_yes",
        headline="找工作时只回复一个 YES，也可能进入招聘骗局",
        subject=SubjectSummary(id="subject_job_scam", type="PHENOMENON", name="招聘诈骗"),
        angle="真正危险的第一步，有时不是点链接，而只是回应“我有兴趣”。",
        theme="就业焦虑如何被诈骗者利用",
        audience_promise="识别招聘骗局的前置信号，并知道哪些要求应立即警惕。",
        why_now="远程岗位与求职焦虑让招聘诈骗持续具备现实保护价值。",
        recommendation="today_main",
        confidence="high",
        value_highlights=["protective value", "ordinary-person relevance", "actionability"],
        research_status="not_started",
        evidence_state=EvidenceState(open_unknown_count=1),
        production_readiness="high",
    ),
    OpportunitySummary(
        opportunity_id="opp_wrigley_pivot",
        headline="一个公司的赠品，最后反而成了真正的主业",
        subject=SubjectSummary(id="subject_wrigley", type="ORGANIZATION", name="Wrigley"),
        angle="如果别人真正喜欢的是你的“赠品”，你会不会承认那才是自己的优势？",
        theme="个人价值、商业转向与被忽略的自身亮点",
        audience_promise="从一个商业反转故事重新理解“真正的优势可能不在原计划里”。",
        why_now="Evergreen 故事，不依赖热点也具有编辑潜力。",
        recommendation="evergreen",
        confidence="medium",
        value_highlights=["story value", "theme leverage", "self projection"],
        research_status="not_started",
        evidence_state=EvidenceState(open_unknown_count=2),
        production_readiness="medium",
    ),
)

OPPORTUNITY_BY_ID = {item.opportunity_id: item for item in OPPORTUNITIES}


@dataclass
class _ResearchRecord:
    research_case_id: str
    opportunity_id: str
    goal: str
    poll_count: int = 0


_RESEARCH: dict[str, _ResearchRecord] = {}
_RESEARCH_LOCK = Lock()

_RESEARCH_STAGES = (
    ("queued", "queued", 0, 0, "研究任务已创建，等待开始。", 0, 2),
    ("running", "primary_sources", 25, 1, "正在获取主要来源与原始资料。", 1, 2),
    ("running", "contradictions", 55, 2, "已获取主要来源，正在补充反方证据。", 2, 2),
    ("running", "unknowns_and_materials", 80, 3, "正在整理未知项与可视化素材可得性。", 3, 1),
    ("completed", "completed", 100, 4, "研究完成：新增证据已整理，仍保留 1 个未知项。", 4, 1),
)


@router.get("/opportunities", response_model=OpportunityList)
async def list_opportunities() -> OpportunityList:
    """Return stable mock read models for the Harness integration spike."""
    return OpportunityList(items=list(OPPORTUNITIES), count=len(OPPORTUNITIES))


@router.get("/opportunities/{opportunity_id}", response_model=OpportunitySummary)
async def inspect_opportunity(opportunity_id: str) -> OpportunitySummary:
    try:
        return OPPORTUNITY_BY_ID[opportunity_id]
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="opportunity not found") from exc


@router.post("/research-cases", response_model=ResearchCreated, status_code=201)
async def create_research_case(payload: ResearchCreateRequest) -> ResearchCreated:
    opportunity = OPPORTUNITY_BY_ID.get(payload.opportunity_id)
    if opportunity is None:
        raise HTTPException(status_code=404, detail="opportunity not found")

    research_case_id = f"rc_{uuid4().hex[:12]}"
    goal = payload.goal or f"补齐 {opportunity.headline} 的主要证据、反方证据与未知项。"
    with _RESEARCH_LOCK:
        _RESEARCH[research_case_id] = _ResearchRecord(
            research_case_id=research_case_id,
            opportunity_id=payload.opportunity_id,
            goal=goal,
        )

    return ResearchCreated(
        research_case_id=research_case_id,
        opportunity_id=payload.opportunity_id,
        status="queued",
        progress_url=f"/api/v1/spike/research-cases/{research_case_id}",
    )


@router.get("/research-cases/{research_case_id}", response_model=ResearchProgress)
async def get_research_progress(research_case_id: str) -> ResearchProgress:
    """Advance a deterministic mock state on each poll so Harness can exercise job progress."""
    with _RESEARCH_LOCK:
        record = _RESEARCH.get(research_case_id)
        if record is None:
            raise HTTPException(status_code=404, detail="research case not found")
        stage_index = min(record.poll_count, len(_RESEARCH_STAGES) - 1)
        if record.poll_count < len(_RESEARCH_STAGES) - 1:
            record.poll_count += 1

    status, stage, progress, completed_steps, message, evidence_count, unknown_count = (
        _RESEARCH_STAGES[stage_index]
    )
    return ResearchProgress(
        research_case_id=record.research_case_id,
        opportunity_id=record.opportunity_id,
        status=status,
        stage=stage,
        progress=progress,
        completed_steps=completed_steps,
        total_steps=4,
        message=message,
        new_evidence_count=evidence_count,
        open_unknown_count=unknown_count,
    )
