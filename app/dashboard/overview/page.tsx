'use client';

import { useEffect, useState } from 'react';
import { parkSightApi } from '@/lib/api-client';
import { OverviewKPIs, TopHotspot, VehicleSplit } from '@/lib/types';
import { AlertCircle, TrendingUp, Zap, Activity, MapPin, Clock, Car } from 'lucide-react';
import dynamic from 'next/dynamic';

const InteractiveMapPreview = dynamic(
  () => import('@/components/maps/map-preview').then(mod => mod.InteractiveMapPreview),
  { loading: () => <div className="h-96 bg-slate-800 animate-pulse rounded-lg" />, ssr: false }
);

function KPICard({ title, value, subtitle, delta, icon: Icon, color }: {
  title: string; value: string | number; subtitle?: string;
  delta?: { value: number; positive: boolean }; icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-8 translate-x-8 ${color}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      {delta && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${delta.positive ? 'text-emerald-400' : 'text-red-400'}`}>
          <TrendingUp className={`h-3 w-3 ${!delta.positive ? 'rotate-180' : ''}`} />
          {Math.abs(delta.value)}% vs last period
        </div>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [hotspots, setHotspots] = useState<TopHotspot[]>([]);
  const [vehicleSplit, setVehicleSplit] = useState<VehicleSplit[]>([]);
  const [lagStations, setLagStations] = useState<{ station: string; avg_lag_mins: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [kpisData, hotspotsData, splitData, lagData] = await Promise.all([
          parkSightApi.getOverviewKPIs(),
          parkSightApi.getTopHotspots(5),
          parkSightApi.getVehicleSplit(),
          parkSightApi.getWorstLagStations(),
        ]);
        setKpis(kpisData);
        setHotspots(hotspotsData);
        setVehicleSplit(splitData.slice(0, 7));
        setLagStations(lagData.slice(0, 5));
      } catch (err) {
        setError('Failed to load dashboard data. Is the backend running?');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const riskLabel = (score: number) =>
    score > 75 ? 'Critical' : score > 50 ? 'High' : score > 25 ? 'Medium' : 'Low';
  const riskColor = (score: number) =>
    score > 75 ? 'text-red-400' : score > 50 ? 'text-orange-400' : score > 25 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Overview</h1>
        <p className="mt-2 text-slate-400">Real-time parking violation analytics — Bengaluru traffic enforcement</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Violations"
          value={loading ? '—' : (kpis?.total_violations ?? 0).toLocaleString()}
          subtitle="Jan – May 2025"
          delta={kpis ? { value: Math.abs(kpis.deltas.violations_pct), positive: kpis.deltas.violations_pct < 0 } : undefined}
          icon={Activity}
          color="bg-blue-500"
        />
        <KPICard
          title="Active Hotspots"
          value={loading ? '—' : kpis?.active_hotspots ?? 0}
          subtitle="Police stations with violations"
          icon={MapPin}
          color="bg-orange-500"
        />
        <KPICard
          title="Avg Resolution Lag"
          value={loading ? '—' : `${kpis?.avg_resolution_lag_mins?.toFixed(0) ?? 0} min`}
          subtitle="Action taken time"
          icon={Clock}
          color="bg-purple-500"
        />
        <KPICard
          title="Delivery Risk Index"
          value={loading ? '—' : `${kpis?.delivery_risk_index?.toFixed(1) ?? 0}`}
          subtitle={kpis ? riskLabel(kpis.delivery_risk_index) : ''}
          icon={Zap}
          color="bg-red-500"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-800 p-4">
            <h2 className="text-lg font-semibold text-slate-100">Violation Hotspots</h2>
            <p className="text-sm text-slate-400">Real-time violation density map</p>
          </div>
          <div className="h-96">
            <InteractiveMapPreview />
          </div>
        </div>

        {/* Vehicle Split */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-400" />
            Vehicle Breakdown
          </h3>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 bg-slate-800 animate-pulse rounded" />
                ))
              : vehicleSplit.map((v) => (
                  <div key={v.vehicle_type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{v.vehicle_type}</span>
                      <span className="text-slate-100 font-semibold">{(v.pct || 0).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                        style={{ width: `${v.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Hotspots */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Top Hotspot Zones</h3>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-slate-800 animate-pulse rounded" />)
              : hotspots.map((h, i) => (
                  <div key={h.zone} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-sm font-mono">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-100">{h.zone}</p>
                        <p className="text-xs text-slate-500">{(h.violation_count || 0).toLocaleString()} violations</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${riskColor(h.score)}`}>
                      {(h.score || 0).toFixed(0)}
                    </span>
                  </div>
                ))}
          </div>
        </div>

        {/* Worst Lag Stations */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Stations with Highest Lag</h3>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-slate-800 animate-pulse rounded" />)
              : lagStations.map((s) => (
                  <div key={s.station} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-2.5">
                    <p className="text-sm text-slate-300">{s.station}</p>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-400">{(s.avg_lag_mins || 0).toFixed(0)} min</p>
                      <p className="text-xs text-slate-500">avg resolution</p>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
