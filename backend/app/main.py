"""
ParkSight AI — FastAPI main application.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    overview, heatmap, congestion, queue,
    temporal, routes, forecast, anomaly,
    offenders, scita, kpis, zones,
)

app = FastAPI(
    title="ParkSight AI API",
    description="Backend API for ParkSight AI parking violation analytics platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS: allow all origins for local dev ────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(overview.router)
app.include_router(heatmap.router)
app.include_router(congestion.router)
app.include_router(queue.router)
app.include_router(temporal.router)
app.include_router(routes.router)
app.include_router(forecast.router)
app.include_router(anomaly.router)
app.include_router(offenders.router)
app.include_router(scita.router)
app.include_router(kpis.router)
app.include_router(zones.router)


@app.get("/")
async def root():
    return {
        "service": "ParkSight AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
