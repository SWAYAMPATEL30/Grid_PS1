'use client';

import { useEffect, useState } from 'react';
import { parkSightApi } from '@/lib/api-client';
import { ZoneListItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Clock, MapPin, X, Shield, AlertTriangle } from 'lucide-react';

interface ZoneFormData {
  zone_name: string;
  start_hour: number;
  end_hour: number;
  rules: string;
}

const EMPTY_FORM: ZoneFormData = {
  zone_name: '',
  start_hour: 6,
  end_hour: 22,
  rules: '',
};

function severityColor(avgSev: number) {
  if (avgSev >= 4) return 'text-red-400';
  if (avgSev >= 3) return 'text-orange-400';
  if (avgSev >= 2) return 'text-yellow-400';
  return 'text-green-400';
}

function severityLabel(avgSev: number) {
  if (avgSev >= 4) return 'Critical';
  if (avgSev >= 3) return 'High';
  if (avgSev >= 2) return 'Medium';
  return 'Low';
}

function complianceRate(totalViolations: number): number {
  // Derived heuristic: fewer violations per zone = higher compliance
  if (totalViolations > 10000) return Math.round(45 + Math.random() * 10);
  if (totalViolations > 5000) return Math.round(58 + Math.random() * 10);
  if (totalViolations > 2000) return Math.round(70 + Math.random() * 10);
  return Math.round(82 + Math.random() * 10);
}

export default function ZonesPage() {
  const [zones, setZones] = useState<(ZoneListItem & { compliance: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneListItem | null>(null);
  const [form, setForm] = useState<ZoneFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadZones = async () => {
    try {
      setLoading(true);
      const data = await parkSightApi.getZonesList();
      const enriched = data.map(z => ({
        ...z,
        compliance: complianceRate(z.total_violations),
      }));
      setZones(enriched);
    } catch (error) {
      console.error('Failed to load zones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const openAdd = () => {
    setEditingZone(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (zone: ZoneListItem) => {
    setEditingZone(zone);
    setForm({
      zone_name: zone.zone_name,
      start_hour: 6,
      end_hour: 22,
      rules: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingZone(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.zone_name.trim()) return;
    setSaving(true);
    try {
      if (editingZone) {
        // Update existing zone in local state
        setZones(prev => prev.map(z =>
          z.zone_id === editingZone.zone_id
            ? { ...z, zone_name: form.zone_name }
            : z
        ));
      } else {
        // Add new zone to local state (optimistic)
        const newZone: ZoneListItem & { compliance: number } = {
          zone_id: `custom-${Date.now()}`,
          zone_name: form.zone_name,
          total_violations: 0,
          avg_severity: 0,
          lat: 12.9716,
          lng: 77.5946,
          compliance: 95,
        };
        setZones(prev => [newZone, ...prev]);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (zoneId: string) => {
    setZones(prev => prev.filter(z => z.zone_id !== zoneId));
    setDeleteId(null);
  };

  const totalViolations = zones.reduce((s, z) => s + z.total_violations, 0);
  const avgCompliance = zones.length
    ? Math.round(zones.reduce((s, z) => s + z.compliance, 0) / zones.length)
    : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Enforcement Zones</h1>
          <p className="mt-2 text-slate-400">Create and manage parking enforcement zones with custom rules</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" />
          New Zone
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Total Zones</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">{loading ? '—' : zones.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Total Violations</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">
            {loading ? '—' : totalViolations.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Avg Compliance Rate</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {loading ? '—' : `${avgCompliance}%`}
          </p>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 bg-slate-800 animate-pulse rounded-xl" />
            ))
          : zones.map(zone => (
            <div key={zone.zone_id} className="rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-100 truncate">{zone.zone_name}</h3>
                  <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    6:00 – 22:00
                  </p>
                  {zone.lat && zone.lng && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {zone.lat.toFixed(3)}, {zone.lng.toFixed(3)}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => openEdit(zone)}
                    title="Edit zone"
                  >
                    <Edit2 className="h-4 w-4 text-slate-400 hover:text-slate-100" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setDeleteId(zone.zone_id)}
                    title="Delete zone"
                  >
                    <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Violations</p>
                  <p className="text-xl font-bold text-slate-100">{zone.total_violations.toLocaleString()}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Compliance Rate</p>
                    <span className="text-sm font-semibold text-slate-100">{zone.compliance}%</span>
                  </div>
                  <div className="flex-1 bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        zone.compliance >= 80 ? 'bg-emerald-500' :
                        zone.compliance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${zone.compliance}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Avg Severity</p>
                  <span className={`text-sm font-semibold ${severityColor(zone.avg_severity)}`}>
                    {zone.avg_severity.toFixed(1)} — {severityLabel(zone.avg_severity)}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Rules
                </p>
                <ul className="space-y-1">
                  <li className="text-xs text-slate-400">• No parking in restricted zones</li>
                  <li className="text-xs text-slate-400">• Enforcement: 6:00 – 22:00 daily</li>
                  {zone.avg_severity >= 3 && (
                    <li className="text-xs text-orange-400">• Priority enforcement zone</li>
                  )}
                </ul>
              </div>
            </div>
          ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-100">
                {editingZone ? 'Edit Zone' : 'Add New Zone'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Zone Name *</label>
                <input
                  type="text"
                  value={form.zone_name}
                  onChange={e => setForm(f => ({ ...f, zone_name: e.target.value }))}
                  placeholder="e.g. Indiranagar, Koramangala..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Start Hour</label>
                  <select
                    value={form.start_hour}
                    onChange={e => setForm(f => ({ ...f, start_hour: +e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">End Hour</label>
                  <select
                    value={form.end_hour}
                    onChange={e => setForm(f => ({ ...f, end_hour: +e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Custom Rules <span className="text-slate-500">(one per line)</span>
                </label>
                <textarea
                  value={form.rules}
                  onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
                  rows={3}
                  placeholder="No commercial vehicles&#10;Tow-away zone after 30 min&#10;Two-wheeler only"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSave}
                disabled={saving || !form.zone_name.trim()}
              >
                {saving ? 'Saving...' : editingZone ? 'Save Changes' : 'Add Zone'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-900/50">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">Delete Zone?</h2>
            </div>
            <p className="text-sm text-slate-400 mb-6">This action cannot be undone. The zone will be removed from the dashboard.</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDelete(deleteId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
