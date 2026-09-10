import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.editorial_api.harness_runtime import router as harness_runtime_router
from apps.editorial_api.scheduler import router as harness_scheduler_router
from apps.editorial_api.shell_spike import router as shell_spike_router
from apps.editorial_api.spike_harness import router as harness_spike_router

app = FastAPI(title="AI Editorial Desk Next", version="0.0.0")

_allowed_origins = [
    item.strip()
    for item in os.getenv(
        "EDITORIAL_CORS_ORIGINS",
        "http://127.0.0.1:3080",
    ).split(",")
    if item.strip()
]
if _allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

app.include_router(harness_spike_router)
app.include_router(shell_spike_router)
app.include_router(harness_runtime_router)
app.include_router(harness_scheduler_router)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    """Architecture-baseline health endpoint only."""
    return {"status": "ok", "phase": "architecture-baseline-v1"}
