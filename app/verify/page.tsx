'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function VerifyPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [officers, setOfficers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!['VERIFIER', 'ADMIN', 'ANALYST'].includes(user.role)) router.push('/login');
    loadData();
  }, [user, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, oRes] = await Promise.all([
        fetch(`${API_BASE}/api/reports/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/officers/active`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const rData = await rRes.json();
      const oData = await oRes.json();
      if (Array.isArray(rData)) setReports(rData);
      if (Array.isArray(oData)) setOfficers(oData);
    } catch {}
    setLoading(false);
  };

  const handleVerify = async (id: string, isValid: boolean) => {
    setActionLoading(id);
    try {
      await fetch(`${API_BASE}/api/reports/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_valid: isValid }),
      });
      setReports(prev => prev.filter(r => r.id !== id));
    } catch {}
    setActionLoading(null);
  };

  const handleAssign = async (reportId: string, officerId: string) => {
    setActionLoading(reportId + '-assign');
    try {
      await fetch(`${API_BASE}/api/reports/${reportId}/assign?officer_id=${officerId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'assigned' } : r));
    } catch {}
    setActionLoading(null);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">✅ Verifier Dashboard</h1>
          <p className="text-slate-400 text-xs">Review citizen reports and assign to officers</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="text-xs text-blue-400 hover:text-blue-300">↻ Refresh</button>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Logout</button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-400">{reports.length}</p>
          <p className="text-xs text-slate-400 mt-1">Pending Review</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-green-400">{officers.length}</p>
          <p className="text-xs text-slate-400 mt-1">Active Officers</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-blue-400">0</p>
          <p className="text-xs text-slate-400 mt-1">Resolved Today</p>
        </div>
      </div>

      {/* Active Officers */}
      {officers.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5">
          <p className="text-sm font-semibold text-white mb-3">👮 Active Officers</p>
          <div className="flex flex-wrap gap-2">
            {officers.map((o: any) => (
              <div key={o.id} className="bg-green-900/20 border border-green-700/30 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 font-medium">{o.full_name}</span>
                <span className="text-slate-500">{o.police_station}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Queue */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl p-12">
          <p className="text-5xl mb-4">🎉</p>
          <p className="text-slate-300 font-medium">All caught up!</p>
          <p className="text-slate-500 text-sm">No pending reports to verify</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Photo */}
              {r.photo_url && (
                <div className="h-48 bg-slate-800 overflow-hidden">
                  <img
                    src={`${API_BASE}${r.photo_url}`}
                    alt="Violation"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%231e293b" width="400" height="200"/><text x="200" y="110" text-anchor="middle" fill="%2364748b" font-size="14">No preview available</text></svg>'; }}
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</span>
                  <span className="text-xs bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded-lg border border-amber-700/30">⏳ PENDING</span>
                </div>
                <p className="text-sm text-slate-200 mb-1">{r.description || 'No description provided'}</p>
                <p className="text-xs text-slate-500 mb-4">📍 {r.latitude?.toFixed(5)}, {r.longitude?.toFixed(5)}</p>

                {/* Actions */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => handleVerify(r.id, true)}
                    disabled={actionLoading === r.id}
                    className="flex-1 bg-green-600/20 hover:bg-green-600/40 border border-green-600/40 text-green-400 rounded-xl py-2 text-xs font-semibold transition-all"
                  >
                    {actionLoading === r.id ? '...' : '✅ Approve'}
                  </button>
                  <button
                    onClick={() => handleVerify(r.id, false)}
                    disabled={actionLoading === r.id}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/40 border border-red-600/40 text-red-400 rounded-xl py-2 text-xs font-semibold transition-all"
                  >
                    ❌ Reject
                  </button>
                </div>

                {/* Assign to officer */}
                {officers.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <select
                      onChange={e => e.target.value && handleAssign(r.id, e.target.value)}
                      defaultValue=""
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Assign to officer…</option>
                      {officers.map((o: any) => (
                        <option key={o.id} value={o.id}>{o.full_name} — {o.police_station}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
