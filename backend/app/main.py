"""
ParkSight AI — FastAPI main application (Phase 2 — Multi-Role Platform).
"""
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# ── Add /app to sys.path so 'ml' package resolves ────────────────────────────
sys.path.insert(0, "/app")

# ── Imports ───────────────────────────────────────────────────────────────────
from app.auth.router import router as auth_router
from app.routers import (
    admin, overview, heatmap, congestion, queue,
    temporal, routes, forecast, anomaly,
    offenders, scita, kpis, zones,
    reports, officers, notifications, speed, ml_predict,
)

app = FastAPI(
    title="ParkSight AI API",
    description="Multi-role traffic enforcement platform API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file uploads ───────────────────────────────────────────────────────
UPLOAD_DIR = "/app/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
# Original analytics
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

# Phase 2
app.include_router(auth_router)
app.include_router(reports.router)
app.include_router(officers.router)
app.include_router(notifications.router)
app.include_router(speed.router)
app.include_router(ml_predict.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {
        "service": "ParkSight AI API",
        "version": "2.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
