'use client';

import { useEffect, useState } from 'react';
import { parkSightApi } from '@/lib/api-client';
import { ForecastTimelinePoint, ForecastHotspot } from '@/lib/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react';

const trendIcon = (trend: string) => {
  if (trend === 'rising') return <TrendingUp className="h-4 w-4 text-red-400" />;
  if (trend === 'falling') return <TrendingDown className="h-4 w-4 text-green-400" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
};

export default function ForecastPage() {
  const [timeline, setTimeline] = useState<ForecastTimelinePoint[]>([]);
  const [hotspots, setHotspots] = useState<ForecastHotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [tl, hs] = await Promise.all([
          parkSightApi.getForecastTimeline(),
          parkSightApi.getForecastHotspots({ confidence_threshold: 0.3 }),
        ]);
        setTimeline(tl);
        setHotspots(hs.slice(0, 8));
      } catch (err) {
        console.error('Failed to load forecast data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartData = timeline.map(t => ({
    date: t.datetime.slice(0, 10),
    predicted: Math.round(t.predicted_count),
    lower: Math.round(t.lower_bound),
    upper: Math.round(t.upper_bound),
  }));

  const avgPredicted = chartData.length
    ? Math.round(chartData.reduce((s, d) => s + d.predicted, 0) / chartData.length)
    : 0;
  const maxPredicted = chartData.length ? Math.max(...chartData.map(d => d.predicted)) : 0;
  const minPredicted = chartData.length ? Math.min(...chartData.map(d => d.predicted)) : 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Violation Forecast</h1>
        <p className="mt-2 text-slate-400">Statistical prediction with confidence intervals — rolling 30-day model</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Avg Daily Predicted', value: loading ? '—' : avgPredicted },
          { label: 'Peak Predicted', value: loading ? '—' : maxPredicted },
          { label: 'Min Predicted', value: loading ? '—' : minPredicted },
          { label: 'Forecast Days', value: loading ? '—' : chartData.length },
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
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 11 }}
                  tickFormatter={v => v.slice(5)} interval={6} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGrad)" name="Upper bound" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="#0f172a" name="Lower bound" />
                <Line type="monotone" dataKey="predicted" stroke="#3b82f6" dot={false} strokeWidth={2.5} name="Predicted" />
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
                      <div className="flex items-center gap-2">
                        {trendIcon(hs.trend)}
                        <p className="font-semibold text-slate-100 text-sm">{hs.zone}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {(hs.lat || 0).toFixed(4)}, {(hs.lon || 0).toFixed(4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-400">{Math.round(hs.predicted_count)}</p>
                      <p className="text-xs text-slate-500">predicted</p>
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
                        style={{ width: `${hs.confidence * 100}%` }}
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
