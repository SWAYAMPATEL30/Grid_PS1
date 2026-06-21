'use client';

import { useEffect, useState } from 'react';
import { parkSightApi } from '@/lib/api-client';
import { ForecastHotspot } from '@/lib/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, MapPin, AlertCircle } from 'lucide-react';

// Backend returns: { date, actual, forecast, upper, lower }
interface BackendTimelinePoint {
  date: string;
  actual: number;
  forecast: number;
  upper: number;
  lower: number;
}

const trendIcon = (trend: string) => {
  if (trend === 'rising') return <TrendingUp className="h-4 w-4 text-red-400" />;
  if (trend === 'falling') return <TrendingDown className="h-4 w-4 text-green-400" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
};

const riskBadgeColor = (level: string) => {
  if (level === 'Critical') return 'bg-red-900/50 text-red-400 border border-red-700';
  if (level === 'High') return 'bg-orange-900/50 text-orange-400 border border-orange-700';
  if (level === 'Medium') return 'bg-yellow-900/50 text-yellow-400 border border-yellow-700';
  return 'bg-green-900/50 text-green-400 border border-green-700';
};

export default function ForecastPage() {
  const [timeline, setTimeline] = useState<BackendTimelinePoint[]>([]);
  const [hotspots, setHotspots] = useState<ForecastHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [tl, hs] = await Promise.all([
          parkSightApi.getForecastTimeline(),
          parkSightApi.getForecastHotspots({ confidence_threshold: 0.3 }),
        ]);
        setTimeline(tl as unknown as BackendTimelinePoint[]);
        setHotspots(hs.slice(0, 8));
      } catch (err) {
        console.error('Failed to load forecast data:', err);
        setError('Failed to load forecast data. Ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartData = timeline.map(t => ({
    date: t.date?.slice(0, 10) ?? '',
    actual: t.actual ?? 0,
    forecast: Math.round(t.forecast ?? 0),
    upper: Math.round(t.upper ?? 0),
    lower: Math.round(t.lower ?? 0),
  }));

  const avgForecast = chartData.length
    ? Math.round(chartData.reduce((s, d) => s + d.forecast, 0) / chartData.length)
    : 0;
  const maxForecast = chartData.length ? Math.max(...chartData.map(d => d.forecast)) : 0;
  const minForecast = chartData.length ? Math.min(...chartData.map(d => d.forecast)) : 0;
  const totalActual = chartData.reduce((s, d) => s + (d.actual || 0), 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Violation Forecast</h1>
        <p className="mt-2 text-slate-400">Statistical prediction with confidence intervals — rolling 7-day model</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Avg Daily Forecast', value: loading ? '—' : avgForecast.toLocaleString() },
          { label: 'Peak Day Forecast', value: loading ? '—' : maxForecast.toLocaleString() },
          { label: 'Min Day Forecast', value: loading ? '—' : minForecast.toLocaleString() },
          { label: 'Total Actual (Period)', value: loading ? '—' : totalActual.toLocaleString() },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Timeline Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Forecast Timeline with Confidence Band</h2>
        {loading || !chartData.length
          ? <div className="h-96 bg-slate-800 animate-pulse rounded" />
          : (
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 11 }}
                  tickFormatter={v => v.slice(5)} interval={Math.floor(chartData.length / 8)} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGrad)" name="Upper bound" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="#0f172a" name="Lower bound" />
                <Line type="monotone" dataKey="forecast" stroke="#3b82f6" dot={false} strokeWidth={2.5} name="Forecast" />
                <Line type="monotone" dataKey="actual" stroke="#10b981" dot={false} strokeWidth={1.5} name="Actual" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </div>

      {/* Hotspot Forecast */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">High-Risk Zone Forecasts</h2>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-800 animate-pulse rounded mb-2" />
            ))
          : hotspots.length === 0
          ? (
            <p className="text-slate-500 text-sm">No hotspot forecasts available. Load more data or lower the confidence threshold.</p>
          )
          : (
            <div className="grid gap-3 md:grid-cols-2">
              {hotspots.map(hs => (
                <div key={hs.zone} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {trendIcon(hs.trend)}
                        <p className="font-semibold text-slate-100 text-sm">{hs.zone}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskBadgeColor(hs.risk_level || 'Low')}`}>
                        {hs.risk_level || 'Low'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-400">{(hs.predicted_count || 0).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">predicted violations</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Confidence</span>
                      <span>{((hs.confidence || 0) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-400"
                        style={{ width: `${(hs.confidence || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
