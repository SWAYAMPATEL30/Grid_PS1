'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function RevenuePage() {
  const [revenueByType, setRevenueByType] = useState<Record<string, number>>({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getRevenueByViolationType();
        setRevenueByType(data);
        const total = Object.values(data).reduce((sum, val) => sum + val, 0);
        setTotalRevenue(total);
      } catch (error) {
        console.error('Failed to load revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRevenue();
  }, []);

  const chartData = Object.entries(revenueByType).map(([type, revenue]) => ({
    name: type.replace(/_/g, ' '),
    value: revenue
  }));

  const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#EF4444'];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Revenue Analytics</h1>
        <p className="mt-2 text-slate-400">Financial metrics and penalty collection data</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Total Revenue</p>
          <p className="mt-2 text-3xl font-bold text-green-400">${(totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Avg per Violation</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">$95</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Collection Rate</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">87%</p>
        </div>
      </div>

      {/* Revenue by Type */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Revenue by Violation Type</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 bg-slate-800 animate-pulse rounded" />
          )}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Breakdown</h2>
          <div className="space-y-3">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-sm text-slate-300 capitalize">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-slate-100">${(item.value || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
