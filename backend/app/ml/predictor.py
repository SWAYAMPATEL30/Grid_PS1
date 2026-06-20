"""
ParkSight AI — ML Predictor
Loads the XGBoost model + encoders once at startup.
All routers import `ml` from this module and call ml.predict_score().
"""
from __future__ import annotations
import os
import logging
import numpy as np
import joblib

logger = logging.getLogger(__name__)

_BASE = os.path.join(os.path.dirname(__file__))

# ── Severity / impact maps (mirrors notebook) ─────────────────────────────────
SEVERITY_MAP: dict[str, float] = {
    "DOUBLE PARKING": 5.0,
    "PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC": 4.0,
    "PARKING IN A MAIN ROAD": 4.0,
    "PARKING ON FOOTPATH": 3.0,
    "PARKING NEAR ROAD CROSSING": 3.0,
    "WRONG PARKING": 2.0,
    "NO PARKING": 2.0,
    "PARKING OPPOSITE TO ANOTHER PARKED VEHICLE": 3.0,
}
DEFAULT_SEV = 1.5

VEHICLE_IMPACT: dict[str, float] = {
    "LGV": 1.5, "TANKER": 1.5, "PRIVATE BUS": 1.5, "BUS": 1.3,
    "TRUCK": 1.4, "AUTO RICKSHAW": 1.1, "MAXI-CAB": 1.2, "TEMPO": 1.3,
    "SCOOTER": 1.0, "MOTORCYCLE": 1.0, "CAR": 1.0, "JEEP": 1.0,
}

FEATURE_NAMES = [
    "hour_of_day", "day_of_week", "month", "is_weekend", "is_peak_hour",
    "lat", "lon", "density_500m", "is_junction", "station_encoded",
    "violation_encoded", "severity_weight", "num_violation_types",
    "vehicle_encoded", "vehicle_impact", "resolution_lag_mins",
    "is_approved", "sent_to_scita",
]


class MLPredictor:
    """Singleton wrapper around the trained XGBoost model."""

    def __init__(self) -> None:
        self._model = None
        self._le_violation = None
        self._le_station = None
        self._le_vehicle = None
        self._loaded = False

    def load(self) -> None:
        """Load model + encoders from disk. Called once on FastAPI startup."""
        try:
            self._model = joblib.load(os.path.join(_BASE, "congestion_model.pkl"))
            self._le_violation = joblib.load(os.path.join(_BASE, "le_violation.pkl"))
            self._le_station = joblib.load(os.path.join(_BASE, "le_station.pkl"))
            self._le_vehicle = joblib.load(os.path.join(_BASE, "le_vehicle.pkl"))
            self._loaded = True
            logger.info("✅ ML model loaded successfully from %s", _BASE)
        except Exception as exc:
            logger.warning("⚠️  ML model could not be loaded (%s). Falling back to rule-based scorer.", exc)
            self._loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    # ── Encode helpers ────────────────────────────────────────────────────────

    def _enc_violation(self, vtype: str) -> int:
        try:
            return int(self._le_violation.transform([vtype.upper().strip()])[0])
        except (ValueError, AttributeError):
            return 0

    def _enc_station(self, station: str) -> int:
        try:
            return int(self._le_station.transform([str(station).strip()])[0])
        except (ValueError, AttributeError):
            return 0

    def _enc_vehicle(self, vtype: str) -> int:
        try:
            return int(self._le_vehicle.transform([vtype.upper().strip()])[0])
        except (ValueError, AttributeError):
            return 0

    # ── Public API ────────────────────────────────────────────────────────────

    def predict_score(
        self,
        *,
        hour_of_day: int,
        day_of_week: int,
        month: int,
        lat: float,
        lon: float,
        density_500m: float,
        is_junction: bool,
        police_station: str,
        primary_violation: str,
        num_violation_types: int,
        vehicle_type: str,
        resolution_lag_mins: float,
        is_approved: bool = False,
        sent_to_scita: bool = False,
    ) -> float:
        """
        Predict congestion score (0–100) for a single violation record.
        Falls back to rule-based formula if model not loaded.
        """
        if not self._loaded:
            return self._rule_based_score(
                density_500m=density_500m,
                resolution_lag_mins=resolution_lag_mins,
                is_junction=is_junction,
                severity=SEVERITY_MAP.get(primary_violation.upper().strip(), DEFAULT_SEV),
                vehicle_impact=VEHICLE_IMPACT.get(vehicle_type.upper().strip(), 1.0),
            )

        is_weekend = 1 if day_of_week >= 5 else 0
        is_peak = 1 if (8 <= hour_of_day <= 10 or 17 <= hour_of_day <= 20) else 0
        severity = SEVERITY_MAP.get(primary_violation.upper().strip(), DEFAULT_SEV)
        v_impact = VEHICLE_IMPACT.get(vehicle_type.upper().strip(), 1.0)

        x = np.array([[
            hour_of_day, day_of_week, month, is_weekend, is_peak,
            lat, lon, density_500m, int(is_junction),
            self._enc_station(police_station),
            self._enc_violation(primary_violation),
            severity, num_violation_types,
            self._enc_vehicle(vehicle_type), v_impact,
            resolution_lag_mins,
            int(is_approved), int(sent_to_scita),
        ]], dtype=float)

        score = float(self._model.predict(x)[0])
        return float(np.clip(score, 0.0, 100.0))

    def predict_batch(self, records: list[dict]) -> list[float]:
        """
        Predict scores for a list of dicts. Each dict must have the same keys
        as predict_score(). Returns list of float scores in same order.
        """
        if not records:
            return []
        scores = [
            self.predict_score(
                hour_of_day=r.get("hour_of_day", 12),
                day_of_week=r.get("day_of_week", 0),
                month=r.get("month", 1),
                lat=r.get("lat", 12.97),
                lon=r.get("lon", 77.59),
                density_500m=r.get("density_500m", 5.0),
                is_junction=r.get("is_junction", False),
                police_station=r.get("police_station", "Unknown"),
                primary_violation=r.get("primary_violation", "WRONG PARKING"),
                num_violation_types=r.get("num_violation_types", 1),
                vehicle_type=r.get("vehicle_type", "CAR"),
                resolution_lag_mins=r.get("resolution_lag_mins", 60.0),
                is_approved=r.get("is_approved", False),
                sent_to_scita=r.get("sent_to_scita", False),
            )
            for r in records
        ]
        return scores

    @staticmethod
    def score_to_label(score: float) -> str:
        if score >= 75:
            return "Critical"
        elif score >= 50:
            return "High"
        elif score >= 25:
            return "Medium"
        return "Low"

    @staticmethod
    def score_to_action(score: float) -> str:
        if score > 80:
            return "Deploy 2 officers"
        elif score >= 60:
            return "CCTV challan"
        return "Standard patrol"

    @staticmethod
    def _rule_based_score(
        density_500m: float,
        resolution_lag_mins: float,
        is_junction: bool,
        severity: float,
        vehicle_impact: float,
        raw_max: float = 95.0,
    ) -> float:
        density = max(density_500m, 1)
        lag_factor = resolution_lag_mins / 60.0
        road_weight = 3.0 if is_junction else 1.5
        raw = density * lag_factor * road_weight * severity * vehicle_impact
        return min(100.0, (raw / raw_max) * 100.0)


# ── Module-level singleton ────────────────────────────────────────────────────
ml = MLPredictor()
