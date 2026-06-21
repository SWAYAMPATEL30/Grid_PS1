'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api';
import { parkSightApi } from '@/lib/api-client';
import { RealHeatmapPoint } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBn23tjZdsuSGbuE436_tPkjW3vNCpmAuY';
const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };
const LIBRARIES: ("visualization")[] = ["visualization"];

const containerStyle = {
  width: '100%',
  height: '100%'
};

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

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const fetchPoints = useCallback(async () => {
    setLoading(true);
    try {
      const data: RealHeatmapPoint[] = await parkSightApi.getHeatmapPoints(filters || {});
      const validPoints = data
        .filter(p => p.lat != null && p.lng != null)
        .map(p => ({ lat: p.lat, lng: p.lng, weight: p.weight, count: p.count ?? 1 }));
      setPoints(validPoints);
    } catch (e) {
      console.error('Failed to load heatmap data:', e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const mapOptions = useMemo(() => {
    const isDark = resolvedTheme === 'dark';
    return {
      disableDefaultUI: true,
      zoomControl: true,
      styles: isDark ? [
        { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#475569' }] },
        { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
        { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f8fafc' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
        { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#020617' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
        { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#020617' }] }
      ] : []
    };
  }, [resolvedTheme]);

  const heatmapData = useMemo(() => {
    if (!isLoaded || !window.google) return [];
    return points.map(p => ({
      location: new window.google.maps.LatLng(p.lat, p.lng),
      weight: p.weight
    }));
  }, [isLoaded, points]);

  if (!isLoaded) return (
    <div className="h-full bg-slate-800 animate-pulse rounded-xl" />
  );

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

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={BENGALURU_CENTER}
        zoom={12}
        options={mapOptions}
      >
        {heatmapData.length > 0 && (
          <HeatmapLayer
            data={heatmapData}
            options={{
              radius: 30,
              opacity: 0.8,
              gradient: [
                'rgba(0, 255, 255, 0)',
                'rgba(0, 255, 255, 1)',
                'rgba(0, 191, 255, 1)',
                'rgba(0, 127, 255, 1)',
                'rgba(0, 63, 255, 1)',
                'rgba(0, 0, 255, 1)',
                'rgba(0, 0, 223, 1)',
                'rgba(0, 0, 191, 1)',
                'rgba(0, 0, 159, 1)',
                'rgba(0, 0, 127, 1)',
                'rgba(63, 0, 91, 1)',
                'rgba(127, 0, 63, 1)',
                'rgba(191, 0, 31, 1)',
                'rgba(255, 0, 0, 1)'
              ]
            }}
          />
        )}
      </GoogleMap>

      {/* Severity Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 p-3 shadow-lg text-xs space-y-1.5 backdrop-blur-sm">
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
