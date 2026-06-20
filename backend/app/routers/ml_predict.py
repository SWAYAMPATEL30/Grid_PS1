"""ML Prediction endpoints."""
from fastapi import APIRouter, Query
from ml.predict import predict_violation_count, predict_hotspot_risk, get_meta

router = APIRouter(prefix="/api/ml", tags=["ml"])

@router.get("/predict-count")
async def predict_count(
    station: str = Query(..., description="Police station name"),
    hour: int = Query(..., ge=0, le=23),
    day_of_week: int = Query(..., ge=0, le=6, description="0=Monday, 6=Sunday"),
    month: int = Query(6, ge=1, le=12),
):
    """Predict how many violations will occur at a station in the given hour."""
    return predict_violation_count(station, hour, day_of_week, month)

@router.get("/predict-hotspot")
async def predict_hotspot(
    junction: str = Query(..., description="Junction name"),
    hour: int = Query(..., ge=0, le=23),
    day_of_week: int = Query(1, ge=0, le=6),
    vehicle_type: str = Query("CAR"),
):
    """Predict whether a junction will become a hotspot."""
    return predict_hotspot_risk(junction, hour, day_of_week, vehicle_type)

@router.get("/meta")
async def get_model_meta():
    """Returns available stations, junctions, and vehicle types for model inputs."""
    return get_meta()
