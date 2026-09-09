import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.editorial_api.harness_integration import router as harness_integration_router
from apps.editorial_api.shell_spike import router as shell_spike_router
from apps.editorial_api.spike_harness import router as harness_spike_router

app = FastAPI(title="AI Editorial Desk Next", version="0.0.0")

_harness_browser_origins = [
    origin.strip()
    for origin in os.getenv(
        "HARNESS_BROWSER_ORIGINS",
        "http://127.0.0.1:3080,http://localhost:3080",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_harness_browser_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["accept", "content-type"],
)

app.include_router(harness_spike_router)
app.include_router(shell_spike_router)
app.include_router(harness_integration_router)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    """Architecture-baseline health endpoint only."""
    return {"status": "ok", "phase": "architecture-baseline-v1"}
