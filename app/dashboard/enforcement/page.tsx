'use client';

import { useEffect, useState } from 'react';
import { parkSightApi } from '@/lib/api-client';
import { OfficerKPI, StationKPI } from '@/lib/types';
import { Activity, Award, BarChart2, Shield } from 'lucide-react';

function ScoreBar({ value, max = 100, color = 'bg-blue-500' }: { value: number; max?: number; color?: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  );
}

export default function EnforcementPage() {
  const [officers, setOfficers] = useState<OfficerKPI[]>([]);
  const [stations, setStations] = useState<StationKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'officers' | 'stations'>('officers');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [o, s] = await Promise.all([
          parkSightApi.getOfficerKPIs(),
          parkSightApi.getStationKPIs(),
        ]);
        setOfficers(o.slice(0, 50));
        setStations(s);
      } catch (err) {
        console.error('Failed to load KPIs:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // OfficerKPI fields: officer_id, station, cases_filed, approval_rate, avg_close_lag_mins, correction_rate, zones_covered, composite_score
  const topOfficer = officers.length ? [...officers].sort((a, b) => (b.composite_score || 0) - (a.composite_score || 0))[0] : null;
  const totalCases = officers.reduce((s, o) => s + (o.cases_filed || 0), 0);
  const avgApproval = officers.length
    ? (officers.reduce((s, o) => s + (o.approval_rate || 0), 0) / officers.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Enforcement Operations</h1>
        <p className="mt-2 text-slate-400">Officer KPIs, station performance, and case statistics</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Active Officers</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">{loading ? '—' : officers.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Total Cases Filed</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">{loading ? '—' : totalCases.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Avg Approval Rate</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{loading ? '—' : `${avgApproval}%`}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Top Officer Score</p>
          <p className="mt-2 text-2xl font-bold text-blue-400">
            {loading || !topOfficer ? '—' : (topOfficer.composite_score || 0).toFixed(1)}
          </p>
          {topOfficer && <p className="text-xs text-slate-500 mt-1">{topOfficer.officer_id}</p>}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 border-b border-slate-800">
        {(['officers', 'stations'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium transition ${
              tab === t ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {t === 'officers' ? '👮 Officers' : '🏢 Stations'}
          </button>
        ))}
      </div>

      {tab === 'officers' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">OFFICER</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">STATION</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">CASES</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">APPROVAL RATE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">AVG LAG</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">ZONES</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">SCORE</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-800">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-slate-800 animate-pulse rounded" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : officers.map(o => (
                      <tr key={o.officer_id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-100">{o.officer_id}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{o.station}</td>
                        <td className="px-4 py-3 text-sm text-slate-100">{(o.cases_filed || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={(o.approval_rate || 0) >= 70 ? 'text-emerald-400' : 'text-orange-400'}>
                              {(o.approval_rate || 0).toFixed(1)}%
                            </span>
                            <ScoreBar value={o.approval_rate || 0} color={(o.approval_rate || 0) >= 70 ? 'bg-emerald-500' : 'bg-orange-500'} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{(o.avg_close_lag_mins || 0).toFixed(0)} min</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{o.zones_covered}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${(o.composite_score || 0) >= 70 ? 'text-emerald-400' : (o.composite_score || 0) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {(o.composite_score || 0).toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'stations' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">STATION</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">TOTAL CASES</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">APPROVAL RATE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">AVG LAG</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">CORRECTION RATE</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-800">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-slate-800 animate-pulse rounded" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : stations.map(s => (
                      <tr key={s.station} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-100">{s.station}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{(s.total_cases || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={(s.approval_rate || 0) >= 70 ? 'text-emerald-400 font-semibold' : 'text-orange-400'}>
                            {(s.approval_rate || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{(s.avg_lag || 0).toFixed(0)} min</td>
                        <td className="px-4 py-3 text-sm text-red-400">{(s.correction_rate || 0).toFixed(1)}%</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
