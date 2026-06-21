'use client';

import { useState, useEffect } from 'react';
import { useApiFetch } from '@/context/auth-context';

export default function SpeedPage() {
  const apiFetch = useApiFetch();
  const [stats, setStats] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [byZone, setByZone] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/speed/stats'),
      apiFetch('/api/speed/zones'),
      apiFetch('/api/speed/violations'),
      apiFetch('/api/speed/by-zone'),
    ]).then(([s, z, v, bz]) => {
      if (Array.isArray(s)) setStats(s);
      if (Array.isArray(z)) setZones(z);
      if (Array.isArray(v)) setViolations(v);
      if (Array.isArray(bz)) setByZone(bz);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    slow_0_30:        { label: '0–30 km/h (Slow)',      color: 'text-blue-400',   bg: 'bg-blue-900/30 border-blue-700/30',   icon: '🐌' },
    normal_30_60:     { label: '30–60 km/h (Normal)',   color: 'text-green-400',  bg: 'bg-green-900/30 border-green-700/30', icon: '✅' },
    caution_60_80:    { label: '60–80 km/h (Caution)',  color: 'text-amber-400',  bg: 'bg-amber-900/30 border-amber-700/30', icon: '⚠️' },
    violation_80_120: { label: '80–120 km/h (Violation)',color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-700/30',icon: '🚨' },
    dangerous_120_plus:{ label: '120+ km/h (Dangerous)', color: 'text-red-400',   bg: 'bg-red-900/30 border-red-700/30',    icon: '💀' },
  };

  const total = stats.reduce((acc, s) => acc + Number(s.count), 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🏎️ Speed Analytics</h1>
        <p className="text-slate-400 text-sm">Simulated speed distribution derived from violation severity weights across Bengaluru junctions</p>
      </div>

      {/* Speed Distribution Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const stat = stats.find(s => s.speed_category === key);
          const count = Number(stat?.count || 0);
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={key} className={`border rounded-2xl p-4 text-center ${cfg.bg}`}>
              <div className="text-2xl mb-2">{cfg.icon}</div>
              <p className={`text-2xl font-black ${cfg.color}`}>{pct}%</p>
              <p className="text-xs text-slate-400 mt-1">{cfg.label.split(' (')[0]}</p>
              <p className="text-xs text-slate-500">{count.toLocaleString()} events</p>
            </div>
          );
        })}
      </div>

      {/* Top Speeding Zones */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">🔴 Top Overspeed Zones</h2>
          <div className="space-y-2">
            {byZone.slice(0, 8).map((z, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-3 py-2.5">
                <span className="text-slate-500 text-xs font-mono w-5 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{z.zone}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                        style={{ width: `${Math.min(100, (z.overspeed_count / (byZone[0]?.overspeed_count || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-red-400 shrink-0">{z.overspeed_count}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-amber-400 font-semibold">{z.avg_speed_kmh} km/h</p>
                  <p className="text-xs text-slate-500">avg</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Speed Zone Limits */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">🚦 Configured Speed Zones</h2>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {zones.map((z, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-3 py-2.5">
                <span className="text-base">📍</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{z.zone_name}</p>
                  <p className="text-xs text-slate-500">{z.lat?.toFixed(4)}, {z.lon?.toFixed(4)}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  z.speed_limit_kmh <= 30 ? 'bg-red-900/40 text-red-400' :
                  z.speed_limit_kmh <= 50 ? 'bg-amber-900/40 text-amber-400' :
                  'bg-green-900/40 text-green-400'
                }`}>
                  {z.speed_limit_kmh} km/h
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Speed Violations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">⚡ Top Speed Incidents (Simulated)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-400">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-widest">
                <th className="text-left py-2 pr-4">Vehicle</th>
                <th className="text-left py-2 pr-4">Type</th>
                <th className="text-left py-2 pr-4">Location</th>
                <th className="text-left py-2 pr-4">Station</th>
                <th className="text-right py-2">Speed (km/h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {violations.slice(0, 10).map((v, i) => (
                <tr key={v.id || i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 pr-4 text-slate-200 font-mono">{v.vehicle_number || '—'}</td>
                  <td className="py-2.5 pr-4">{v.vehicle_type || '—'}</td>
                  <td className="py-2.5 pr-4 max-w-[200px] truncate">{v.junction_name || '—'}</td>
                  <td className="py-2.5 pr-4 truncate">{v.police_station || '—'}</td>
                  <td className={`py-2.5 text-right font-bold ${Number(v.simulated_speed_kmh) > 80 ? 'text-red-400' : 'text-amber-400'}`}>
                    {v.simulated_speed_kmh}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
