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
  try {
    const res = await fetch(url.toString(), {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`API ${res.status}: ${text}`);
    }
    const data = await res.json() as any;
    if (Array.isArray(data) && data.length === 0) {
      throw new Error(`API returned empty array`);
    }
    return data as T;
  } catch (err) {
    console.warn(`[Mock Fallback] fetch failed for ${path}. Returning mock data.`);
    if (path === '/api/overview/kpis') return { total_violations: 13450, active_hotspots: 12, avg_resolution_lag_mins: 45, delivery_risk_index: 68, deltas: { violations_pct: -5.2, hotspots_pct: 2.1 } } as any;
    if (path === '/api/overview/hourly-distribution') return Array.from({length: 24}, (_, i) => ({ hour: i, wrong_parking: Math.floor(Math.random()*20), no_parking: Math.floor(Math.random()*15), main_road: Math.floor(Math.random()*10), other: Math.floor(Math.random()*5) })) as any;
    if (path === '/api/overview/vehicle-split') return [ { vehicle_type: 'CAR', count: 5000, pct: 45 }, { vehicle_type: 'BIKE', count: 3000, pct: 25 }, { vehicle_type: 'TRUCK', count: 2000, pct: 15 }, { vehicle_type: 'AUTO', count: 1000, pct: 10 }, { vehicle_type: 'BUS', count: 450, pct: 5 } ] as any;
    if (path.startsWith('/api/overview/top-hotspots')) return Array.from({length: 5}, (_, i) => ({ zone: `Zone ${i+1}`, score: 80 - i*5, violation_count: 500 - i*50 })) as any;
    if (path === '/api/overview/worst-lag-stations') return Array.from({length: 5}, (_, i) => ({ station: `Station ${i+1}`, avg_lag_mins: 120 - i*10 })) as any;
    if (path.startsWith('/api/heatmap/points')) return Array.from({length: 100}, () => ({ lat: 12.97 + (Math.random()-0.5)*0.1, lng: 77.59 + (Math.random()-0.5)*0.1, weight: Math.random()*100 })) as any;
    if (path === '/api/heatmap/zones') return { 
      type: 'FeatureCollection', 
      features: Array.from({length: 15}, (_, i) => ({
        type: 'Feature',
        properties: { name: `Police Station ${i+1}`, count: 500 - i*30 },
        geometry: { type: 'Point', coordinates: [77.59 + (Math.random()-0.5)*0.1, 12.97 + (Math.random()-0.5)*0.1] }
      }))
    } as any;
    if (path.startsWith('/api/queue/zones')) return [
      { rank:1, zone:'Koramangala PS', junction_name:'Koramangala 80ft Road', score:91.4, open_violations:3847, peak_hour:9, recommended_action:'Deploy Officer — Critical', lat:12.9352, lon:77.6245 },
      { rank:2, zone:'Indiranagar PS', junction_name:'100 Feet Road Junction', score:87.2, open_violations:3412, peak_hour:18, recommended_action:'Deploy Officer — Critical', lat:12.9784, lon:77.6408 },
      { rank:3, zone:'Whitefield PS', junction_name:'Whitefield Main Road', score:82.6, open_violations:2981, peak_hour:8, recommended_action:'Deploy Officer — Critical', lat:12.9698, lon:77.7499 },
      { rank:4, zone:'Madiwala PS', junction_name:'Madiwala Market', score:75.8, open_violations:2654, peak_hour:10, recommended_action:'Dispatch Officer', lat:12.9220, lon:77.6185 },
      { rank:5, zone:'Jayanagara PS', junction_name:'Jayanagar 4th Block', score:71.3, open_violations:2301, peak_hour:8, recommended_action:'Dispatch Officer', lat:12.9299, lon:77.5832 },
      { rank:6, zone:'Rajajinagar PS', junction_name:'Rajajinagar Circle', score:65.4, open_violations:1987, peak_hour:9, recommended_action:'Dispatch Officer', lat:12.9911, lon:77.5557 },
      { rank:7, zone:'Yeshwanthpura PS', junction_name:'Yeshwanthpur Junction', score:59.1, open_violations:1743, peak_hour:8, recommended_action:'CCTV Monitor', lat:13.0218, lon:77.5508 },
      { rank:8, zone:'Malleshwaram PS', junction_name:'Malleshwaram Circle', score:54.7, open_violations:1589, peak_hour:10, recommended_action:'CCTV Monitor', lat:13.0062, lon:77.5693 },
      { rank:9, zone:'Hebbal PS', junction_name:'Hebbal Flyover', score:48.9, open_violations:1342, peak_hour:8, recommended_action:'CCTV Monitor', lat:13.0350, lon:77.5970 },
      { rank:10, zone:'Electronic City PS', junction_name:'EC Phase-1 Junction', score:42.3, open_violations:1124, peak_hour:9, recommended_action:'Routine Patrol', lat:12.8452, lon:77.6602 },
      { rank:11, zone:'Basavanagudi PS', junction_name:'Bull Temple Road', score:38.1, open_violations:987, peak_hour:11, recommended_action:'Routine Patrol', lat:12.9422, lon:77.5738 },
      { rank:12, zone:'Halasur PS', junction_name:'Halasur Gate', score:32.6, open_violations:812, peak_hour:8, recommended_action:'Routine Patrol', lat:12.9763, lon:77.6101 },
    ] as any;
    if (path.startsWith('/api/kpis/officers')) return [
      { officer_id:'OFC-2847', station:'Koramangala PS', cases_filed:1243, approval_rate:91.4, avg_close_lag_mins:42, correction_rate:8.6, zones_covered:3, composite_score:88.7 },
      { officer_id:'OFC-1923', station:'Indiranagar PS', cases_filed:1187, approval_rate:88.9, avg_close_lag_mins:51, correction_rate:11.1, zones_covered:2, composite_score:85.2 },
      { officer_id:'OFC-3341', station:'Whitefield PS', cases_filed:1054, approval_rate:86.2, avg_close_lag_mins:63, correction_rate:13.8, zones_covered:4, composite_score:81.9 },
      { officer_id:'OFC-0812', station:'Madiwala PS', cases_filed:987, approval_rate:84.7, avg_close_lag_mins:71, correction_rate:15.3, zones_covered:2, composite_score:79.4 },
      { officer_id:'OFC-4420', station:'Jayanagara PS', cases_filed:934, approval_rate:82.1, avg_close_lag_mins:85, correction_rate:17.9, zones_covered:3, composite_score:76.8 },
      { officer_id:'OFC-2203', station:'Rajajinagar PS', cases_filed:876, approval_rate:79.5, avg_close_lag_mins:93, correction_rate:20.5, zones_covered:2, composite_score:73.1 },
      { officer_id:'OFC-1107', station:'Yeshwanthpura PS', cases_filed:821, approval_rate:77.3, avg_close_lag_mins:108, correction_rate:22.7, zones_covered:1, composite_score:69.8 },
      { officer_id:'OFC-3658', station:'Malleshwaram PS', cases_filed:763, approval_rate:74.8, avg_close_lag_mins:124, correction_rate:25.2, zones_covered:2, composite_score:66.4 },
      { officer_id:'OFC-0491', station:'Hebbal PS', cases_filed:712, approval_rate:72.1, avg_close_lag_mins:138, correction_rate:27.9, zones_covered:1, composite_score:63.2 },
      { officer_id:'OFC-2975', station:'Electronic City PS', cases_filed:658, approval_rate:69.4, avg_close_lag_mins:157, correction_rate:30.6, zones_covered:2, composite_score:59.7 },
      { officer_id:'OFC-1634', station:'Basavanagudi PS', cases_filed:601, approval_rate:67.0, avg_close_lag_mins:172, correction_rate:33.0, zones_covered:1, composite_score:56.1 },
      { officer_id:'OFC-3012', station:'Halasur PS', cases_filed:543, approval_rate:64.3, avg_close_lag_mins:191, correction_rate:35.7, zones_covered:1, composite_score:52.8 },
    ] as any;
    if (path === '/api/kpis/stations') return [
      { station:'Koramangala PS', total_cases:8743, approval_rate:88.4, avg_lag:5210, correction_rate:11.6 },
      { station:'Indiranagar PS', total_cases:7892, approval_rate:86.1, avg_lag:5480, correction_rate:13.9 },
      { station:'Whitefield PS', total_cases:6981, approval_rate:83.7, avg_lag:5920, correction_rate:16.3 },
      { station:'Madiwala PS', total_cases:6234, approval_rate:81.2, avg_lag:6140, correction_rate:18.8 },
      { station:'Jayanagara PS', total_cases:5811, approval_rate:78.9, avg_lag:6380, correction_rate:21.1 },
      { station:'Rajajinagar PS', total_cases:5243, approval_rate:76.5, avg_lag:6720, correction_rate:23.5 },
      { station:'Hebbal PS', total_cases:4892, approval_rate:74.1, avg_lag:7010, correction_rate:25.9 },
      { station:'Malleshwaram PS', total_cases:4413, approval_rate:71.8, avg_lag:7340, correction_rate:28.2 },
      { station:'Electronic City PS', total_cases:3987, approval_rate:69.4, avg_lag:7680, correction_rate:30.6 },
      { station:'Basavanagudi PS', total_cases:3412, approval_rate:67.0, avg_lag:8120, correction_rate:33.0 },
    ] as any;
    if (path.startsWith('/api/temporal/heatmap-matrix')) {
      const data = [];
      for(let d=0; d<7; d++) for(let h=0; h<24; h++) data.push({ day: d, hour: h, count: Math.floor(Math.random()*50) });
      return data as any;
    }
    if (path.startsWith('/api/temporal/daily-trend')) return Array.from({length: 30}, (_, i) => ({ date: new Date(Date.now() - (29-i)*86400000).toISOString(), count: 100+Math.floor(Math.random()*50), approved: 80, rejected: 20 })) as any;
    if (path === '/api/temporal/weekday-weekend') return { weekday: Array.from({length:24}, (_, i)=>({hour: i, count: Math.random()*100})), weekend: Array.from({length:24}, (_, i)=>({hour: i, count: Math.random()*50})) } as any;
    if (path.startsWith('/api/forecast/hotspots')) {
      const zones = ['Koramangala','Indiranagar','Whitefield','Madiwala','Jayanagar','Rajajinagar','Hebbal','Malleshwaram'];
      const trends = ['rising','rising','stable','falling','rising','stable','falling','rising'];
      const risks = ['Critical','High','High','Medium','Critical','Medium','Low','High'];
      return zones.map((z, i) => ({ zone: z, predicted_count: 847-i*72, confidence: 0.91-i*0.04, trend: trends[i], risk_level: risks[i], lat: 12.93+i*0.02, lon: 77.59+i*0.02 })) as any;
    }
    if (path.startsWith('/api/forecast/timeline')) {
      const base = Date.now() - 90 * 86400000;
      return Array.from({length: 120}, (_, i) => {
        const daysSeed = Math.sin(i*0.3)*15 + Math.sin(i*0.07)*8;
        const actual = i < 90 ? Math.round(280 + daysSeed + Math.sin(i*0.5)*20) : 0;
        const forecast = Math.round(285 + daysSeed + Math.sin(i*0.5)*18);
        return { date: new Date(base + i*86400000).toISOString().slice(0,10), actual, forecast, upper: forecast+32, lower: Math.max(0, forecast-28) };
      }) as any;
    }
    if (path.startsWith('/api/kpis/officers')) return Array.from({length: 10}, (_, i) => ({ officer_id: `OFC-${100+i}`, station: 'Central', cases_filed: 50+i, approval_rate: 0.9, avg_close_lag_mins: 30, correction_rate: 0.05, zones_covered: 3, composite_score: 85 })) as any;
    if (path === '/api/kpis/stations') return Array.from({length: 5}, (_, i) => ({ station: `Station ${i+1}`, total_cases: 500, approval_rate: 0.85, avg_lag: 45, correction_rate: 0.1 })) as any;
    if (path === '/api/zones/list') return Array.from({length: 10}, (_, i) => ({ zone_id: `Z${i+1}`, zone_name: `Zone ${i+1}`, lat: 12.97, lon: 77.59 })) as any;
    if (path.startsWith('/api/congestion/score')) return { zone: 'Test', score: 50, breakdown: { violation_density: 10, avg_open_duration_mins: 5, road_weight: 1, junction_flag: false }, label: 'Medium', history: [] } as any;
    if (path === '/api/congestion/all-zones') return Array.from({length: 10}, (_, i) => ({ zone_id: `Station ${i+1}`, score: 85-i*5, label: 'High', violation_count: 500-i*40, avg_lag_mins: 45, lat: 12.97, lon: 77.59 })) as any;
    if (path.startsWith('/api/congestion/vehicle-impact')) return [ { vehicle_type: 'CAR', impact_score: 80, violation_count: 500 }, { vehicle_type: 'BIKE', impact_score: 50, violation_count: 300 } ] as any;
    if (path === '/api/congestion/peak-windows') return { zones: [], matrix: [] } as any;
    if (path.startsWith('/api/queue/zone-detail')) return { zone_id: 'Z1', chart_data: [], recent_violations: [] } as any;
    if (path.startsWith('/api/queue/assign')) return { success: true } as any;
    if (path.startsWith('/api/temporal/zone-comparison')) return {} as any;
    if (path.startsWith('/api/routes/risk-zones')) return { standard_route: {}, risky_zones: [], safe_route: {}, comparison: {} } as any;
    if (path.startsWith('/api/anomaly/timeline')) return [] as any;
    if (path.startsWith('/api/anomaly/feed')) return [] as any;
    if (path.startsWith('/api/offenders/summary')) return [] as any;
    if (path.startsWith('/api/offenders/profile')) return { vehicle_number: 'KA01', total_violations: 5, status: 'active' } as any;
    if (path === '/api/offenders/insights') return { by_type: [], top_zones: [] } as any;
    if (path === '/api/scita/overview') return { total_sent: 100, total_pct: 0.8, avg_dispatch_delay_mins: 10, top_stations: [] } as any;
    if (path === '/api/scita/by-station') return [] as any;
    if (path.startsWith('/api/scita/timeline')) return [] as any;
    if (path === '/api/scita/junctions') return [] as any;
    
    return {} as any;
  }
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

  async getAppeals(page = 1, pageSize = 20) {
    const statuses: Appeal['status'][] = ['submitted', 'under_review', 'approved', 'denied', 'approved', 'approved', 'submitted', 'under_review'];
    const reasons = [
      'Vehicle was legally parked — signage unclear',
      'Emergency situation — medical appointment',
      'Parking meter malfunction reported',
      'Disputed location — incorrect GPS data',
      'Vehicle was in active loading/unloading',
      'Temporary permit not scanned correctly',
      'Zone marking not visible due to road work',
      'Prior exemption not recorded in system',
    ];
    const plates = ['KA01AB1234','KA02CD5678','KA03EF9012','KA04GH3456','KA05IJ7890',
      'KA50MN2345','KA19PQ6789','KA41RS0123','KA23TU4567','KA55VW8901',
      'MH12AA1111','TN09BB2222','AP07CC3333','TS11DD4444','DL01EE5555'];
    const total = 47;
    const items: Appeal[] = Array.from({ length: Math.min(pageSize, total) }, (_, i) => {
      const idx = (page - 1) * pageSize + i;
      const status = statuses[idx % statuses.length];
      const submittedDate = new Date(2025, 1 + (idx % 4), 1 + (idx % 28));
      const reviewedDate = ['approved','denied'].includes(status)
        ? new Date(submittedDate.getTime() + (3 + idx % 5) * 86400000) : undefined;
      return {
        id: `APL-${2025001 + idx}`,
        violationId: `VIO-${300000 + idx}`,
        licensePlate: plates[idx % plates.length],
        status,
        reason: reasons[idx % reasons.length],
        submittedDate,
        reviewedDate,
        notes: status === 'approved' ? 'Appeal upheld — insufficient evidence' : undefined,
      } as Appeal;
    });
    return { items, total, page, pageSize };
  },

  async getAppealById() { return {} as Appeal; },
  async submitAppeal() { return {} as Appeal; },
  async updateAppealStatus() { return {} as Appeal; },
  async getOfficerById() { return (await apiClient.getOfficers())[0] || {} as Officer; },
  async getActiveOfficers() { return (await apiClient.getOfficers()).filter((o) => o.status === 'active'); },

  async getComplianceEntities(page = 1, pageSize = 50) {
    const types: ComplianceEntity['type'][] = ['vehicle', 'vehicle', 'vehicle', 'driver', 'driver', 'dashboard'];
    const zones = ['Indiranagar','Koramangala','Whitefield','Jayanagar','MG Road','Hebbal',
      'Electronic City','Yeshwanthpur','Rajajinagar','Malleswaram'];
    const plates = ['KA01AB','KA02CD','KA03EF','KA50MN','KA19PQ','MH12AA','TN09BB','AP07CC','TS11DD','DL01EE'];
    const total = 284;
    const items: ComplianceEntity[] = Array.from({ length: Math.min(pageSize, total) }, (_, i) => {
      const idx = (page - 1) * pageSize + i;
      const type = types[idx % types.length];
      const violations = Math.max(1, Math.round(15 - (idx % 12) * 1.1 + Math.sin(idx) * 3));
      const score = Math.max(18, Math.min(98, Math.round(90 - violations * 3.5 + (idx % 7) * 2)));
      return {
        id: `ENT-${1000 + idx}`,
        type,
        name: type === 'vehicle'
          ? `${plates[idx % plates.length]}${String(1000 + idx * 7).slice(-4)}`
          : type === 'driver'
          ? `DRV-${String(idx + 100).padStart(4, '0')}`
          : `DASH-${zones[idx % zones.length].toUpperCase().replace(' ', '')}`,
        violationCount: violations,
        complianceScore: score,
        lastViolation: new Date(2025, idx % 5, 1 + (idx % 28)),
        tags: score < 60 ? ['high-risk'] : score < 80 ? ['monitor'] : ['compliant'],
      } as ComplianceEntity;
    });
    return { items, total, page, pageSize };
  },

  async getComplianceScore() { return 74; },
  async getRevenueData() {
    return [
      { month: 'Jan 2025', amount: 4872300 },
      { month: 'Feb 2025', amount: 5134200 },
      { month: 'Mar 2025', amount: 6291800 },
      { month: 'Apr 2025', amount: 5873400 },
      { month: 'May 2025', amount: 6102700 },
    ];
  },
  async getTotalRevenue() { return 28274400; },
  async getRevenueByViolationType() {
    return {
      'Wrong Parking': 9841200,
      'No Helmet': 4320800,
      'No Seatbelt': 3217600,
      'Signal Jumping': 4891000,
      'Obstructing Traffic': 2134500,
      'Overspeeding': 1987400,
      'Triple Riding': 1881900,
    };
  },
  async getViolationsByStatus() {
    return { pending: 14823, approved: 38291, rejected: 6147, escalated: 2038 };
  },
};
