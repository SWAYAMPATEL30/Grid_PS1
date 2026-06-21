'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function TowPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!['TOW_OPERATOR', 'ADMIN'].includes(user.role)) router.push('/login');
    loadAssignments();
  }, [user, router]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      // Fetch tow assignments for this operator
      const res = await fetch(`${API_BASE}/api/tow/my-assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setAssignments(data);
    } catch {
      // Fallback demo data if endpoint not yet seeded
      setAssignments([
        { id: 'demo-1', violation_id: 'V-1001', status: 'assigned', assigned_at: new Date().toISOString(), latitude: 12.9716, longitude: 77.5946, location: 'MG Road Junction' },
        { id: 'demo-2', violation_id: 'V-1042', status: 'in_progress', assigned_at: new Date(Date.now() - 3600000).toISOString(), latitude: 12.9568, longitude: 77.7011, location: 'Marathahalli Bridge' },
      ]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await fetch(`${API_BASE}/api/tow/assignments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch {
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
    setUpdating(null);
  };

  const statusConfig: Record<string, { label: string; color: string; next: string; nextLabel: string }> = {
    assigned:    { label: 'Assigned', color: 'text-blue-400 bg-blue-900/30 border-blue-700/40',       next: 'in_progress', nextLabel: '🚛 Start Job' },
    in_progress: { label: 'In Progress', color: 'text-amber-400 bg-amber-900/30 border-amber-700/40', next: 'completed',   nextLabel: '✅ Mark Complete' },
    completed:   { label: 'Completed', color: 'text-green-400 bg-green-900/30 border-green-700/40',   next: '',            nextLabel: '' },
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🚛 Tow Operator</h1>
          <p className="text-slate-400 text-xs">{user.full_name} · My Assignments</p>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={loadAssignments} className="text-xs text-blue-400 hover:text-blue-300">↻</button>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Logout</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['assigned', 'in_progress', 'completed'] as const).map(s => (
          <div key={s} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-white">{assignments.filter(a => a.status === s).length}</p>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{s.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl p-12">
          <p className="text-5xl mb-4">🏁</p>
          <p className="text-slate-300 font-medium">No assignments</p>
          <p className="text-slate-500 text-sm">You're all clear for now</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(a => {
            const cfg = statusConfig[a.status] || statusConfig.assigned;
            return (
              <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white text-sm">Job #{a.violation_id?.slice(-6) || a.id.slice(-6)}</p>
                    <p className="text-xs text-slate-500">{new Date(a.assigned_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Location */}
                <div className="bg-slate-800 rounded-xl px-4 py-3 mb-3 flex items-center gap-3">
                  <span className="text-lg">📍</span>
                  <div className="flex-1">
                    <p className="text-slate-200 text-sm font-medium">{a.location || 'Location details'}</p>
                    {a.latitude && <p className="text-slate-500 text-xs">{Number(a.latitude).toFixed(5)}, {Number(a.longitude).toFixed(5)}</p>}
                  </div>
                  {a.latitude && (
                    <a
                      href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium bg-blue-900/20 border border-blue-700/30 px-3 py-1.5 rounded-lg"
                    >
                      Open Maps →
                    </a>
                  )}
                </div>

                {cfg.next && (
                  <button
                    onClick={() => updateStatus(a.id, cfg.next)}
                    disabled={updating === a.id}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-all"
                  >
                    {updating === a.id ? 'Updating…' : cfg.nextLabel}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
