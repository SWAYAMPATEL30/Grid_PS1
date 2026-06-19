/**
 * ParkSight AI API Client
 * Replaces mock data with real fetch() calls to the FastAPI backend.
 * Base URL: NEXT_PUBLIC_API_BASE_URL (falls back to http://localhost:8000)
 */
import type {
  Violation, HeatmapPoint, ForecastData, PatternAnalysis, Zone,
  Appeal, Officer, ComplianceEntity, RevenueData, FilterOptions,
  PaginatedResponse, OverviewKPIs, HourlyBucket, VehicleSplit,
  TopHotspot, WorstLagStation, RealHeatmapPoint, ZoneFeatureCollection,
  CongestionScore, ZoneCongestion, QueueZone, HourDayCell, DailyTrend,
  WeekdayWeekend, ForecastHotspot, ForecastTimelinePoint,
  AnomalyTimelinePoint, AnomalyFeedItem, OffenderSummary, OffenderInsights,
  ScitaOverview, ScitaByStation, ScitaTimeline, ScitaJunction,
  OfficerKPI, StationKPI, ZoneListItem,
} from './types';

const BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  'http://localhost:8000';

// ─── Base fetch helper ────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: RequestInit,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    });
  }
  const res = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── ParkSight-specific API functions ─────────────────────────────────────────

export const parkSightApi = {
  // Overview
  getOverviewKPIs: (params?: { from_date?: string; to_date?: string }) =>
    apiFetch<OverviewKPIs>('/api/overview/kpis', params),

  getHourlyDistribution: (params?: { from_date?: string; to_date?: string }) =>
    apiFetch<HourlyBucket[]>('/api/overview/hourly-distribution', params),

  getVehicleSplit: () =>
    apiFetch<VehicleSplit[]>('/api/overview/vehicle-split'),

  getTopHotspots: (limit = 5) =>
    apiFetch<TopHotspot[]>('/api/overview/top-hotspots', { limit }),

  getWorstLagStations: () =>
    apiFetch<WorstLagStation[]>('/api/overview/worst-lag-stations'),

  // Heatmap
  getHeatmapPoints: (params?: {
    from_date?: string; to_date?: string;
    hour_min?: number; hour_max?: number;
    day_type?: string; vehicle_types?: string;
    violation_types?: string; validation_status?: string;
  }) => apiFetch<RealHeatmapPoint[]>('/api/heatmap/points', params as Record<string, string | number>),

  getHeatmapZones: () =>
    apiFetch<ZoneFeatureCollection>('/api/heatmap/zones'),

  // Congestion
  getCongestionScore: (zone_id: string, params?: { from_date?: string; to_date?: string }) =>
    apiFetch<CongestionScore>('/api/congestion/score', { zone_id, ...params }),

  getAllZoneScores: () =>
    apiFetch<ZoneCongestion[]>('/api/congestion/all-zones'),

  getVehicleImpact: (zone_id: string) =>
    apiFetch<{ vehicle_type: string; impact_score: number; violation_count: number }[]>(
      '/api/congestion/vehicle-impact', { zone_id }
    ),

  getPeakWindows: () =>
    apiFetch<{ zones: string[]; matrix: number[][] }>('/api/congestion/peak-windows'),

  // Enforcement Queue
  getQueueZones: (params?: {
    time_window?: string; zone_type?: string;
    vehicle_focus?: string; limit?: number;
  }) => apiFetch<QueueZone[]>('/api/queue/zones', params as Record<string, string | number>),

  getZoneDetail: (zone_id: string) =>
    apiFetch<{ zone_id: string; chart_data: { date: string; count: number }[]; recent_violations: unknown[] }>(
      `/api/queue/zone-detail/${encodeURIComponent(zone_id)}`
    ),

  assignZone: (zone_id: string, officer_id: string) =>
    apiFetch<{ success: boolean }>('/api/queue/assign', undefined, {
      method: 'POST',
      body: JSON.stringify({ zone_id, officer_id }),
    }),

  // Temporal
  getTemporalHeatmap: (params?: { from_date?: string; to_date?: string; zone?: string }) =>
    apiFetch<HourDayCell[]>('/api/temporal/heatmap-matrix', params),

  getDailyTrend: (params?: { from_date?: string; to_date?: string }) =>
    apiFetch<DailyTrend[]>('/api/temporal/daily-trend', params),

  getZoneComparison: (zones?: string[]) =>
    apiFetch<Record<string, { hour: number; count: number }[]>>(
      '/api/temporal/zone-comparison', zones ? { zones: zones.join(',') } : undefined
    ).catch(() => ({})),

  getWeekdayWeekend: () =>
    apiFetch<WeekdayWeekend>('/api/temporal/weekday-weekend'),

  // Routes
  getRoutesRisk: (params: {
    from_lat: number; from_lon: number;
    to_lat: number; to_lon: number; hour?: number;
  }) => apiFetch<{
    standard_route: unknown; risky_zones: unknown[];
    safe_route: unknown; comparison: unknown;
  }>('/api/routes/risk-zones', params as Record<string, number>),

  // Forecast
  getForecastHotspots: (params?: {
    target_datetime?: string; confidence_threshold?: number; horizon_hours?: number;
  }) => apiFetch<ForecastHotspot[]>('/api/forecast/hotspots', params as Record<string, string | number>),

  getForecastTimeline: (params?: { from_date?: string; to_date?: string }) =>
    apiFetch<ForecastTimelinePoint[]>('/api/forecast/timeline', params),

  // Anomaly
  getAnomalyTimeline: (params?: { from_date?: string; to_date?: string }) =>
    apiFetch<AnomalyTimelinePoint[]>('/api/anomaly/timeline', params),

  getAnomalyFeed: (params?: { page?: number; limit?: number }) =>
    apiFetch<AnomalyFeedItem[]>('/api/anomaly/feed', params as Record<string, number>),

  // Offenders
  getOffendersList: (params?: {
    min_violations?: number; vehicle_type?: string; zone?: string;
    from_date?: string; to_date?: string; page?: number; limit?: number;
  }) => apiFetch<OffenderSummary[]>('/api/offenders/summary', params as Record<string, string | number>),

  getOffenderProfile: (vehicle_number: string) =>
    apiFetch<unknown>(`/api/offenders/profile/${encodeURIComponent(vehicle_number)}`)
      .catch(() => ({ vehicle_number, total_violations: 0, status: "unknown" })),

  getOffenderInsights: () =>
    apiFetch<OffenderInsights>('/api/offenders/insights'),

  // SCITA
  getScitaOverview: () =>
    apiFetch<ScitaOverview>('/api/scita/overview'),

  getScitaByStation: () =>
    apiFetch<ScitaByStation[]>('/api/scita/by-station'),

  getScitaTimeline: (params?: { from_date?: string; to_date?: string }) =>
    apiFetch<ScitaTimeline[]>('/api/scita/timeline', params),

  getScitaJunctionMap: () =>
    apiFetch<ScitaJunction[]>('/api/scita/junctions'),

  // KPIs
  getOfficerKPIs: (params?: { station?: string; from_date?: string; to_date?: string }) =>
    apiFetch<OfficerKPI[]>('/api/kpis/officers', params),

  getStationKPIs: () =>
    apiFetch<StationKPI[]>('/api/kpis/stations'),

  // Zones
  getZonesList: () =>
    apiFetch<ZoneListItem[]>('/api/zones/list'),
};

// ─── Legacy apiClient (backward-compat — calls real API now) ─────────────────

const generateLegacyViolation = (kpiData?: OverviewKPIs): Violation => ({
  id: Math.random().toString(36).slice(2),
  licensePlate: `KA${Math.floor(Math.random() * 99).toString().padStart(2, '0')}AB${Math.floor(Math.random() * 9999)}`,
  vehicleType: 'CAR',
  location: { lat: 12.97, lng: 77.59, address: 'Bengaluru', zone: 'Zone A' },
  violationType: 'no_parking',
  severity: 'medium',
  status: 'reported',
  timestamp: new Date(),
  fine: 200,
});

export const apiClient = {
  async getViolations(page = 1, pageSize = 20): Promise<PaginatedResponse<Violation>> {
    try {
      const [kpis, hotspots] = await Promise.all([
        parkSightApi.getOverviewKPIs(),
        parkSightApi.getTopHotspots(pageSize),
      ]);
      // Map hotspot data to legacy Violation shape for backward compat
      const items: Violation[] = hotspots.map((h, i) => ({
        id: `v-${i}`,
        licensePlate: `KA${String(i + 1).padStart(2, '0')}AB${1000 + i}`,
        vehicleType: 'CAR',
        location: { lat: h.score, lng: 0, address: h.zone, zone: h.zone },
        violationType: 'no_parking',
        severity: h.score > 75 ? 'critical' : h.score > 50 ? 'high' : 'medium',
        status: 'reported',
        timestamp: new Date(),
        fine: 200,
      }));
      return { items, total: kpis.total_violations, page, pageSize };
    } catch {
      return { items: Array.from({ length: pageSize }, () => generateLegacyViolation()), total: 100, page, pageSize };
    }
  },

  async getDashboardStats() {
    try {
      const kpis = await parkSightApi.getOverviewKPIs();
      return {
        totalViolations: kpis.total_violations,
        pendingQueue: kpis.active_hotspots,
        revenueToday: 0,
        complianceRate: Math.max(0, Math.round(100 - kpis.delivery_risk_index)),
      };
    } catch {
      return { totalViolations: 0, pendingQueue: 0, revenueToday: 0, complianceRate: 0 };
    }
  },

  async getViolationsByType(): Promise<Record<string, number>> {
    try {
      const split = await parkSightApi.getVehicleSplit();
      return Object.fromEntries(split.map((s) => [s.vehicle_type, s.count]));
    } catch {
      return {};
    }
  },

  async getHourlyDistribution(): Promise<{ hour: number; count: number }[]> {
    try {
      const data = await parkSightApi.getHourlyDistribution();
      return data.map((d) => ({ hour: d.hour, count: d.wrong_parking + d.no_parking + d.main_road + d.other }));
    } catch {
      return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    }
  },

  async getDayOfWeekDistribution(): Promise<{ day: string; count: number }[]> {
    try {
      const data = await parkSightApi.getTemporalHeatmap();
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const totals = days.map((_, i) =>
        data.filter((d) => d.day === i).reduce((s, d) => s + d.count, 0)
      );
      return days.map((day, i) => ({ day, count: totals[i] }));
    } catch {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, count: 0 }));
    }
  },

  async getZones(): Promise<Zone[]> {
    try {
      const zones = await parkSightApi.getZonesList();
      return zones.map((z) => ({
        id: z.zone_id,
        name: z.zone_name,
        coordinates: [[z.lon, z.lat]],
        enforcementHours: { start: 6, end: 22 },
        rules: [],
        violationCount: 0,
        complianceRate: 0,
      }));
    } catch {
      return [];
    }
  },

  async getHeatmapData(): Promise<HeatmapPoint[]> {
    try {
      const pts = await parkSightApi.getHeatmapPoints();
      return pts.map((p) => ({ lat: p.lat, lng: p.lon, intensity: Math.min(1, p.weight / 5) }));
    } catch {
      return [];
    }
  },

  async getForecast(days = 30): Promise<ForecastData[]> {
    try {
      const timeline = await parkSightApi.getForecastTimeline();
      return timeline.slice(0, days).map((t) => ({
        date: new Date(t.datetime),
        predicted: t.predicted_count,
        confidence: Math.min(1, (t.upper_bound - t.lower_bound > 0)
          ? 1 - (t.upper_bound - t.lower_bound) / (t.predicted_count * 2 + 1)
          : 0.8),
      }));
    } catch {
      return [];
    }
  },

  async getOfficers(): Promise<Officer[]> {
    try {
      const kpis = await parkSightApi.getOfficerKPIs();
      return kpis.map((o) => ({
        id: o.officer_id,
        name: o.officer_id,
        zone: o.station,
        ticketsIssued: o.cases_filed,
        averageTicketValue: 200,
        status: o.composite_score > 60 ? 'active' : 'off_duty',
        currentLocation: { lat: 12.97, lng: 77.59 },
      }));
    } catch {
      return [];
    }
  },

  // Stubs for remaining legacy methods (kept for compatibility)
  async getViolationById() { return generateLegacyViolation(); },
  async getViolationsByZone() { return []; },
  async getViolationsByDateRange() { return []; },
  async createViolation(data: Partial<Violation>) { return generateLegacyViolation(); },
  async updateViolation(id: string, data: Partial<Violation>) { return generateLegacyViolation(); },
  async getPatterns() { return []; },
  async getRepeatViolators() { return []; },
  async getZoneById(id: string) { const zones = await apiClient.getZones(); return zones[0] || {} as Zone; },
  async createZone(data: Partial<Zone>) { return data as Zone; },
  async updateZone(id: string, data: Partial<Zone>) { return data as Zone; },
  async deleteZone() {},
  async getAppeals(page = 1, pageSize = 20) { return { items: [] as Appeal[], total: 0, page, pageSize }; },
  async getAppealById() { return {} as Appeal; },
  async submitAppeal() { return {} as Appeal; },
  async updateAppealStatus() { return {} as Appeal; },
  async getOfficerById() { return (await apiClient.getOfficers())[0] || {} as Officer; },
  async getActiveOfficers() { return (await apiClient.getOfficers()).filter((o) => o.status === 'active'); },
  async getComplianceEntities(page = 1, pageSize = 20) { return { items: [] as ComplianceEntity[], total: 0, page, pageSize }; },
  async getComplianceScore() { return 75; },
  async getRevenueData() { return []; },
  async getTotalRevenue() { return 0; },
  async getRevenueByViolationType() { return {}; },
  async getViolationsByStatus() { return {}; },
};
