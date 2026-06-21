'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useApiFetch } from '@/context/auth-context';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function FieldPage() {
  const { user, token, logout } = useAuth();
  const apiFetch = useApiFetch();
  const router = useRouter();

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'POLICE_OFFICER' && user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [user, router]);

  const pingLocation = useCallback((lat: number, lon: number) => {
    fetch(`${API_BASE}/api/officers/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ latitude: lat, longitude: lon }),
    });
    fetch(`${API_BASE}/api/officers/me/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(data => { if (Array.isArray(data)) setAlerts(data); }).catch(() => {});
  }, [token]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setLocation({ lat, lon });
      pingLocation(lat, lon);
    });
    locationInterval.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocation({ lat, lon });
        pingLocation(lat, lon);
      });
    }, 30000);
  }, [pingLocation]);

  const stopTracking = useCallback(() => {
    if (locationInterval.current) clearInterval(locationInterval.current);
  }, []);

  const clockIn = async () => {
    await apiFetch('/api/officers/clockin', { method: 'POST' });
    setIsClockedIn(true);
    startTracking();
    loadTasks();
  };

  const clockOut = async () => {
    await apiFetch('/api/officers/clockout', { method: 'POST' });
    setIsClockedIn(false);
    stopTracking();
    setAlerts([]);
  };

  const loadTasks = async () => {
    const data = await apiFetch('/api/reports/assigned');
    if (Array.isArray(data)) setTasks(data);
  };

  useEffect(() => { loadTasks(); }, []);
  useEffect(() => () => stopTracking(), [stopTracking]);

  const handleUploadViolation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !location) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('photo', file);
    fd.append('lat', String(location.lat));
    fd.append('lon', String(location.lon));
    fd.append('description', 'Field violation captured by officer');
    try {
      await fetch(`${API_BASE}/api/reports/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch {}
    setUploading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 p-4 max-w-md mx-auto relative overflow-hidden">
      {/* Dynamic Background */}
      <div className={`absolute top-0 right-0 w-[80%] h-[50%] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 ${isClockedIn ? 'bg-green-600/10' : 'bg-red-600/10'}`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-green-500/20">
            👮
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Field Ops</h1>
            <p className="text-green-400 font-medium text-[11px] uppercase tracking-widest mt-0.5">{user.police_station || 'HQ'}</p>
          </div>
        </div>
        <button onClick={() => { logout(); router.push('/login'); }} className="text-xs font-semibold text-slate-500 hover:text-red-400 bg-white/[0.03] border border-white/5 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all">
          Sign Out
        </button>
      </div>

      {/* Clock In/Out Hero */}
      <div className={`bg-white/[0.02] border rounded-3xl p-6 mb-6 backdrop-blur-xl shadow-2xl relative z-10 overflow-hidden transition-colors duration-500 ${isClockedIn ? 'border-green-500/30' : 'border-white/5'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <p className="font-bold text-white text-lg">Duty Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`relative flex h-2 w-2`}>
                {isClockedIn && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isClockedIn ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </span>
              <p className={`text-xs font-bold uppercase tracking-wider ${isClockedIn ? 'text-green-400' : 'text-red-400'}`}>
                {isClockedIn ? 'On Duty Active' : 'Off Duty'}
              </p>
            </div>
          </div>
          <button
            onClick={isClockedIn ? clockOut : clockIn}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
              isClockedIn
                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-500/25 border border-green-500/30'
            }`}
          >
            {isClockedIn ? '⏹ Clock Out' : '▶ Clock In'}
          </button>
        </div>

        {location && (
          <div className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-sm">📍</span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Live GPS Coordinator</p>
              <p className="text-slate-300 text-xs font-mono">{location.lat.toFixed(5)}, {location.lon.toFixed(5)}</p>
            </div>
            <div className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-md font-bold uppercase tracking-widest border border-green-500/30">
              Tracking
            </div>
          </div>
        )}
      </div>

      {/* Congestion Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5 mb-6 space-y-3 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-red-400 font-bold text-sm flex items-center gap-2 uppercase tracking-widest">
            <span className="animate-pulse">🚨</span> Proximity Alerts
          </p>
          {alerts.map((a, i) => (
            <div key={i} className="bg-red-950/40 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">{a.junction_name}</p>
                <p className="text-red-300 text-[11px] mt-0.5 uppercase tracking-wider font-semibold">Severity {a.total_severity?.toFixed(1)}</p>
              </div>
              <div className="text-right">
                <p className="text-red-400 font-black text-lg">{(a.distance_m / 1000).toFixed(1)}</p>
                <p className="text-red-500/80 text-[10px] font-bold uppercase tracking-widest -mt-1">km away</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Violation Photo */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 mb-6 relative z-10 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg">📸</div>
          <div>
            <p className="font-bold text-white">Capture Evidence</p>
            <p className="text-[11px] text-slate-400">Directly tag and upload violations</p>
          </div>
        </div>
        
        {!location && (
          <p className="text-[11px] text-amber-400 font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-center">
            ⚠️ Clock in first to enable GPS
          </p>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUploadViolation} />
        
        <button
          onClick={() => fileRef.current?.click()}
          disabled={!location || uploading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
        >
          {uploading ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading to HQ…</>
          ) : (
            '📷 Snap Photo'
          )}
        </button>
        {uploadSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs mt-3 p-3 rounded-xl text-center font-bold flex items-center justify-center gap-2">
            ✅ <span className="uppercase tracking-widest">Evidence Uploaded</span>
          </div>
        )}
      </div>

      {/* Assigned Tasks */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 relative z-10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <p className="font-bold text-white text-lg">Active Tasks</p>
          </div>
          <button onClick={loadTasks} className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 bg-blue-400/10 px-3 py-1.5 rounded-lg transition-colors">
            Refresh
          </button>
        </div>
        
        {tasks.length === 0 ? (
          <div className="text-center bg-black/20 border border-white/5 rounded-2xl p-6">
            <p className="text-slate-500 text-sm font-medium">No tasks assigned currently</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(t => (
              <div key={t.id} className="bg-black/40 border border-white/5 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                    Dispatch
                  </span>
                  <p className="text-blue-400/70 text-[10px] font-mono">{new Date(t.created_at).toLocaleTimeString()}</p>
                </div>
                <p className="text-white font-medium text-sm mb-1">{t.description || 'Illegal parking reported by citizen'}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px]">📍</span>
                  <p className="text-slate-500 text-[11px] font-mono">{t.latitude?.toFixed(5)}, {t.longitude?.toFixed(5)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
