'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function OwnerPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [searchVehicle, setSearchVehicle] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [appealSuccess, setAppealSuccess] = useState(false);
  const [notifHistory, setNotifHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  const handleSearch = async () => {
    if (!searchVehicle.trim()) return;
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/api/notifications/vehicle/${encodeURIComponent(searchVehicle.trim())}/violations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
      // Load notification history
      const nRes = await fetch(`${API_BASE}/api/notifications/history/${encodeURIComponent(searchVehicle.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nJson = await nRes.json();
      if (Array.isArray(nJson)) setNotifHistory(nJson);
    } catch {}
    setLoading(false);
  };

  const handleAppeal = async () => {
    if (!appealText.trim() || !searchVehicle) return;
    try {
      await fetch(`${API_BASE}/api/notifications/vehicle/${encodeURIComponent(searchVehicle)}/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vehicle_number: searchVehicle, reason: appealText }),
      });
      setAppealSuccess(true);
      setAppealText('');
      setTimeout(() => setAppealSuccess(false), 3000);
    } catch {}
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 p-4 max-w-2xl mx-auto relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-[10%] left-[-20%] w-[60%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20">
            🚗
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Owner Portal</h1>
            <p className="text-cyan-400 font-medium text-[11px] uppercase tracking-widest mt-0.5">Manage Violations</p>
          </div>
        </div>
        <button onClick={() => { logout(); router.push('/login'); }} className="text-xs font-semibold text-slate-500 hover:text-red-400 bg-white/[0.03] border border-white/5 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all">
          Sign Out
        </button>
      </div>

      {/* Vehicle Search */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 mb-6 backdrop-blur-xl shadow-2xl relative z-10">
        <h2 className="font-bold text-white text-lg mb-1">🔍 Vehicle Lookup</h2>
        <p className="text-xs text-slate-400 mb-5">Enter your vehicle registration number to check violations.</p>
        
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              value={searchVehicle}
              onChange={e => setSearchVehicle(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. KA01AB1234"
              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 uppercase tracking-widest font-mono transition-all"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">📝</span>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchVehicle}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl px-6 py-4 text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center min-w-[120px]"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Lookup →'}
          </button>
        </div>
      </div>

      {data && (
        <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-rose-600 drop-shadow-sm mb-1">{data.total_violations}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Violations</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-orange-500 drop-shadow-sm mb-1">{notifHistory.length}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Alerts Received</p>
            </div>
          </div>

          {/* Violations List */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 mb-6 backdrop-blur-xl">
            <h2 className="font-bold text-white text-lg mb-4">🚨 Violation History</h2>
            {data.violations?.length === 0 ? (
              <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-green-400 font-bold text-sm">No violations found!</p>
                <p className="text-slate-500 text-xs mt-1">Keep up the good driving.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {data.violations?.map((v: any, i: number) => (
                  <div key={v.id || i} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:bg-black/60 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 shrink-0">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 font-bold text-sm mb-0.5 truncate">{v.police_station || 'Traffic Fine'}</p>
                      <p className="text-slate-400 text-xs truncate">{v.junction_name || v.vehicle_type}</p>
                      <p className="text-slate-500 text-[10px] font-mono mt-1">{v.created_datetime ? new Date(v.created_datetime).toLocaleString() : '—'}</p>
                    </div>
                    <span className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                      v.validation_status === 'valid' ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {v.validation_status || 'pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification History */}
          {notifHistory.length > 0 && (
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 mb-6 backdrop-blur-xl">
              <h2 className="font-bold text-white text-lg mb-4">📬 Recent Alerts</h2>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                {notifHistory.map((n: any) => (
                  <div key={n.id} className="bg-black/40 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">{n.type}</span>
                      <span className="text-slate-500 text-[10px] font-mono">{new Date(n.sent_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appeal Form */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            <h2 className="font-bold text-white text-lg mb-1 relative z-10">⚖️ File an Appeal</h2>
            <p className="text-xs text-slate-400 mb-4 relative z-10">Believe a ticket was issued in error? Submit an appeal for review.</p>
            
            <textarea
              value={appealText}
              onChange={e => setAppealText(e.target.value)}
              placeholder="Describe why you are appealing this violation…"
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-none mb-4 transition-all relative z-10"
            />
            <button
              onClick={handleAppeal}
              disabled={!appealText.trim() || appealSuccess}
              className={`w-full rounded-2xl py-4 text-sm font-bold transition-all relative z-10 flex items-center justify-center gap-2 shadow-lg ${
                appealSuccess
                  ? 'bg-green-500 text-white shadow-green-500/30'
                  : 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {appealSuccess ? '✅ Appeal Submitted Successfully' : 'Submit Appeal Request →'}
            </button>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
