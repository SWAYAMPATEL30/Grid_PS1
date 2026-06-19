'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Zone } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadZones = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getZones();
        setZones(data);
      } catch (error) {
        console.error('Failed to load zones:', error);
      } finally {
        setLoading(false);
      }
    };

    loadZones();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Enforcement Zones</h1>
          <p className="mt-2 text-slate-400">Create and manage parking enforcement zones with custom rules</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" />
          New Zone
        </Button>
      </div>

      {/* Zones Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {zones.map(zone => (
          <div key={zone.id} className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{zone.name}</h3>
                <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                  <Clock className="h-4 w-4" />
                  {zone.enforcementHours.start}:00 - {zone.enforcementHours.end}:00
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Edit2 className="h-4 w-4 text-slate-400 hover:text-slate-100" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Violations</p>
                <p className="text-2xl font-bold text-slate-100">{zone.violationCount || 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Compliance Rate</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 rounded-full h-2">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${zone.complianceRate || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-100">{zone.complianceRate || 0}%</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Rules</p>
              <ul className="space-y-1">
                {zone.rules.map((rule, idx) => (
                  <li key={idx} className="text-xs text-slate-400">• {rule}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
