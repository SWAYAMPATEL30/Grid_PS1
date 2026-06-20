'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { parkSightApi } from '@/lib/api-client';
import { RealHeatmapPoint } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946];

interface HeatPoint {
  lat: number;
  lng: number;
  weight: number;
  count: number;
}

interface HeatmapFilters {
  from_date?: string;
  to_date?: string;
  hour_min?: number;
  hour_max?: number;
  day_type?: string;
  vehicle_types?: string;
}

function getColor(weight: number): string {
  if (weight >= 4) return '#ef4444'; // red
  if (weight >= 3) return '#f97316'; // orange
  if (weight >= 2) return '#eab308'; // yellow
  return '#22c55e'; // green
}

const LEGEND = [
  { label: 'Critical (≥4)', color: '#ef4444' },
  { label: 'High (≥3)',     color: '#f97316' },
  { label: 'Medium (≥2)',   color: '#eab308' },
  { label: 'Low',           color: '#22c55e' },
];

interface Props {
  filters?: HeatmapFilters;
}

export function HeatmapMap({ filters }: Props) {
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const fetchPoints = useCallback(async () => {
    setLoading(true);
    try {
      const data: RealHeatmapPoint[] = await parkSightApi.getHeatmapPoints(filters || {});
      setPoints(
        data.map(p => ({ lat: p.lat, lng: p.lon, weight: p.weight, count: p.count ?? 1 }))
      );
    } catch (e) {
      console.error('Failed to load heatmap data:', e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setMounted(true);
    fetchPoints();
  }, [fetchPoints]);

  if (!mounted) return null;

  // Grid-aggregate so Leaflet doesn't crash from 300k markers
  const gridded = (() => {
    const cells: Record<string, HeatPoint> = {};
    for (const p of points) {
      const key = `${p.lat.toFixed(2)},${p.lng.toFixed(2)}`;
      if (!cells[key]) cells[key] = { lat: p.lat, lng: p.lng, weight: 0, count: 0 };
      cells[key].weight = Math.max(cells[key].weight, p.weight);
      cells[key].count += p.count;
    }
    return Object.values(cells);
  })();

  const maxCount = Math.max(...gridded.map(p => p.count), 1);

  const firstPoint = points.find(p => p.lat && p.lng);
  const center: [number, number] = firstPoint
    ? [firstPoint.lat, firstPoint.lng]
    : BENGALURU_CENTER;

  const tileUrl = resolvedTheme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="relative w-full h-full" style={{ borderRadius: '0.5rem', overflow: 'hidden' }}>
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading violation data…</p>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%', backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#f8fafc' }}
        zoomControl={false}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {gridded.map((p, i) => {
          const color = getColor(p.weight);
          const radius = 5 + Math.round((p.count / maxCount) * 15);
          return (
            <CircleMarker
              key={i}
              center={[p.lat, p.lng]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                color: color,
                weight: 1,
                fillOpacity: 0.6,
              }}
            >
              <Popup className={resolvedTheme === 'dark' ? 'dark-popup' : ''}>
                <div className="p-1 min-w-[120px]">
                  <p className="font-bold text-sm text-slate-800">
                    <span className="text-blue-600 text-base">{p.count.toLocaleString()}</span> violations
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Severity: {p.weight.toFixed(1)} / 5</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Severity Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 p-3 shadow-lg text-xs space-y-1.5 backdrop-blur-sm">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Severity</p>
        {LEGEND.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 4px ${color}88`,
              }}
            />
            <span className="text-slate-600 dark:text-slate-300">{label}</span>
          </div>
        ))}
        {!loading && (
          <p className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[10px]">
            {points.length.toLocaleString()} data points
          </p>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container { font-family: inherit; }
        .dark-popup .leaflet-popup-content-wrapper, .dark-popup .leaflet-popup-tip {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
        .dark-popup .leaflet-popup-content p { color: #cbd5e1 !important; }
        .dark-popup .leaflet-popup-content span { color: #60a5fa !important; }
      `}} />
    </div>
  );
}
