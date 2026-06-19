'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Appeal } from '@/lib/types';
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'under_review' | 'approved' | 'denied'>('all');

  useEffect(() => {
    const loadAppeals = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getAppeals(1, 50);
        setAppeals(response.items);
      } catch (error) {
        console.error('Failed to load appeals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppeals();
  }, []);

  const filtered = statusFilter === 'all' ? appeals : appeals.filter(a => a.status === statusFilter);

  const stats = {
    submitted: appeals.filter(a => a.status === 'submitted').length,
    under_review: appeals.filter(a => a.status === 'under_review').length,
    approved: appeals.filter(a => a.status === 'approved').length,
    denied: appeals.filter(a => a.status === 'denied').length,
  };

  const approvalRate = appeals.length > 0 ? Math.round((stats.approved / appeals.length) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Violation Appeals</h1>
        <p className="mt-2 text-slate-400">Appeal workflow management and status tracking</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Total Appeals</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{appeals.length}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Submitted</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{stats.submitted}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Under Review</p>
          <p className="mt-2 text-3xl font-bold text-yellow-400">{stats.under_review}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Approved</p>
          <p className="mt-2 text-3xl font-bold text-green-400">{stats.approved}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Approval Rate</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{approvalRate}%</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {(['all', 'submitted', 'under_review', 'approved', 'denied'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 font-medium text-sm transition ${
              statusFilter === status
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Appeals Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">License Plate</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Appeal Reason</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Submitted Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Reviewed Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((appeal, idx) => (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-100">{appeal.licensePlate}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{appeal.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                      appeal.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                      appeal.status === 'denied' ? 'bg-red-900/30 text-red-400' :
                      appeal.status === 'under_review' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {appeal.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                      {appeal.status === 'denied' && <XCircle className="h-3 w-3" />}
                      {appeal.status === 'under_review' && <Clock className="h-3 w-3" />}
                      {appeal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{appeal.submittedDate.toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{appeal.reviewedDate?.toLocaleDateString() || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
