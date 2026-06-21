// ─── Legacy types (kept for backward compat with existing pages) ─────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'officer' | 'dispatcher' | 'analyst';
  zone?: string;
  avatar?: string;
}

export type ViolationType = 'expired_meter' | 'no_parking' | 'handicap_violation' | 'fire_zone' | 'double_parking' | 'street_cleaning' | 'overtime_parking';
export type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ViolationStatus = 'reported' | 'under_review' | 'ticketed' | 'appealed' | 'resolved' | 'dismissed';

export interface Violation {
  id: string;
  licensePlate: string;
  vehicleType: string;
  location: { lat: number; lng: number; address: string; zone: string };
  violationType: ViolationType;
  severity: ViolationSeverity;
  status: ViolationStatus;
  timestamp: Date;
  photoUrl?: string;
  fine: number;
  officer?: string;
  notes?: string;
}

export interface HeatmapPoint { lat: number; lng: number; intensity: number }
export interface PatternAnalysis { licensePlate: string; violationCount: number; lastViolation: Date; riskScore: number; preferredZones: string[]; violationType: ViolationType }
export interface ForecastData { date: Date; predicted: number; confidence: number; actual?: number }
export interface Zone { id: string; name: string; coordinates: [number, number][]; enforcementHours: { start: number; end: number }; rules: string[]; violationCount?: number; complianceRate?: number }
export interface Appeal { id: string; violationId: string; licensePlate: string; status: 'submitted' | 'under_review' | 'approved' | 'denied'; reason: string; submittedDate: Date; reviewedDate?: Date; notes?: string }
export interface EnforcementTicket { id: string; violationId: string; officerId: string; issuedDate: Date; ticketNumber: string; amount: number; status: 'issued' | 'paid' | 'overdue' | 'contested' }
export interface Officer { id: string; name: string; zone: string; ticketsIssued: number; averageTicketValue: number; status: 'active' | 'break' | 'off_duty'; currentLocation?: { lat: number; lng: number } }
export interface ComplianceEntity { id: string; type: 'vehicle' | 'driver' | 'dashboard'; name: string; violationCount: number; complianceScore: number; lastViolation?: Date; tags?: string[] }
export interface RevenueData { date: Date; violationType: ViolationType; count: number; totalRevenue: number }
export interface FilterOptions { dateRange: { start: Date; end: Date }; zones: string[]; violationType?: ViolationType; severity?: ViolationSeverity; status?: ViolationStatus }
export interface ApiResponse<T> { data: T; error?: string; timestamp: number }
export interface PaginatedResponse<T> { items: T[]; total: number; page: number; pageSize: number }

// ─── ParkSight Real API Types ─────────────────────────────────────────────────

export interface KPIDeltas { violations_pct: number; hotspots_pct: number }
export interface OverviewKPIs {
  total_violations: number;
  active_hotspots: number;
  avg_resolution_lag_mins: number;
  delivery_risk_index: number;
  deltas: KPIDeltas;
}

export interface HourlyBucket {
  hour: number;
  wrong_parking: number;
  no_parking: number;
  main_road: number;
  other: number;
}

export interface VehicleSplit { vehicle_type: string; count: number; pct: number }
export interface TopHotspot { zone: string; score: number; violation_count: number }
export interface WorstLagStation { station: string; avg_lag_mins: number }

export interface RealHeatmapPoint { lat: number; lng: number; weight: number; count?: number }


export interface ZoneFeatureProps { zone_name: string; violation_count: number; density_per_km2: number; top_violation_type: string }
export interface ZoneFeature { type: string; geometry: Record<string, unknown>; properties: ZoneFeatureProps }
export interface ZoneFeatureCollection { type: string; features: ZoneFeature[] }

export interface CongestionBreakdown { violation_density: number; avg_open_duration_mins: number; road_weight: number; junction_flag: boolean }
export interface CongestionHistoryPoint { date: string; score: number }
export interface CongestionScore { zone: string; score: number; breakdown: CongestionBreakdown; label: string; history: CongestionHistoryPoint[] }
export interface ZoneCongestion { zone: string; score: number; label: string; lat: number; lon: number; violation_count: number }

export interface QueueZone {
  rank: number; zone: string; junction_name: string | null;
  score: number; open_violations: number; peak_hour: number;
  recommended_action: string; lat: number; lon: number;
}

export interface HourDayCell { day: number; hour: number; count: number }
export interface DailyTrend { date: string; count: number; approved: number; rejected: number }
export interface HourCount { hour: number; count: number }
export interface WeekdayWeekend { weekday: HourCount[]; weekend: HourCount[] }

export interface ForecastHotspot {
  zone: string; predicted_count: number; confidence: number; trend: string;
  lat?: number; lon?: number; risk_level?: string;
  feature_importance?: { hour_weight: number; historical_avg: number; day_of_week: number };
}
export interface ForecastTimelinePoint { datetime: string; predicted_count: number; lower_bound: number; upper_bound: number }

export interface AnomalyTimelinePoint { date: string; actual_count: number; expected_count: number; is_anomaly: boolean; z_score: number }
export interface AnomalyFeedItem { date: string; zone: string; expected: number; actual: number; z_score: number; magnitude: number; possible_cause: string; status: string }

export interface OffenderSummary { vehicle_number: string; vehicle_type: string | null; total_violations: number; distinct_zones: number; first_seen: string; last_seen: string; status: string }
export interface OffenderInsightType { vehicle_type: string; repeat_count: number; rate: number }
export interface OffenderInsights { by_type: OffenderInsightType[]; top_zones: { zone: string; count: number }[] }

export interface ScitaOverview { total_sent: number; total_pct: number; avg_dispatch_delay_mins: number; top_stations: { station: string; count: number; pct: number }[] }
export interface ScitaByStation { station: string; sent: number; not_sent: number; pct_sent: number }
export interface ScitaTimeline { date: string; sent_count: number; total_count: number; pct: number }
export interface ScitaJunction { junction_name: string; lat: number; lon: number; violation_count: number; scita_pct: number }

export interface OfficerKPI { officer_id: string; station: string; cases_filed: number; approval_rate: number; avg_close_lag_mins: number; correction_rate: number; zones_covered: number; composite_score: number }
export interface StationKPI { station: string; total_cases: number; approval_rate: number; avg_lag: number; correction_rate: number }

export interface ZoneListItem { zone_id: string; zone_name: string; total_violations: number; avg_severity: number; lat?: number; lng?: number }
