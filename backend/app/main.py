"""
ParkSight AI — FastAPI main application.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    overview, heatmap, congestion, queue,
    temporal, routes, forecast, anomaly,
    offenders, scita, kpis, zones,
)
from app.ml.predictor import ml

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup: load ML model once ──────────────────────────────────────────
    logger.info("Loading XGBoost congestion model...")
    ml.load()
    if ml.is_loaded:
        logger.info("✅ ML model ready")
    else:
        logger.warning("⚠️  ML model not loaded — rule-based fallback active")
    yield
    # ── Shutdown ─────────────────────────────────────────────────────────────
    logger.info("ParkSight API shutting down")


app = FastAPI(
    title="ParkSight AI API",
    description="Backend API for ParkSight AI parking violation analytics platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
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
        "version": "2.0.0",
        "docs": "/docs",
        "status": "running",
        "ml_model": "loaded" if ml.is_loaded else "fallback (rule-based)",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "ml_model_loaded": ml.is_loaded,
    }


@app.get("/api/ml/status")
async def ml_status():
    """Check ML model status and stats."""
    import json, os
    stats_path = os.path.join(os.path.dirname(__file__), "ml", "model_stats.json")
    stats = {}
    if os.path.exists(stats_path):
        with open(stats_path) as f:
            stats = json.load(f)
    return {
        "model_loaded": ml.is_loaded,
        "model_type": "XGBoost Regression",
        "stats": stats,
    }
