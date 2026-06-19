'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnalyticsPage() {
  const [violationsByType, setViolationsByType] = useState<Record<string, number>>({});
  const [violationsByStatus, setViolationsByStatus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [typeData, statusData] = await Promise.all([
          apiClient.getViolationsByType(),
          apiClient.getViolationsByStatus()
        ]);
        setViolationsByType(typeData);
        setViolationsByStatus(statusData);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const typeChartData = Object.entries(violationsByType).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    count
  }));

  const statusChartData = Object.entries(violationsByStatus).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    count
  }));

  const totalViolations = Object.values(violationsByType).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Advanced Analytics</h1>
          <p className="mt-2 text-slate-400">Detailed reporting and custom dashboards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Total Violations</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{(totalViolations || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Most Common Type</p>
          <p className="mt-2 text-lg font-bold text-slate-100">
            {Object.entries(violationsByType).sort((a, b) => b[1] - a[1])[0]?.[0].replace(/_/g, ' ') || '—'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Resolution Rate</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">78%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Violations by Type</h2>
          {typeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 bg-slate-800 animate-pulse rounded" />
          )}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Violations by Status</h2>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 bg-slate-800 animate-pulse rounded" />
          )}
        </div>
      </div>
    </div>
  );
}
