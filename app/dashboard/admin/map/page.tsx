'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function AdminMapPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [officers, setOfficers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'ADMIN') router.push('/dashboard/overview');
    load();
    intervalRef.current = setInterval(load, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user, router]);

  const load = async () => {
    try {
      const [oRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/api/officers/active`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/reports/pending`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const oData = await oRes.json(); if (Array.isArray(oData)) setOfficers(oData);
      const rData = await rRes.json(); if (Array.isArray(rData)) setReports(rData);
    } catch {}
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🗺️ Live Operations Map</h1>
          <p className="text-slate-400 text-sm">Real-time officer locations and active reports · Auto-refreshes every 30s</p>
        </div>
        <button onClick={load} className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl px-4 py-2 text-sm transition-all">↻ Refresh</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-green-700/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-green-400">{officers.length}</p>
          <p className="text-xs text-slate-400 mt-1">Officers On Duty</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">Live Tracking</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-amber-700/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-amber-400">{reports.length}</p>
          <p className="text-xs text-slate-400 mt-1">Pending Reports</p>
        </div>
        <div className="bg-slate-900 border border-blue-700/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-blue-400">{officers.length + reports.length}</p>
          <p className="text-xs text-slate-400 mt-1">Active Incidents</p>
        </div>
      </div>

      {/* Map placeholder with embedded markers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-5">
        <div className="h-[400px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative flex items-center justify-center">
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute inset-0 flex items-center justify-center text-center z-10">
            <div>
              <p className="text-6xl mb-3">🗺️</p>
              <p className="text-slate-300 font-semibold">Bengaluru, Karnataka</p>
              <p className="text-slate-500 text-sm mt-1">Live officer positions update every 30s</p>
              <p className="text-slate-600 text-xs mt-2">Integrate Mapbox/Google Maps with officer GPS coordinates for full map view</p>
            </div>
          </div>
          {/* Animated officer dots */}
          {officers.slice(0, 5).map((o, i) => (
            <div key={o.id || i}
              className="absolute w-4 h-4 bg-green-400 rounded-full border-2 border-green-200 animate-pulse z-20"
              style={{ left: `${20 + i * 15}%`, top: `${30 + (i % 3) * 20}%` }}
              title={o.full_name}
            />
          ))}
          {reports.slice(0, 8).map((r, i) => (
            <div key={r.id || i}
              className="absolute w-3 h-3 bg-red-400 rounded-full border-2 border-red-200 z-20"
              style={{ left: `${15 + i * 10}%`, top: `${20 + (i % 4) * 18}%` }}
              title={r.description}
            />
          ))}
        </div>
        <div className="px-5 py-3 border-t border-slate-800 flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-400 rounded-full" /><span className="text-slate-400">Officer (on duty)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-400 rounded-full" /><span className="text-slate-400">Citizen Report (pending)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-400 rounded-full" /><span className="text-slate-400">Active Hotspot</span></div>
        </div>
      </div>

      {/* Officer List */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-3 text-sm">👮 Active Officers</h2>
          {officers.length === 0 ? <p className="text-slate-500 text-sm text-center py-4">No officers on duty</p> : (
            <div className="space-y-2">
              {officers.map((o: any, i: number) => (
                <div key={o.id || i} className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-3 py-2.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{o.full_name}</p>
                    <p className="text-xs text-slate-500">{o.police_station}</p>
                  </div>
                  <p className="text-xs text-slate-500 shrink-0">{o.latitude?.toFixed(3)},{o.longitude?.toFixed(3)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-3 text-sm">📋 Pending Reports</h2>
          {reports.length === 0 ? <p className="text-slate-500 text-sm text-center py-4">No pending reports 🎉</p> : (
            <div className="space-y-2">
              {reports.map((r: any, i: number) => (
                <div key={r.id || i} className="flex items-start gap-3 bg-slate-800/60 rounded-xl px-3 py-2.5">
                  <span className="text-base shrink-0">📍</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{r.description || 'Illegal parking report'}</p>
                    <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
