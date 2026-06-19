'use client';

import { useEffect, useState } from 'react';
import { parkSightApi } from '@/lib/api-client';
import { DailyTrend, HourDayCell, WeekdayWeekend } from '@/lib/types';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}h`);

function HeatmapGrid({ data }: { data: HourDayCell[] }) {
  if (!data.length) return <div className="h-48 bg-slate-800 animate-pulse rounded" />;
  const max = Math.max(...data.map(d => d.count), 1);
  const grid: Record<string, number> = {};
  data.forEach(d => { grid[`${d.day}-${d.hour}`] = d.count; });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex gap-1 mb-1 ml-10">
          {HOURS.map(h => (
            <div key={h} className="w-7 text-center text-xs text-slate-600">{h}</div>
          ))}
        </div>
        {DAYS.map((day, di) => (
          <div key={day} className="flex gap-1 mb-1 items-center">
            <div className="w-8 text-xs text-slate-500 text-right pr-2">{day}</div>
            {Array.from({ length: 24 }, (_, h) => {
              const count = grid[`${di}-${h}`] || 0;
              const intensity = count / max;
              const opacity = Math.max(0.05, intensity);
              return (
                <div
                  key={h}
                  title={`${day} ${h}:00 — ${count} violations`}
                  className="w-7 h-7 rounded-sm cursor-pointer transition-transform hover:scale-125"
                  style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TemporalPage() {
  const [heatmap, setHeatmap] = useState<HourDayCell[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([]);
  const [weekdayWeekend, setWeekdayWeekend] = useState<WeekdayWeekend | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [hm, trend, ww] = await Promise.all([
          parkSightApi.getTemporalHeatmap(),
          parkSightApi.getDailyTrend(),
          parkSightApi.getWeekdayWeekend(),
        ]);
        setHeatmap(hm);
        setDailyTrend(trend);
        setWeekdayWeekend(ww);
      } catch (err) {
        console.error('Failed to load temporal data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Peak hour / day from heatmap
  const peakCell = heatmap.reduce((best, d) => d.count > best.count ? d : best, { day: 0, hour: 9, count: 0 });
  const totalViolations = dailyTrend.reduce((s, d) => s + d.count, 0);
  const avgPerDay = dailyTrend.length > 0 ? Math.round(totalViolations / dailyTrend.length) : 0;

  const weekdayData = (weekdayWeekend?.weekday || []).map(d => ({
    hour: `${d.hour}h`, weekday: d.count,
    weekend: weekdayWeekend?.weekend.find(w => w.hour === d.hour)?.count || 0,
  }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Temporal Analysis</h1>
        <p className="mt-2 text-slate-400">Violation patterns across time — hourly, daily, and weekly trends</p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Violations', value: loading ? '—' : (totalViolations || 0).toLocaleString() },
          { label: 'Avg Per Day', value: loading ? '—' : avgPerDay },
          { label: 'Peak Hour', value: loading ? '—' : `${peakCell.hour}:00` },
          { label: 'Peak Day', value: loading ? '—' : DAYS[peakCell.day] },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Hour-Day Heatmap */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Violations by Hour & Day of Week
        </h2>
        {loading
          ? <div className="h-48 bg-slate-800 animate-pulse rounded" />
          : <HeatmapGrid data={heatmap} />
        }
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'rgba(59,130,246,0.05)' }} />
          <span>Low</span>
          <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'rgba(59,130,246,0.5)' }} />
          <span>Medium</span>
          <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'rgba(59,130,246,1)' }} />
          <span>High</span>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Daily Violation Trend</h2>
        {loading || !dailyTrend.length
          ? <div className="h-64 bg-slate-800 animate-pulse rounded" />
          : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 11 }}
                  tickFormatter={v => v.slice(5)} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" dot={false} strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="approved" stroke="#10b981" dot={false} strokeWidth={1.5} name="Approved" />
                <Line type="monotone" dataKey="rejected" stroke="#ef4444" dot={false} strokeWidth={1.5} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          )}
      </div>

      {/* Weekday vs Weekend */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Weekday vs Weekend Patterns</h2>
        {loading || !weekdayData.length
          ? <div className="h-64 bg-slate-800 animate-pulse rounded" />
          : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
                <Bar dataKey="weekday" fill="#3b82f6" name="Weekday" radius={[2, 2, 0, 0]} />
                <Bar dataKey="weekend" fill="#8b5cf6" name="Weekend" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>
    </div>
  );
}
