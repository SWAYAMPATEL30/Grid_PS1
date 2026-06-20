'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function CitizenPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'CITIZEN' && user.role !== 'ADMIN') router.push('/login');
    loadReports();
  }, [user, router]);

  const loadReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setReports(data);
    } catch {}
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      ).catch(() => null);

      const lat = pos?.coords.latitude ?? 12.9716;
      const lon = pos?.coords.longitude ?? 77.5946;

      const fd = new FormData();
      fd.append('photo', file);
      fd.append('lat', String(lat));
      fd.append('lon', String(lon));
      if (description) fd.append('description', description);

      const res = await fetch(`${API_BASE}/api/reports/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        setSuccess(true);
        setFile(null);
        setPreview(null);
        setDescription('');
        setTimeout(() => { setSuccess(false); loadReports(); }, 3000);
      }
    } catch {}
    setUploading(false);
  };

  const statusColor: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-400/10 border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]',
    verified: 'text-blue-400 bg-blue-400/10 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
    rejected: 'text-red-400 bg-red-400/10 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    assigned: 'text-purple-400 bg-purple-400/10 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    resolved: 'text-green-400 bg-green-400/10 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
  };

  const statusIcon: Record<string, string> = {
    pending: '⏳', verified: '✅', rejected: '❌', assigned: '👮', resolved: '🏁',
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 p-4 max-w-lg mx-auto relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
            👤
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Citizen Portal</h1>
            <p className="text-blue-400 font-medium text-[11px] uppercase tracking-widest mt-0.5">Report Violations</p>
          </div>
        </div>
        <button onClick={() => { logout(); router.push('/login'); }} className="text-xs font-semibold text-slate-500 hover:text-red-400 bg-white/[0.03] border border-white/5 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all">
          Sign Out
        </button>
      </div>

      {/* Report Form */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 mb-8 backdrop-blur-xl shadow-2xl relative z-10">
        <h2 className="font-bold text-white text-lg mb-1">📸 Upload Evidence</h2>
        <p className="text-xs text-slate-400 mb-5">Snap a photo of the illegally parked vehicle. GPS is added automatically.</p>

        {/* Photo Upload Area */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed ${preview ? 'border-transparent' : 'border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5'} rounded-2xl p-2 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[200px] relative overflow-hidden group mb-4 shadow-inner`}
        >
          {preview ? (
            <>
              <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <p className="text-white font-semibold flex items-center gap-2"><span>🔄</span> Change Photo</p>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                📷
              </div>
              <p className="text-slate-300 font-medium text-sm">Tap to take photo</p>
              <p className="text-slate-500 text-[11px] mt-1">JPEG, PNG • Max 10MB</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

        <div className="space-y-4">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add vehicle number or details (optional)…"
            rows={2}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none transition-all"
          />

          <button
            onClick={handleSubmit}
            disabled={!file || uploading || success}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
              success 
                ? 'bg-green-500 text-white shadow-green-500/30' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading securely…</>
            ) : success ? (
              '✅ Report Submitted Successfully!'
            ) : (
              'Submit Report →'
            )}
          </button>
        </div>
      </div>

      {/* My Reports */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-lg">📋 My Reports History</h2>
          <button onClick={loadReports} className="text-[11px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors bg-blue-400/10 px-3 py-1.5 rounded-full">
            Refresh
          </button>
        </div>
        
        {reports.length === 0 ? (
          <div className="text-center text-slate-500 py-12 bg-white/[0.02] rounded-3xl border border-white/5 border-dashed">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 opacity-50">📭</div>
            <p className="font-medium text-slate-400">No reports submitted yet</p>
            <p className="text-xs mt-1">Your uploaded evidence will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="bg-white/[0.03] hover:bg-white/[0.05] transition-colors border border-white/5 rounded-2xl p-4 flex gap-4 items-center">
                <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-white/10">
                  {r.photo_url ? (
                    <img src={`${API_BASE}${r.photo_url}`} className="w-full h-full object-cover" alt="violation" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-widest ${statusColor[r.status] || 'text-slate-400'}`}>
                      {statusIcon[r.status]} {r.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 truncate">{r.description || 'Illegal parking report'}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">📍 {r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
