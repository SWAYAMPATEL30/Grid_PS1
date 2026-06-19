"""
Congestion scoring service.
Computes a 0-100 score for a zone based on violation density,
average resolution lag, road weight, and severity.
"""
from __future__ import annotations
import math
from typing import Optional

SEVERITY_WEIGHTS: dict[str, float] = {
    "DOUBLE PARKING": 5.0,
    "PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC": 4.0,
    "PARKING IN A MAIN ROAD": 4.0,
    "PARKING ON FOOTPATH": 3.0,
    "PARKING NEAR ROAD CROSSING": 3.0,
    "WRONG PARKING": 2.0,
    "NO PARKING": 2.0,
    "PARKING OPPOSITE TO ANOTHER PARKED VEHICLE": 3.0,
}

DEFAULT_SEVERITY = 1.5
RAW_MAX = 95.0  # calibrated 95th percentile; tuned after first data load


def get_severity_weight(violation_types: list[str] | None) -> float:
    """Return max severity weight from a list of violation type strings."""
    if not violation_types:
        return DEFAULT_SEVERITY
    weights = [SEVERITY_WEIGHTS.get(vt.upper().strip(), DEFAULT_SEVERITY) for vt in violation_types]
    return max(weights) if weights else DEFAULT_SEVERITY


def zone_area_km2(lats: list[float], lons: list[float]) -> float:
    """Approximate bounding-box area in km² for a set of points."""
    if not lats or not lons:
        return 1.0
    lat_range = max(lats) - min(lats)
    lon_range = max(lons) - min(lons)
    lat_km = lat_range * 111.0
    avg_lat = sum(lats) / len(lats)
    lon_km = lon_range * 111.0 * math.cos(math.radians(avg_lat))
    area = lat_km * lon_km
    return max(area, 0.01)  # floor at 10,000 m² to avoid /0


def compute_congestion_score(
    count: int,
    lats: list[float],
    lons: list[float],
    avg_lag: Optional[float],
    is_junction: bool,
    avg_severity: float,
    raw_max: float = RAW_MAX,
) -> float:
    """
    Compute congestion score (0–100) for a zone.

    Args:
        count: number of violations in zone
        lats/lons: list of coordinates (for area estimation)
        avg_lag: average resolution lag in minutes (None → 60)
        is_junction: whether the zone contains a junction
        avg_severity: mean severity weight
        raw_max: calibration maximum for normalization
    """
    area = zone_area_km2(lats, lons)
    density = count / area
    lag = avg_lag if avg_lag is not None else 60.0
    road_weight = 3.0 if is_junction else 1.5
    raw = density * (lag / 60.0) * road_weight * avg_severity
    return min(100.0, (raw / raw_max) * 100.0)


def score_label(score: float) -> str:
    if score >= 75:
        return "Critical"
    elif score >= 50:
        return "High"
    elif score >= 25:
        return "Medium"
    return "Low"


def recommended_action(score: float) -> str:
    if score > 80:
        return "Deploy 2 officers"
    elif score >= 60:
        return "CCTV challan"
    return "Standard patrol"


VEHICLE_IMPACT_MULTIPLIERS: dict[str, float] = {
    "LGV": 1.5,
    "TANKER": 1.5,
    "PRIVATE BUS": 1.5,
    "BUS": 1.3,
    "TRUCK": 1.4,
    "AUTO RICKSHAW": 1.1,
    "SCOOTER": 1.0,
    "MOTORCYCLE": 1.0,
    "CAR": 1.0,
}


def vehicle_impact_score(vehicle_type: str, violation_count: int) -> float:
    multiplier = VEHICLE_IMPACT_MULTIPLIERS.get(vehicle_type.upper().strip(), 1.0)
    return round(violation_count * multiplier, 2)
