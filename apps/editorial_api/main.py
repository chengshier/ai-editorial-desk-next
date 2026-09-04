from fastapi import FastAPI

from apps.editorial_api.spike_harness import router as harness_spike_router

app = FastAPI(title="AI Editorial Desk Next", version="0.0.0")
app.include_router(harness_spike_router)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    """Architecture-baseline health endpoint only."""
    return {"status": "ok", "phase": "architecture-baseline-v1"}
