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


class ResearchEvidence(BaseModel):
    evidence_id: str
    claim: str
    stance: str
    source_title: str
    source_type: str
    locator: str
    summary: str
    confidence: str


class ResearchUnknown(BaseModel):
    unknown_id: str
    question: str
    status: str


class ResearchResult(BaseModel):
    research_case_id: str
    opportunity_id: str
    goal: str
    status: str
    result_kind: str
    evidence_count: int = Field(ge=0)
    open_unknown_count: int = Field(ge=0)
    evidence: list[ResearchEvidence]
    unknowns: list[ResearchUnknown]
    conclusion: str


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
    completed: bool = False


_RESEARCH: dict[str, _ResearchRecord] = {}
_RESEARCH_LOCK = Lock()

_RESEARCH_STAGES = (
    ("queued", "queued", 0, 0, "研究任务已创建，等待开始。", 0, 2),
    ("running", "primary_sources", 25, 1, "正在获取主要来源与原始资料。", 1, 2),
    ("running", "contradictions", 55, 2, "已获取主要来源，正在补充反方证据。", 2, 2),
    ("running", "unknowns_and_materials", 80, 3, "正在整理未知项与可视化素材可得性。", 3, 1),
    ("completed", "completed", 100, 4, "研究完成：新增证据已整理，仍保留 1 个未知项。", 4, 1),
)


def _latest_record_unlocked(opportunity_id: str) -> _ResearchRecord | None:
    for record in reversed(tuple(_RESEARCH.values())):
        if record.opportunity_id == opportunity_id:
            return record
    return None


def _effective_opportunity(base: OpportunitySummary) -> OpportunitySummary:
    with _RESEARCH_LOCK:
        record = _latest_record_unlocked(base.opportunity_id)
        if record is None:
            return base
        completed = record.completed

    return base.model_copy(
        update={
            "research_status": "completed" if completed else "running",
            "evidence_state": EvidenceState(
                open_unknown_count=1 if completed else base.evidence_state.open_unknown_count
            ),
            "production_readiness": "high" if completed else base.production_readiness,
        }
    )


def _mock_research_result(record: _ResearchRecord) -> ResearchResult:
    if record.opportunity_id == "opp_dishwasher_water":
        evidence = [
            ResearchEvidence(
                evidence_id="ev_dishwasher_01",
                claim="在满载并使用节能程序时，现代洗碗机更可能形成较低的单次用水量。",
                stance="supporting",
                source_title="Spike 模拟证据 A：满载节能程序对照",
                source_type="deterministic_mock",
                locator="mock://research/dishwasher/full-load-eco",
                summary="用于验证 Evidence 契约：满载与节能模式是比较机器洗和手洗时必须显式控制的条件变量。",
                confidence="high",
            ),
            ResearchEvidence(
                evidence_id="ev_dishwasher_02",
                claim="手洗是否省水高度依赖水龙头使用方式，持续流水会显著改变比较结果。",
                stance="supporting",
                source_title="Spike 模拟证据 B：手洗行为变量",
                source_type="deterministic_mock",
                locator="mock://research/dishwasher/handwash-behavior",
                summary="用于验证 Evidence 契约：满槽清洗、间歇开水与持续流水不能被视为同一种手洗条件。",
                confidence="high",
            ),
            ResearchEvidence(
                evidence_id="ev_dishwasher_03",
                claim="半负载运行并叠加长时间预冲洗，会削弱甚至反转洗碗机的节水优势。",
                stance="contradicting",
                source_title="Spike 模拟反证：半负载与预冲洗",
                source_type="deterministic_mock",
                locator="mock://research/dishwasher/pre-rinse-half-load",
                summary="用于验证 contradictory evidence：不能把“洗碗机一定省水”当作无条件结论。",
                confidence="medium",
            ),
            ResearchEvidence(
                evidence_id="ev_dishwasher_04",
                claim="地区水压、龙头流量、家庭装载习惯与机器代际会影响最终比较。",
                stance="context",
                source_title="Spike 模拟证据 D：地域与设备条件",
                source_type="deterministic_mock",
                locator="mock://research/dishwasher/context-variables",
                summary="用于验证 Context/Unknown 边界：结论应表达为条件化判断，而不是统一单值。",
                confidence="medium",
            ),
        ]
        unknowns = [
            ResearchUnknown(
                unknown_id="unk_dishwasher_cn_household",
                question="中国家庭真实使用场景下，不同水压、机型与手洗习惯的代表性对照数据是否足够？",
                status="open",
            )
        ]
        conclusion = (
            "Spike 模拟结论：在满载、使用节能模式、避免额外预冲洗，且对照的手洗方式存在持续流水时，"
            "洗碗机更可能省水；半负载、额外预冲洗或本身非常节水的手洗方式会缩小甚至反转优势。"
            "这里的 4 条证据均为确定性 Spike 模拟数据，仅用于验证 Research Result / Evidence / Unknown 契约，"
            "不代表真实外部研究结论。"
        )
    else:
        opportunity = OPPORTUNITY_BY_ID[record.opportunity_id]
        evidence = [
            ResearchEvidence(
                evidence_id=f"ev_{record.opportunity_id}_{index}",
                claim=f"围绕“{opportunity.headline}”的模拟研究证据 {index}。",
                stance="supporting" if index < 3 else "contradicting",
                source_title=f"Spike 模拟证据 {index}",
                source_type="deterministic_mock",
                locator=f"mock://research/{record.opportunity_id}/{index}",
                summary="确定性模拟结果，仅用于验证研究结果可消费契约与回放能力。",
                confidence="medium",
            )
            for index in range(1, 5)
        ]
        unknowns = [
            ResearchUnknown(
                unknown_id=f"unk_{record.opportunity_id}_01",
                question="仍需真实外部资料验证的一个关键问题。",
                status="open",
            )
        ]
        conclusion = "Spike 模拟结论：研究已形成可消费的 Evidence 与 Unknown 结构，但不代表真实外部事实。"

    return ResearchResult(
        research_case_id=record.research_case_id,
        opportunity_id=record.opportunity_id,
        goal=record.goal,
        status="completed",
        result_kind="deterministic_spike_mock",
        evidence_count=len(evidence),
        open_unknown_count=len(unknowns),
        evidence=evidence,
        unknowns=unknowns,
        conclusion=conclusion,
    )


@router.get("/opportunities", response_model=OpportunityList)
async def list_opportunities() -> OpportunityList:
    """Return the current effective mock read models for the Harness integration spike."""
    items = [_effective_opportunity(item) for item in OPPORTUNITIES]
    return OpportunityList(items=items, count=len(items))


@router.get("/opportunities/{opportunity_id}", response_model=OpportunitySummary)
async def inspect_opportunity(opportunity_id: str) -> OpportunitySummary:
    try:
        return _effective_opportunity(OPPORTUNITY_BY_ID[opportunity_id])
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
        if status == "completed":
            record.completed = True

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


@router.get("/research-cases/{research_case_id}/result", response_model=ResearchResult)
async def get_research_result(research_case_id: str) -> ResearchResult:
    """Return durable, consumable mock Evidence/Unknown output after the job completes."""
    with _RESEARCH_LOCK:
        record = _RESEARCH.get(research_case_id)
        if record is None:
            raise HTTPException(status_code=404, detail="research case not found")
        if not record.completed:
            raise HTTPException(status_code=409, detail="research case not completed")
        snapshot = _ResearchRecord(
            research_case_id=record.research_case_id,
            opportunity_id=record.opportunity_id,
            goal=record.goal,
            poll_count=record.poll_count,
            completed=record.completed,
        )

    return _mock_research_result(snapshot)
