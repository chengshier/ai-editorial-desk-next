from fastapi import FastAPI

app = FastAPI(title="AI Editorial Desk Next", version="0.0.0")


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    """Architecture-baseline health endpoint only."""
    return {"status": "ok", "phase": "architecture-baseline-v1"}
