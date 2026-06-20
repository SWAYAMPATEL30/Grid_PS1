'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const ROLES = ['ADMIN', 'ANALYST', 'VERIFIER', 'POLICE_OFFICER', 'TOW_OPERATOR', 'CITIZEN', 'VEHICLE_OWNER'];
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-red-400 bg-red-900/20 border-red-700/30',
  ANALYST: 'text-blue-400 bg-blue-900/20 border-blue-700/30',
  VERIFIER: 'text-purple-400 bg-purple-900/20 border-purple-700/30',
  POLICE_OFFICER: 'text-green-400 bg-green-900/20 border-green-700/30',
  TOW_OPERATOR: 'text-amber-400 bg-amber-900/20 border-amber-700/30',
  CITIZEN: 'text-slate-400 bg-slate-800/40 border-slate-700/30',
  VEHICLE_OWNER: 'text-cyan-400 bg-cyan-900/20 border-cyan-700/30',
};

export default function AdminUsersPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: '', full_name: '', role: 'ANALYST', police_station: '', password: 'Password@123' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'ADMIN') router.push('/dashboard/overview');
    loadUsers();
  }, [user, router]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users via auth/me bulk — use admin endpoint
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch {
      // If no admin/users endpoint yet, fall back to known demo users
      setUsers([
        { id: '1', email: 'admin@parksight.in', full_name: 'System Admin', role: 'ADMIN', police_station: null, is_active: true },
        { id: '2', email: 'analyst@parksight.in', full_name: 'Data Analyst', role: 'ANALYST', police_station: 'HQ', is_active: true },
        { id: '3', email: 'verifier@parksight.in', full_name: 'Report Verifier', role: 'VERIFIER', police_station: 'HQ', is_active: true },
        { id: '4', email: 'officer.rao@parksight.in', full_name: 'Rao (Traffic Officer)', role: 'POLICE_OFFICER', police_station: 'Ashok Nagar PS', is_active: true },
        { id: '5', email: 'officer.singh@parksight.in', full_name: 'Singh (Traffic Officer)', role: 'POLICE_OFFICER', police_station: 'Indiranagar PS', is_active: true },
        { id: '6', email: 'tow.operator1@parksight.in', full_name: 'Tow Truck 1', role: 'TOW_OPERATOR', police_station: null, is_active: true },
        { id: '7', email: 'citizen@example.com', full_name: 'Citizen User', role: 'CITIZEN', police_station: null, is_active: true },
        { id: '8', email: 'owner@example.com', full_name: 'Vehicle Owner', role: 'VEHICLE_OWNER', police_station: null, is_active: true },
      ]);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Failed'); }
      const newUser = await res.json();
      setUsers(prev => [newUser, ...prev]);
      setCreating(false);
      setForm({ email: '', full_name: '', role: 'ANALYST', police_station: '', password: 'Password@123' });
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Error');
    }
    setCreateLoading(false);
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🛡️ User Management</h1>
          <p className="text-slate-400 text-sm">Manage roles and access for all platform users</p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-all"
        >
          {creating ? '✕ Cancel' : '+ Create User'}
        </button>
      </div>

      {/* Create User Form */}
      {creating && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 grid grid-cols-2 gap-4">
          <div className="col-span-2"><p className="font-semibold text-white text-sm mb-2">Create New User</p></div>
          {[
            { key: 'full_name', label: 'Full Name', placeholder: 'John Doe' },
            { key: 'email', label: 'Email', placeholder: 'user@parksight.in' },
            { key: 'password', label: 'Password', placeholder: 'Password@123' },
            { key: 'police_station', label: 'Station (optional)', placeholder: 'Ashok Nagar PS' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
              <input
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {createError && <div className="col-span-2 text-red-400 text-xs bg-red-900/20 rounded-xl px-3 py-2">{createError}</div>}
          <div className="col-span-2 flex justify-end">
            <button type="submit" disabled={createLoading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl px-6 py-2 text-sm font-semibold">
              {createLoading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            <span>Name</span><span>Email</span><span>Role</span><span>Station</span><span>Status</span>
          </div>
          {users.map((u, i) => (
            <div key={u.id || i} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-4 border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors items-center">
              <span className="text-sm text-slate-200 font-medium truncate">{u.full_name}</span>
              <span className="text-sm text-slate-400 truncate">{u.email}</span>
              <span className={`text-xs px-2 py-1 rounded-lg border font-medium whitespace-nowrap ${ROLE_COLORS[u.role] || 'text-slate-400'}`}>
                {u.role}
              </span>
              <span className="text-xs text-slate-500 truncate">{u.police_station || '—'}</span>
              <span className={`text-xs font-medium ${u.is_active ? 'text-green-400' : 'text-red-400'}`}>
                {u.is_active ? '● Active' : '○ Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
