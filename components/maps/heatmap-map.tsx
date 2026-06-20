'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { parkSightApi } from '@/lib/api-client';
import { RealHeatmapPoint } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

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
  if (weight >= 4) return '#ef4444';
  if (weight >= 3) return '#f97316';
  if (weight >= 2) return '#eab308';
  return '#22c55e';
}

function HeatPoints({ points }: { points: HeatPoint[] }) {
  const [selected, setSelected] = useState<HeatPoint | null>(null);

  // Grid-aggregate so we don't render 300k individual DOM nodes
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

  return (
    <>
      {gridded.map((p, i) => {
        const color = getColor(p.weight);
        const radius = 8 + Math.round((p.count / maxCount) * 24);
        return (
          <AdvancedMarker
            key={i}
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => setSelected(p)}
          >
            <div
              style={{
                width: radius,
                height: radius,
                borderRadius: '50%',
                background: color,
                opacity: 0.78,
                cursor: 'pointer',
                border: '1.5px solid rgba(255,255,255,0.6)',
                boxShadow: `0 0 6px ${color}88`,
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.4)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </AdvancedMarker>
        );
      })}
      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div style={{ padding: '6px 10px', minWidth: 130, fontFamily: 'sans-serif' }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
              {selected.count.toLocaleString()} violations
            </p>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Severity weight: {selected.weight.toFixed(1)}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
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
  const { theme } = useTheme();

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
    fetchPoints();
  }, [fetchPoints]);

  const firstPoint = points.find(p => p.lat && p.lng);
  const center = firstPoint
    ? { lat: firstPoint.lat, lng: firstPoint.lng }
    : BENGALURU_CENTER;

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading violation data…</p>
          </div>
        </div>
      )}

      <APIProvider apiKey={MAPS_KEY}>
        <Map
          mapId={theme === 'dark' ? 'heatmap-dark' : 'heatmap-light'}
          defaultCenter={center}
          defaultZoom={12}
          gestureHandling="greedy"
          style={{ width: '100%', height: '100%' }}
          colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
          streetViewControl={false}
          mapTypeControl={false}
        >
          <HeatPoints points={points} />
        </Map>
      </APIProvider>

      {/* Severity Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 p-3 shadow-lg text-xs space-y-1.5 backdrop-blur-sm">
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
    </div>
  );
}
