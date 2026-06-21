"""
Pydantic response schemas for all ParkSight API endpoints.
All datetimes serialized as ISO 8601 UTC strings.
"""
from __future__ import annotations
from typing import Any, Optional
from pydantic import BaseModel


# ─── Overview ───────────────────────────────────────────────────────────────

class KPIDeltas(BaseModel):
    violations_pct: float
    hotspots_pct: float

class OverviewKPIs(BaseModel):
    total_violations: int
    active_hotspots: int
    avg_resolution_lag_mins: float
    delivery_risk_index: float
    deltas: KPIDeltas

class HourlyBucket(BaseModel):
    hour: int
    wrong_parking: int
    no_parking: int
    main_road: int
    other: int

class VehicleSplit(BaseModel):
    vehicle_type: str
    count: int
    pct: float

class TopHotspot(BaseModel):
    zone: str
    score: float
    violation_count: int

class WorstLagStation(BaseModel):
    station: str
    avg_lag_mins: float


# ─── Heatmap ────────────────────────────────────────────────────────────────

class RealHeatmapPoint(BaseModel):
    lat: float
    lng: float
    weight: float
    count: int

class ZoneFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: list[dict[str, Any]]


# ─── Congestion ─────────────────────────────────────────────────────────────

class CongestionScore(BaseModel):
    zone_id: str
    score: float
    violation_count: int
    avg_severity: float
    avg_lag_mins: float

class ZoneCongestion(BaseModel):
    zone_id: str
    zone_name: str
    score: float
    violation_count: int
    avg_severity: float


# ─── Enforcement Queue ───────────────────────────────────────────────────────

class QueueZone(BaseModel):
    zone_id: str
    zone_name: str
    priority_score: float
    violation_count: int
    avg_severity: float
    avg_lag_mins: Optional[float] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


# ─── Temporal ───────────────────────────────────────────────────────────────

class HourDayCell(BaseModel):
    hour: int
    day: int
    day_name: str
    count: int

class DailyTrend(BaseModel):
    date: str
    count: int
    avg_severity: float

class WeekdayWeekend(BaseModel):
    weekday_count: int
    weekend_count: int
    weekday_avg_severity: float
    weekend_avg_severity: float


# ─── Forecast ───────────────────────────────────────────────────────────────

class ForecastTimelinePoint(BaseModel):
    date: str
    actual: int
    forecast: float
    upper: float
    lower: float

class ForecastHotspot(BaseModel):
    zone: str
    predicted_count: int
    confidence: float
    risk_level: str


# ─── Anomaly ────────────────────────────────────────────────────────────────

class AnomalyTimelinePoint(BaseModel):
    date: str
    count: int
    z_score: float
    is_anomaly: bool
    expected: float

class AnomalyFeedItem(BaseModel):
    date: str
    station: str
    count: int
    severity: float
    anomaly_type: str


# ─── Offenders ──────────────────────────────────────────────────────────────

class OffenderSummary(BaseModel):
    vehicle_number: str
    total_violations: int
    unique_stations: int
    avg_severity: float
    last_seen: Optional[str] = None
    vehicle_type: Optional[str] = None
    risk_tier: str

class OffenderInsights(BaseModel):
    total_unique_vehicles: int
    repeat_offenders: int
    high_risk_vehicles: int


# ─── SCITA ──────────────────────────────────────────────────────────────────

class ScitaOverview(BaseModel):
    total_records: int
    sent_to_scita: int
    not_sent: int
    transmission_rate: float
    avg_transmission_delay_mins: float

class ScitaByStation(BaseModel):
    station: str
    total: int
    sent: int
    rate: float

class ScitaTimeline(BaseModel):
    date: str
    total: int
    sent: int
    not_sent: int

class ScitaJunction(BaseModel):
    junction: str
    total: int
    sent: int
    rate: float


# ─── KPIs ───────────────────────────────────────────────────────────────────

class OfficerKPI(BaseModel):
    officer_id: str
    station: Optional[str] = "Unknown"
    cases_filed: int = 0
    approval_rate: float = 0.0
    avg_close_lag_mins: float = 0.0
    correction_rate: float = 0.0
    zones_covered: int = 1
    composite_score: float = 0.0
    # Legacy fields
    total_violations: Optional[int] = None
    avg_severity: Optional[float] = None
    avg_lag_mins: Optional[float] = None
    scita_sent: Optional[int] = None

class StationKPI(BaseModel):
    station: str
    total_cases: int = 0
    approval_rate: float = 0.0
    avg_lag: float = 0.0
    correction_rate: float = 0.0
    # Legacy fields
    total_violations: Optional[int] = None
    avg_severity: Optional[float] = None
    avg_lag_mins: Optional[float] = None
    approval_rate_pct: Optional[float] = None
    scita_rate: Optional[float] = None


# ─── Zones ──────────────────────────────────────────────────────────────────

class ZoneListItem(BaseModel):
    zone_id: str
    zone_name: str
    total_violations: int
    lat: Optional[float] = None
    lng: Optional[float] = None
    avg_severity: float
