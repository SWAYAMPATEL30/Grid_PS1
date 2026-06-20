'use client';

import { useState } from 'react';
import { KPICard } from '@/components/cards/kpi-card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingDown, Shield, AlertTriangle, Award, Heart } from 'lucide-react';

export default function DriverReputationPage() {
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Driver reputation tiers
  const reputationTiers = [
    { tier: 'Excellent (90-100)', drivers: 2340, fineMultiplier: 0.5, color: 'bg-green-500' },
    { tier: 'Good (75-89)', drivers: 5120, fineMultiplier: 1.0, color: 'bg-blue-500' },
    { tier: 'Fair (50-74)', drivers: 3890, fineMultiplier: 1.2, color: 'bg-yellow-500' },
    { tier: 'Poor (25-49)', drivers: 1680, fineMultiplier: 1.5, color: 'bg-orange-500' },
    { tier: 'Critical (0-24)', drivers: 420, fineMultiplier: 2.0, color: 'bg-red-500' },
  ];

  // Driver behavior data
  const behaviorData = [
    { reputation: 95, violations: 1, reoffend: 2 },
    { reputation: 88, violations: 2, reoffend: 5 },
    { reputation: 72, violations: 5, reoffend: 18 },
    { reputation: 55, violations: 12, reoffend: 35 },
    { reputation: 35, violations: 25, reoffend: 62 },
    { reputation: 15, violations: 45, reoffend: 78 },
  ];

  // Compliance improvement over time
  const improvementData = [
    { month: 'Month 1', violations: 1200, improved: 180, compliant: 2340 },
    { month: 'Month 2', violations: 1050, improved: 320, compliant: 2660 },
    { month: 'Month 3', violations: 920, improved: 210, compliant: 2870 },
    { month: 'Month 4', violations: 780, improved: 390, compliant: 3260 },
    { month: 'Month 5', violations: 650, improved: 280, compliant: 3540 },
    { month: 'Month 6', violations: 580, improved: 450, compliant: 3990 },
  ];

  // Repeat violator data
  const topRepeaters = [
    { plate: 'ABC-1234', violations: 47, reputation: 8, fine: '$2,820', status: 'High Risk' },
    { plate: 'XYZ-9876', violations: 41, reputation: 12, fine: '$2,460', status: 'High Risk' },
    { plate: 'QRS-5432', violations: 38, reputation: 18, fine: '$2,280', status: 'High Risk' },
    { plate: 'DEF-7890', violations: 35, reputation: 22, fine: '$2,100', status: 'Moderate Risk' },
    { plate: 'GHI-2345', violations: 32, reputation: 28, fine: '$1,920', status: 'Moderate Risk' },
  ];

  // Improvement stories
  const improvedDrivers = [
    { plate: 'LMN-3456', startReputation: 25, endReputation: 78, violations: 'From 18 to 2', improvement: '+210%' },
    { plate: 'OPQ-6789', startReputation: 35, endReputation: 82, violations: 'From 15 to 1', improvement: '+234%' },
    { plate: 'STU-1111', startReputation: 42, endReputation: 88, violations: 'From 12 to 1', improvement: '+210%' },
    { plate: 'VWX-2222', startReputation: 28, endReputation: 71, violations: 'From 20 to 4', improvement: '+154%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Driver Behavioral Reputation System</h1>
          <p className="text-slate-400 mt-2">Gamified compliance tracking with dynamic penalties and rewards</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Excellent Drivers"
          value="2,340"
          trend={{ value: 8.2, isPositive: true }}
          icon={<Award className="h-5 w-5" />}
        />
        <KPICard
          title="Avg. Reputation Score"
          value="68.4 / 100"
          trend={{ value: 3.1, isPositive: true }}
          icon={<Shield className="h-5 w-5" />}
        />
        <KPICard
          title="Repeat Violators"
          value="420"
          trend={{ value: 5.4, isPositive: false }}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <KPICard
          title="Rehabilitated Drivers"
          value="1,240"
          trend={{ value: 15, isPositive: true }}
          icon={<Heart className="h-5 w-5" />}
        />
      </div>

      {/* Reputation Tier Distribution */}
      <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Driver Reputation Distribution</h3>
        <div className="space-y-4">
          {reputationTiers.map((tier) => (
            <div key={tier.tier}>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-300">{tier.tier}</span>
                <div className="flex gap-4">
                  <span className="text-sm font-semibold text-slate-100">{(tier.drivers || 0).toLocaleString()} drivers</span>
                  <span className="text-sm text-slate-400">Fine: {tier.fineMultiplier}x</span>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div 
                  className={`${tier.color} h-3 rounded-full`}
                  style={{ width: `${(tier.drivers / 13450) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-400 mt-4">
          Total drivers tracked: 13,450 | Fine multiplier based on reputation tier
        </p>
      </div>

      {/* Reputation vs Violations */}
      <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Reputation Score vs. Violation Behavior</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="reputation" name="Reputation Score" stroke="#9ca3af" />
            <YAxis dataKey="violations" name="Annual Violations" stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#e2e8f0' }}
              cursor={{ strokeDasharray: '3 3' }}
            />
            <Scatter name="Violation Rate" data={behaviorData} fill="#0ea5e9" />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-slate-400">
          Clear correlation: Lower reputation = Higher violation rate. Re-offense rate increases from 2% to 78%.
        </div>
      </div>

      {/* Compliance Improvement */}
      <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">System Impact: Violations Down, Compliance Up</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={improvementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Bar dataKey="violations" fill="#ef4444" name="Total Violations" />
            <Bar dataKey="improved" fill="#10b981" name="Drivers Improving" />
            <Bar dataKey="compliant" fill="#0ea5e9" name="Compliant Drivers" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-slate-400">
          6-month trend shows 52% reduction in violations and 70% increase in compliant drivers
        </div>
      </div>

      {/* Top Repeat Violators */}
      <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Top Repeat Violators (Priority Enforcement)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">License Plate</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Violations</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Reputation</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Dynamic Fine</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {topRepeaters.map((driver, idx) => (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-mono text-slate-100">{driver.plate}</td>
                  <td className="py-3 px-4 text-slate-300">{driver.violations}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-700 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${driver.reputation}%` }} />
                      </div>
                      <span className="text-slate-300">{driver.reputation}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-red-400">{driver.fine}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                      {driver.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Successful Rehabilitation */}
      <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Success Stories: Rehabilitated Drivers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {improvedDrivers.map((driver, idx) => (
            <div key={idx} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-slate-100">{driver.plate}</span>
                <span className="text-green-400 font-semibold text-sm">{driver.improvement}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Start</span>
                  <span className="text-slate-400">Now</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-700 rounded h-2">
                    <div className="bg-red-500 h-2 rounded" style={{ width: `${driver.startReputation}%` }} />
                  </div>
                  <div className="flex-1 bg-slate-700 rounded h-2">
                    <div className="bg-green-500 h-2 rounded" style={{ width: `${driver.endReputation}%` }} />
                  </div>
                </div>
                <div className="text-xs text-slate-400 pt-2">
                  Violations: {driver.violations}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">How the System Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="text-sm font-semibold text-blue-400 mb-2">TRACK</div>
            <p className="text-sm text-slate-300">
              Every driver starts with base reputation (50). Violations lower it, clean records raise it.
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="text-sm font-semibold text-purple-400 mb-2">SCORE</div>
            <p className="text-sm text-slate-300">
              Fines dynamically adjust based on reputation tier (0.5x to 2x multiplier).
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="text-sm font-semibold text-green-400 mb-2">REWARD</div>
            <p className="text-sm text-slate-300">
              Compliant drivers see lower fines and public recognition. Incentivizes behavior change.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
