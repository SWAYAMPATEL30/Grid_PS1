'use client';

import { useEffect, useState } from 'react';
import { parkSightApi } from '@/lib/api-client';
import { QueueZone } from '@/lib/types';
import { MapPin, AlertTriangle, Zap, Shield, ChevronRight } from 'lucide-react';

const actionColor = (action: string) => {
  if (action.includes('Deploy')) return 'text-red-400 bg-red-900/20 border-red-800';
  if (action.includes('CCTV')) return 'text-orange-400 bg-orange-900/20 border-orange-800';
  return 'text-blue-400 bg-blue-900/20 border-blue-800';
};

const scoreColor = (score: number) =>
  score >= 75 ? 'text-red-400' : score >= 50 ? 'text-orange-400' : score >= 25 ? 'text-yellow-400' : 'text-green-400';

export default function QueuePage() {
  const [zones, setZones] = useState<QueueZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<'now' | '2h' | '8h'>('now');
  const [vehicleFocus, setVehicleFocus] = useState('all');
  const [selected, setSelected] = useState<QueueZone | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await parkSightApi.getQueueZones({ time_window: timeWindow, vehicle_focus: vehicleFocus, limit: 50 });
        setZones(data);
      } catch (err) {
        console.error('Failed to load queue zones:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeWindow, vehicleFocus]);

  const critical = zones.filter(z => z.score >= 75).length;
  const high = zones.filter(z => z.score >= 50 && z.score < 75).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Enforcement Queue</h1>
          <p className="mt-2 text-slate-400">Ranked zone dispatch list — highest priority first</p>
        </div>
        <div className="flex gap-2">
          {(['now', '2h', '8h'] as const).map(tw => (
            <button key={tw} onClick={() => setTimeWindow(tw)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${timeWindow === tw ? 'bg-blue-600 text-white' : 'border border-slate-700 text-slate-400 hover:text-slate-300'}`}>
              {tw === 'now' ? 'Live' : `Last ${tw}`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Total Zones</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">{loading ? '—' : zones.length}</p>
        </div>
        <div className="rounded-xl border border-red-900/50 bg-red-900/10 p-4">
          <p className="text-sm text-red-400">Critical Zones</p>
          <p className="mt-2 text-2xl font-bold text-red-400">{loading ? '—' : critical}</p>
        </div>
        <div className="rounded-xl border border-orange-900/50 bg-orange-900/10 p-4">
          <p className="text-sm text-orange-400">High Priority</p>
          <p className="mt-2 text-2xl font-bold text-orange-400">{loading ? '—' : high}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Total Open Violations</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">
            {loading ? '—' : zones.reduce((s, z) => s + z.open_violations, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Zone Queue Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Dispatch Priority Queue</h2>
          <select
            value={vehicleFocus}
            onChange={e => setVehicleFocus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300"
          >
            <option value="all">All Vehicles</option>
            <option value="lgv">LGV Focus</option>
            <option value="auto">Auto Focus</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">RANK</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">ZONE</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">SCORE</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">OPEN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">PEAK HOUR</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">ACTION</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">LOC</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-800 animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                : zones.map(z => (
                    <tr
                      key={z.zone}
                      onClick={() => setSelected(z)}
                      className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-slate-500">#{z.rank}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{z.zone}</p>
                          {z.junction_name && z.junction_name !== z.zone && (
                            <p className="text-xs text-slate-500">{z.junction_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-lg font-bold ${scoreColor(z.score)}`}>{(z.score || 0).toFixed(0)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{z.open_violations.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{z.peak_hour}:00</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${actionColor(z.recommended_action)}`}>
                          {z.recommended_action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                        {(z.lat || 0).toFixed(4)}, {(z.lon || 0).toFixed(4)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Zone Detail */}
      {selected && (
        <div className="rounded-xl border border-blue-800 bg-blue-900/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-100">{selected.zone} — Zone Detail</h3>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300 text-sm">✕ Close</button>
          </div>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div>
              <p className="text-slate-400">Congestion Score</p>
              <p className={`text-2xl font-bold ${scoreColor(selected.score)}`}>{(selected.score || 0).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-slate-400">Open Violations</p>
              <p className="text-2xl font-bold text-slate-100">{selected.open_violations}</p>
            </div>
            <div>
              <p className="text-slate-400">Peak Hour</p>
              <p className="text-2xl font-bold text-slate-100">{selected.peak_hour}:00</p>
            </div>
            <div>
              <p className="text-slate-400">Recommended Action</p>
              <p className="text-sm font-semibold text-blue-400 mt-2">{selected.recommended_action}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
