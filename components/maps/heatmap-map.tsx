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

const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

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

interface HeatPoint {
  lat: number;
  lng: number;
  weight: number;
  count: number;
}

function HeatPoints({ points }: { points: HeatPoint[] }) {
  const [selected, setSelected] = useState<HeatPoint | null>(null);

  // Group into grid cells to avoid 2000 individual DOM nodes
  const gridded = (() => {
    const cells: Record<string, { lat: number; lng: number; weight: number; count: number }> = {};
    for (const p of points) {
      const key = `${(p.lat).toFixed(2)},${(p.lng).toFixed(2)}`;
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
        const radius = 6 + Math.round((p.count / maxCount) * 20);
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
                opacity: 0.75,
                cursor: 'pointer',
              }}
            />
          </AdvancedMarker>
        );
      })}
      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div style={{ padding: '4px 8px', minWidth: 120 }}>
            <p style={{ fontWeight: 700, fontSize: 12 }}>
              {selected.count.toLocaleString()} violations
            </p>
            <p style={{ fontSize: 11, color: '#555' }}>
              Severity: {selected.weight.toFixed(1)}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

interface Props {
  filters?: HeatmapFilters;
}

export function HeatmapMap({ filters }: Props) {
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPoints = useCallback(async () => {
    setLoading(true);
    try {
      const data: RealHeatmapPoint[] = await parkSightApi.getHeatmapPoints(filters || {});
      setPoints(data.map(p => ({ lat: p.lat, lng: p.lng, weight: p.weight, count: p.count })));
    } catch (e) {
      console.error('Failed to load heatmap data:', e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-lg">
          <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
        </div>
      )}
      <APIProvider apiKey={MAPS_KEY}>
        <Map
          mapId="heatmap-main"
          defaultCenter={points.length > 0 ? { lat: points[0].lat, lng: points[0].lng } : BENGALURU_CENTER}
          defaultZoom={12}
          gestureHandling="greedy"
          style={{ width: '100%', height: '100%' }}
          colorScheme="DARK"
        >
          <HeatPoints points={points} />
        </Map>
      </APIProvider>
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-slate-900/90 border border-slate-700 p-3 text-xs space-y-1.5">
        <p className="font-semibold text-slate-200 mb-2">Severity</p>
        {[
          { label: 'Critical (≥4)', color: '#ef4444' },
          { label: 'High (≥3)', color: '#f97316' },
          { label: 'Medium (≥2)', color: '#eab308' },
          { label: 'Low', color: '#22c55e' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
            <span className="text-slate-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
