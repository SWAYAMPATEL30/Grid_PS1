'use client';

import { useEffect, useState } from 'react';
import { Hotspot3D } from '@/components/maps/hotspot-3d';
import { KPICard } from '@/components/cards/kpi-card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, TrendingUp, Zap, Clock } from 'lucide-react';

export default function PredictiveIntelligencePage() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Prediction confidence data
  const predictionData = [
    { zone: 'Downtown Core', predicted: 480, confidence: 94 },
    { zone: 'Market Street', predicted: 410, confidence: 91 },
    { zone: 'Park Avenue', predicted: 350, confidence: 88 },
    { zone: 'Business Dist.', predicted: 310, confidence: 85 },
    { zone: 'Harbor District', predicted: 270, confidence: 82 },
  ];

  // Time-based prediction
  const timeSeriesData = [
    { time: '6 AM', predicted: 45, actual: 42 },
    { time: '9 AM', predicted: 180, actual: 175 },
    { time: '12 PM', predicted: 240, actual: 238 },
    { time: '3 PM', predicted: 210, actual: 205 },
    { time: '6 PM', predicted: 290, actual: 295 },
    { time: '9 PM', predicted: 160, actual: 158 },
  ];

  // Weather impact
  const weatherData = [
    { condition: 'Clear', violations: 2840, prediction: 2780 },
    { condition: 'Cloudy', violations: 2620, prediction: 2590 },
    { condition: 'Rainy', violations: 3450, prediction: 3420 },
    { condition: 'Foggy', violations: 2980, prediction: 2945 },
    { condition: 'Snow', violations: 1850, prediction: 1820 },
  ];

  const hotspots = [
    { x: 2, y: 2, violations: 480, zone: 'Downtown Core' },
    { x: 7, y: 3, violations: 410, zone: 'Market Street' },
    { x: 5, y: 8, violations: 350, zone: 'Park Avenue' },
    { x: 3, y: 6, violations: 310, zone: 'Business District' },
    { x: 8, y: 7, violations: 270, zone: 'Harbor District' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Violation Prediction Engine</h1>
          <p className="text-slate-400 mt-2">AI-powered forecasting for proactive enforcement</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          label="Prediction Accuracy"
          value="92.3%"
          change="+2.1%"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KPICard
          label="Next 24H Forecast"
          value="3,240"
          change="violations predicted"
          icon={<Clock className="h-5 w-5" />}
        />
        <KPICard
          label="High Confidence Zones"
          value="12"
          change="out of 28 zones"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <KPICard
          label="Weather Impact"
          value="Rainy"
          change="+23% violations today"
          icon={<Zap className="h-5 w-5" />}
        />
      </div>

      {/* 3D Hotspot Visualization */}
      <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Next 24H Violation Hotspots (3D)</h2>
        <Hotspot3D hotspots={hotspots} height={400} />
        <p className="text-sm text-slate-400 mt-4">
          Spin, rotate, and zoom to explore. Height = violation density | Color = severity
        </p>
      </div>

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Predictions */}
        <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Zone-Level Predictions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={predictionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="zone" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="predicted" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-slate-400">
            Showing predicted violations for next 24 hours by zone
          </div>
        </div>

        {/* Time Series */}
        <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Hourly Predictions vs. Actual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Line type="monotone" dataKey="predicted" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-slate-400">
            Model predicts violations within 2.3% margin of error
          </div>
        </div>
      </div>

      {/* Weather Impact Analysis */}
      <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Weather-Triggered Violation Patterns</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weatherData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="condition" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Bar dataKey="violations" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            <Bar dataKey="prediction" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-slate-400">
          Rainy conditions show 23% increase in violations. Snow shows 35% decrease (fewer drivers).
        </div>
      </div>

      {/* Model Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Drivers */}
        <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Prediction Key Drivers</h3>
          <div className="space-y-3">
            {[
              { factor: 'Weather Conditions', impact: 28, color: 'bg-blue-500' },
              { factor: 'Time of Day', impact: 24, color: 'bg-purple-500' },
              { factor: 'Day of Week', impact: 18, color: 'bg-pink-500' },
              { factor: 'Local Events', impact: 15, color: 'bg-orange-500' },
              { factor: 'Historical Patterns', impact: 15, color: 'bg-green-500' },
            ].map((item) => (
              <div key={item.factor}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-300">{item.factor}</span>
                  <span className="text-sm font-semibold text-slate-100">{item.impact}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: `${item.impact}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Alerts */}
        <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Next 48H Alerts</h3>
          <div className="space-y-3">
            {[
              { alert: 'Rainstorm Expected 2-6 PM Tomorrow', severity: 'high', prediction: '+340 violations' },
              { alert: 'Concert Downtown Tomorrow 8 PM', severity: 'high', prediction: '+180 violations' },
              { alert: 'Weekend Effect (Saturday)', severity: 'medium', prediction: '+85 violations' },
              { alert: 'School Holiday Parking Impact', severity: 'medium', prediction: '-120 violations' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className={`h-3 w-3 rounded-full mt-1 flex-shrink-0 ${
                  item.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100">{item.alert}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.prediction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
