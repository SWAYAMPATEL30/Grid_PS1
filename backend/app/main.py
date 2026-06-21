"""
ParkSight AI — FastAPI main application (Phase 2 — Multi-Role Platform).
"""
import logging
import os
import sys
from contextlib import asynccontextmanager
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


# ── Environment ──────────────────────────────────────────────────────────────
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PROD = ENVIRONMENT == "production"

app = FastAPI(
    title="ParkSight AI API",
    description="Multi-role traffic enforcement platform API (Powered by XGBoost ML)",
    version="2.0.0",
    # Hide docs in production for security
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
# In production, use allowed origins. If none provided, allow railway subdomains dynamically.
if _raw_origins:
    ALLOWED_ORIGINS = [o.strip().rstrip('/') for o in _raw_origins.split(",") if o.strip()]
else:
    # Safe default for Railway deployments
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "https://respectful-fascination-production.up.railway.app",
        "https://respectful-fascination-production-afbf.up.railway.app"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.railway\.app",
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
