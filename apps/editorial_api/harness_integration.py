from __future__ import annotations

import os
from dataclasses import dataclass
from threading import Lock
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from apps.editorial_api.spike_harness import _RESEARCH, _RESEARCH_LOCK

router = APIRouter(prefix="/api/v1/integrations/harness", tags=["harness-integration"])

_HARNESS_WEB_BASE_URL = os.getenv("HARNESS_WEB_BASE_URL", "http://127.0.0.1:3080")
_EDITORIAL_BROWSER_API_BASE_URL = os.getenv(
    "EDITORIAL_BROWSER_API_BASE_URL",
    "http://127.0.0.1:18000",
)
_HARNESS_TRANSPORT = os.getenv("HARNESS_INTEGRATION_TRANSPORT", "embedded")
_ALLOWED_TRANSPORTS = {"embedded", "same_tab", "separate_tab"}


class HarnessLaunchRequest(BaseModel):
    intent: Literal["research", "agent"]
    opportunity_id: str | None = None
    research_case_id: str | None = None
    return_path: str


class HarnessLaunchDescriptor(BaseModel):
    launch_id: str
    intent: Literal["research", "agent"]
    opportunity_id: str | None = None
    research_case_id: str | None = None
    harness_session_id: str | None = None
    surface_url: str
    return_url: str
    transport: str
    bootstrap_required: bool = False


class HarnessSessionBindRequest(BaseModel):
    harness_session_id: str = Field(min_length=1)


class HarnessBootstrapCompleteRequest(BaseModel):
    harness_session_id: str = Field(min_length=1)


@dataclass
class _LaunchRecord:
    launch_id: str
    intent: Literal["research", "agent"]
    opportunity_id: str | None
    research_case_id: str | None
    return_url: str


_LAUNCH_LOCK = Lock()
_LAUNCHES: dict[str, _LaunchRecord] = {}
_RESEARCH_SESSION_BY_CASE: dict[str, str] = {}
_BOOTSTRAPPED_RESEARCH_SESSIONS: set[tuple[str, str]] = set()


def _validate_return_path(return_path: str) -> str:
    parsed = urlsplit(return_path)
    if parsed.scheme or parsed.netloc or not parsed.path.startswith("/") or parsed.path.startswith("//"):
        raise HTTPException(status_code=400, detail="return_path must be a local product path")

    allowed_roots = (
        "/today",
        "/opportunities",
        "/research",
        "/programming",
        "/creation",
        "/publication",
        "/performance",
        "/knowledge",
        "/manage/acquisition",
        "/manage/configuration",
        "/manage/system",
    )
    if not any(parsed.path == root or parsed.path.startswith(f"{root}/") for root in allowed_roots):
        raise HTTPException(status_code=400, detail="return_path is outside the product route contract")
    return return_path


def _research_opportunity_id(research_case_id: str) -> str:
    # S4 still runs on the transitional in-memory Research fixture. This is
    # integration metadata only; PostgreSQL remains the target canonical store.
    with _RESEARCH_LOCK:
        record = _RESEARCH.get(research_case_id)
        if record is None:
            raise HTTPException(status_code=404, detail="research case not found")
        return record.opportunity_id


def _surface_url(launch_id: str) -> str:
    parsed = urlsplit(_HARNESS_WEB_BASE_URL)
    query = parse_qsl(parsed.query, keep_blank_values=True)
    query.extend(
        (
            ("editorial_embed", "research"),
            ("editorial_launch", launch_id),
            ("editorial_api_base", _EDITORIAL_BROWSER_API_BASE_URL),
        )
    )
    path = parsed.path or "/"
    return urlunsplit((parsed.scheme, parsed.netloc, path, urlencode(query), parsed.fragment))


def _transport() -> str:
    if _HARNESS_TRANSPORT not in _ALLOWED_TRANSPORTS:
        raise HTTPException(status_code=500, detail="invalid Harness integration transport")
    return _HARNESS_TRANSPORT


def _descriptor(record: _LaunchRecord) -> HarnessLaunchDescriptor:
    session_id: str | None = None
    bootstrap_required = False
    if record.research_case_id is not None:
        session_id = _RESEARCH_SESSION_BY_CASE.get(record.research_case_id)
        if session_id is not None:
            bootstrap_required = (
                record.research_case_id,
                session_id,
            ) not in _BOOTSTRAPPED_RESEARCH_SESSIONS

    return HarnessLaunchDescriptor(
        launch_id=record.launch_id,
        intent=record.intent,
        opportunity_id=record.opportunity_id,
        research_case_id=record.research_case_id,
        harness_session_id=session_id,
        surface_url=_surface_url(record.launch_id),
        return_url=record.return_url,
        transport=_transport(),
        bootstrap_required=bootstrap_required,
    )


def _launch_or_404(launch_id: str) -> _LaunchRecord:
    record = _LAUNCHES.get(launch_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Harness launch not found")
    return record


@router.post("/launches", response_model=HarnessLaunchDescriptor, status_code=201)
async def create_harness_launch(payload: HarnessLaunchRequest) -> HarnessLaunchDescriptor:
    return_url = _validate_return_path(payload.return_path)
    opportunity_id = payload.opportunity_id

    if payload.intent == "research":
        if payload.research_case_id is None:
            raise HTTPException(status_code=422, detail="research_case_id is required for research launch")
        resolved_opportunity_id = _research_opportunity_id(payload.research_case_id)
        if opportunity_id is not None and opportunity_id != resolved_opportunity_id:
            raise HTTPException(status_code=409, detail="opportunity_id does not match research case")
        opportunity_id = resolved_opportunity_id

    launch_id = f"hl_{uuid4().hex[:16]}"
    record = _LaunchRecord(
        launch_id=launch_id,
        intent=payload.intent,
        opportunity_id=opportunity_id,
        research_case_id=payload.research_case_id,
        return_url=return_url,
    )
    with _LAUNCH_LOCK:
        _LAUNCHES[launch_id] = record
        return _descriptor(record)


@router.get("/launches/{launch_id}", response_model=HarnessLaunchDescriptor)
async def get_harness_launch(launch_id: str) -> HarnessLaunchDescriptor:
    with _LAUNCH_LOCK:
        return _descriptor(_launch_or_404(launch_id))


@router.post("/launches/{launch_id}/session", response_model=HarnessLaunchDescriptor)
async def bind_harness_session(
    launch_id: str,
    payload: HarnessSessionBindRequest,
) -> HarnessLaunchDescriptor:
    with _LAUNCH_LOCK:
        record = _launch_or_404(launch_id)
        if record.intent != "research" or record.research_case_id is None:
            raise HTTPException(status_code=409, detail="launch does not own a research case")
        _RESEARCH_SESSION_BY_CASE[record.research_case_id] = payload.harness_session_id
        return _descriptor(record)


@router.post("/launches/{launch_id}/bootstrap-complete", response_model=HarnessLaunchDescriptor)
async def mark_harness_bootstrap_complete(
    launch_id: str,
    payload: HarnessBootstrapCompleteRequest,
) -> HarnessLaunchDescriptor:
    with _LAUNCH_LOCK:
        record = _launch_or_404(launch_id)
        if record.intent != "research" or record.research_case_id is None:
            raise HTTPException(status_code=409, detail="launch does not own a research case")
        bound_session = _RESEARCH_SESSION_BY_CASE.get(record.research_case_id)
        if bound_session != payload.harness_session_id:
            raise HTTPException(status_code=409, detail="bootstrap session is not the bound session")
        _BOOTSTRAPPED_RESEARCH_SESSIONS.add((record.research_case_id, payload.harness_session_id))
        return _descriptor(record)
