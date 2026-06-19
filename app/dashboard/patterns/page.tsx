'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { PatternAnalysis } from '@/lib/types';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<PatternAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatterns = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getRepeatViolators();
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
      <div className="rounded-lg border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Top Repeat Violators
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">License Plate</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Violations</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Primary Violation</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Preferred Zones</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Risk Score</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Last Violation</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((pattern, idx) => (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-100">{pattern.licensePlate}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      pattern.violationCount > 10 ? 'bg-red-900/30 text-red-400' :
                      pattern.violationCount > 5 ? 'bg-orange-900/30 text-orange-400' :
                      'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {pattern.violationCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300 capitalize">{pattern.violationType.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{pattern.preferredZones.join(', ')}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="w-16 bg-slate-800 rounded-full h-2">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${pattern.riskScore * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{pattern.lastViolation.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pattern Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Total Repeat Offenders</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{patterns.length}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Avg Violations per Offender</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {(patterns.reduce((sum, p) => sum + p.violationCount, 0) / patterns.length || 1).toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Total Violations Tracked</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {patterns.reduce((sum, p) => sum + p.violationCount, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
