'use client';

import { useEffect, useState } from 'react';
import { parkSightApi } from '@/lib/api-client';
import { OffenderSummary } from '@/lib/types';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<OffenderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatterns = async () => {
      try {
        setLoading(true);
        const data = await parkSightApi.getOffendersList({ limit: 50 });
        setPatterns(data);
      } catch (error) {
        console.error('Failed to load patterns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatterns();
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Violation Patterns</h1>
        <p className="mt-2 text-slate-400">Behavioral analysis and repeat violator detection</p>
      </div>

      {/* High Risk Violators */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="border-b border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Top Repeat Violators
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">License Plate</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Violations</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Vehicle Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Distinct Zones</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((pattern, idx) => (
                <tr key={idx} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{pattern.vehicle_number}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      pattern.total_violations > 10 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      pattern.total_violations > 5 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {pattern.total_violations}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 capitalize">
                    {pattern.vehicle_type?.replace(/_/g, ' ') || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{pattern.distinct_zones}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      pattern.status === 'HABITUAL' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      pattern.status === 'REPEAT' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {pattern.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {new Date(pattern.last_seen).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {patterns.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    No repeat violators found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pattern Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Repeat Offenders</p>
          <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">{patterns.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg Violations per Offender</p>
          <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">
            {(patterns.reduce((sum, p) => sum + p.total_violations, 0) / (patterns.length || 1)).toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Violations Tracked</p>
          <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">
            {patterns.reduce((sum, p) => sum + p.total_violations, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
