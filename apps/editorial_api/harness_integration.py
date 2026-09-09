from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from urllib.parse import urlencode
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from apps.editorial_api.spike_harness import (
    OPPORTUNITY_BY_ID,
    _RESEARCH,
    _RESEARCH_LOCK,
)

router = APIRouter(prefix="/api/v1/integrations/harness", tags=["harness-integration"])

HARNESS_PUBLIC_BASE_URL = os.getenv("HARNESS_PUBLIC_BASE_URL", "http://127.0.0.1:3080").rstrip("/")
EDITORIAL_BROWSER_API_BASE_URL = os.getenv(
    "EDITORIAL_BROWSER_API_BASE_URL", "http://127.0.0.1:18000"
).rstrip("/")
HARNESS_WORKSPACE_CWD = os.getenv("HARNESS_WORKSPACE_CWD", str(Path.cwd()))


class HarnessLaunchRequest(BaseModel):
    intent: str = Field(pattern="^research$")
    research_case_id: str = Field(min_length=1)
    opportunity_id: str = Field(min_length=1)
    return_path: str = Field(min_length=1)
    presentation: str = "editorial-research"


class HarnessLaunchBindingRequest(BaseModel):
    harness_session_id: str = Field(min_length=1)


class HarnessLaunchDescriptor(BaseModel):
    launch_id: str
    intent: str
    research_case_id: str
    opportunity_id: str
    harness_session_id: str | None
    surface_url: str
    return_url: str
    transport: str
    presentation: str


class HarnessLaunchContext(HarnessLaunchDescriptor):
    workspace_cwd: str
    session_title: str
    initial_prompt: str


@dataclass
class _LaunchRecord:
    launch_id: str
    research_case_id: str
    opportunity_id: str
    return_path: str
    presentation: str
    harness_session_id: str | None = None


_LAUNCHES: dict[str, _LaunchRecord] = {}
_SESSION_BY_RESEARCH_CASE: dict[str, str] = {}
_LAUNCH_LOCK = Lock()


def _safe_return_path(value: str) -> str:
    if not value.startswith("/") or value.startswith("//"):
        raise HTTPException(status_code=422, detail="return_path must be an internal product route")
    return value


def _research_record(research_case_id: str, opportunity_id: str):
    with _RESEARCH_LOCK:
        record = _RESEARCH.get(research_case_id)
        if record is None:
            raise HTTPException(status_code=404, detail="research case not found")
        if record.opportunity_id != opportunity_id:
            raise HTTPException(status_code=409, detail="research case does not belong to opportunity")
        return record.research_case_id, record.opportunity_id, record.goal, record.completed


def _surface_url(launch_id: str) -> str:
    query = urlencode(
        {
            "editorial_launch": launch_id,
            "editorial_api": EDITORIAL_BROWSER_API_BASE_URL,
        }
    )
    return f"{HARNESS_PUBLIC_BASE_URL}/?{query}"


def _descriptor(record: _LaunchRecord) -> HarnessLaunchDescriptor:
    return HarnessLaunchDescriptor(
        launch_id=record.launch_id,
        intent="research",
        research_case_id=record.research_case_id,
        opportunity_id=record.opportunity_id,
        harness_session_id=record.harness_session_id,
        surface_url=_surface_url(record.launch_id),
        return_url=record.return_path,
        transport="separate_tab",
        presentation=record.presentation,
    )


def _context(record: _LaunchRecord) -> HarnessLaunchContext:
    _, _, goal, completed = _research_record(record.research_case_id, record.opportunity_id)
    opportunity = OPPORTUNITY_BY_ID[record.opportunity_id]
    state_instruction = (
        f'该 Research Case 已完成。先调用 inspect_editorial_opportunity 查看当前机会状态，'
        f'然后调用 get_editorial_research_result，research_case_id="{record.research_case_id}"，读取 Evidence、Unknown 与结论。'
        if completed
        else (
            f'该 Research Case 尚未完成。先调用 inspect_editorial_opportunity 查看当前机会状态，然后调用 '
            f'resume_editorial_research，research_case_id="{record.research_case_id}"，继续这个已有 Research Case。'
            "后台任务完成后再调用 get_editorial_research_result 读取结构化结果。"
        )
    )
    initial_prompt = (
        "你正在从 AI Editorial Desk Web Shell 进入一个已有的 Research Case。\n"
        f"Research Case: {record.research_case_id}\n"
        f"Opportunity ID: {record.opportunity_id}\n"
        f"研究目标: {goal}\n\n"
        "不要新建另一个 Research Case，不要读取项目源码。"
        f"{state_instruction}\n"
        "请把 Editorial API 中的 Research Case / Evidence / Unknown 当作业务事实源；Harness Session 只承担 Agent / Tool / Job / Replay。"
    )
    base = _descriptor(record)
    return HarnessLaunchContext(
        **base.model_dump(),
        workspace_cwd=HARNESS_WORKSPACE_CWD,
        session_title=f"研究 · {opportunity.headline}",
        initial_prompt=initial_prompt,
    )


@router.post("/launches", response_model=HarnessLaunchDescriptor, status_code=201)
async def create_harness_launch(payload: HarnessLaunchRequest) -> HarnessLaunchDescriptor:
    _safe_return_path(payload.return_path)
    _research_record(payload.research_case_id, payload.opportunity_id)

    launch_id = f"hl_{uuid4().hex[:12]}"
    with _LAUNCH_LOCK:
        record = _LaunchRecord(
            launch_id=launch_id,
            research_case_id=payload.research_case_id,
            opportunity_id=payload.opportunity_id,
            return_path=payload.return_path,
            presentation=payload.presentation,
            harness_session_id=_SESSION_BY_RESEARCH_CASE.get(payload.research_case_id),
        )
        _LAUNCHES[launch_id] = record
    return _descriptor(record)


@router.get("/launches/{launch_id}", response_model=HarnessLaunchContext)
async def get_harness_launch(launch_id: str) -> HarnessLaunchContext:
    with _LAUNCH_LOCK:
        record = _LAUNCHES.get(launch_id)
    if record is None:
        raise HTTPException(status_code=404, detail="harness launch not found")
    return _context(record)


@router.post("/launches/{launch_id}/binding", response_model=HarnessLaunchDescriptor)
async def bind_harness_launch(
    launch_id: str, payload: HarnessLaunchBindingRequest
) -> HarnessLaunchDescriptor:
    with _LAUNCH_LOCK:
        record = _LAUNCHES.get(launch_id)
        if record is None:
            raise HTTPException(status_code=404, detail="harness launch not found")
        record.harness_session_id = payload.harness_session_id
        _SESSION_BY_RESEARCH_CASE[record.research_case_id] = payload.harness_session_id
        snapshot = _LaunchRecord(**record.__dict__)
    return _descriptor(snapshot)
