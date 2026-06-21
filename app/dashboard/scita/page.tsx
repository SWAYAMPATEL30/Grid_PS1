'use client';

import { useState, useEffect } from 'react';
import { useApiFetch } from '@/context/auth-context';
import { Database, UploadCloud, Clock, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function SCITADashboard() {
  const apiFetch = useApiFetch();
  const [overview, setOverview] = useState<any>(null);
  const [byStation, setByStation] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/scita/overview'),
      apiFetch('/api/scita/by-station'),
      apiFetch('/api/scita/timeline')
    ]).then(([ov, bs, tl]) => {
      if (ov && !ov.error) setOverview(ov);
      if (Array.isArray(bs)) setByStation(bs);
      if (Array.isArray(tl)) setTimeline(tl);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="text-indigo-400" /> SCITA Integration Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time synchronization metrics with State Crime Investigation & Tracking Application
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm font-semibold">
          <Activity className="w-4 h-4 animate-pulse" /> Live Sync Active
        </div>
      </div>

      {/* Top Metrics */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 text-slate-400 mb-2 text-sm font-medium">
              <ShieldCheck className="w-5 h-5 text-blue-400" /> Total Violations
            </div>
            <p className="text-3xl font-black text-white">{overview.total_records?.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 text-slate-400 mb-2 text-sm font-medium">
              <UploadCloud className="w-5 h-5 text-green-400" /> Sent to SCITA
            </div>
            <p className="text-3xl font-black text-green-400">{overview.sent_to_scita?.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 text-slate-400 mb-2 text-sm font-medium">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Pending Sync
            </div>
            <p className="text-3xl font-black text-amber-400">{overview.not_sent?.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 text-slate-400 mb-2 text-sm font-medium">
              <Clock className="w-5 h-5 text-purple-400" /> Avg Sync Delay
            </div>
            <p className="text-3xl font-black text-white">
              {overview.avg_transmission_delay_mins > 60 
                ? `${(overview.avg_transmission_delay_mins / 60).toFixed(1)}h` 
                : `${overview.avg_transmission_delay_mins?.toFixed(1)}m`}
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">SCITA Transmission Timeline</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f1f5f9' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="none" strokeWidth={2} name="Total Violations" />
                <Area type="monotone" dataKey="sent" stroke="#22c55e" fillOpacity={1} fill="url(#colorSent)" strokeWidth={2} name="Synced to SCITA" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Station Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <h2 className="font-semibold text-white mb-4 flex justify-between items-center">
            <span>Station Sync Status</span>
            <span className="text-xs text-slate-500 font-normal">Top 10</span>
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {byStation.slice(0, 10).map((station, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-200 truncate pr-2">{station.station}</span>
                  <span className={`text-xs font-bold ${station.rate >= 95 ? 'text-green-400' : station.rate >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                    {station.rate}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${station.rate}%` }} />
                  <div className="h-full bg-amber-500 rounded-r-full" style={{ width: `${100 - station.rate}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                  <span>{station.sent?.toLocaleString()} synced</span>
                  <span>{(station.total - station.sent)?.toLocaleString()} pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}
