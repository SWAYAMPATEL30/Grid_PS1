'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { ComplianceEntity } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, TrendingDown } from 'lucide-react';

export default function CompliancePage() {
  const [entities, setEntities] = useState<ComplianceEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<'all' | 'vehicle' | 'driver' | 'dashboard'>('all');

  useEffect(() => {
    const loadEntities = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getComplianceEntities(1, 50);
        setEntities(response.items);
      } catch (error) {
        console.error('Failed to load compliance data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEntities();
  }, []);

  const filtered = activeType === 'all' ? entities : entities.filter(e => e.type === activeType);

  const avgScore = entities.length > 0 ? Math.round(entities.reduce((sum, e) => sum + e.complianceScore, 0) / entities.length) : 0;
  const riskCount = entities.filter(e => e.complianceScore < 60).length;

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Compliance Dashboard</h1>
        <p className="mt-2 text-slate-400">Vehicle, driver, and dashboard compliance scoring and tracking</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Average Compliance Score</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{avgScore}%</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">High Risk Entities</p>
          <p className="mt-2 text-3xl font-bold text-red-400">{riskCount}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Tracked Entities</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{entities.length}</p>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <Tabs value={activeType} onValueChange={(val) => setActiveType(val as any)} className="w-full">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="vehicle">Vehicles</TabsTrigger>
              <TabsTrigger value="driver">Drivers</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboards</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Entity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Violations</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Compliance Score</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Last Violation</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entity, idx) => (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-100">{entity.name}</td>
                  <td className="px-6 py-4 text-sm capitalize text-slate-300">{entity.type}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{entity.violationCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-full rounded-full ${
                            entity.complianceScore >= 80 ? 'bg-green-500' :
                            entity.complianceScore >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${entity.complianceScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-100">{entity.complianceScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                      entity.complianceScore >= 80 ? 'bg-green-900/30 text-green-400' :
                      entity.complianceScore >= 60 ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {entity.complianceScore >= 80 ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {entity.complianceScore >= 80 ? 'Good' : entity.complianceScore >= 60 ? 'Fair' : 'Poor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {entity.lastViolation ? entity.lastViolation.toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
