'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { parkSightApi } from '@/lib/api-client';
import { useTheme } from 'next-themes';

const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

interface Zone {
  name: string;
  lat: number;
  lng: number;
  count: number;
}

function getMarkerStyle(count: number, maxCount: number) {
  const pct = count / maxCount;
  if (pct > 0.7) return { bg: '#ef4444', text: 'white' };
  if (pct > 0.4) return { bg: '#f97316', text: 'white' };
  if (pct > 0.2) return { bg: '#eab308', text: 'white' };
  return { bg: '#22c55e', text: 'white' };
}

function ZoneMarkers({ zones }: { zones: Zone[] }) {
  const [selected, setSelected] = useState<Zone | null>(null);
  const maxCount = Math.max(...zones.map(z => z.count), 1);

  return (
    <>
      {zones.map((zone, i) => {
        const { bg, text } = getMarkerStyle(zone.count, maxCount);
        const size = 32 + Math.round((zone.count / maxCount) * 30);
        const label =
          zone.count >= 1000
            ? `${(zone.count / 1000).toFixed(1)}k`
            : String(zone.count);
        return (
          <AdvancedMarker
            key={i}
            position={{ lat: zone.lat, lng: zone.lng }}
            onClick={() => setSelected(zone)}
          >
            <div
              style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: bg,
                border: '3px solid white',
                boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: text,
                fontSize: Math.max(9, size / 3.5),
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                userSelect: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              title={zone.name}
            >
              {label}
            </div>
          </AdvancedMarker>
        );
      })}
      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div style={{ padding: '6px 10px', minWidth: 160, fontFamily: 'sans-serif' }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#0f172a' }}>
              {selected.name}
            </p>
            <p style={{ fontSize: 12, color: '#475569' }}>
              <strong style={{ color: '#1e40af' }}>
                {selected.count.toLocaleString()}
              </strong>{' '}
              violations
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function InteractiveMapPreview() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    parkSightApi
      .getHeatmapZones()
      .then((fc: any) => {
        if (fc?.features) {
          setZones(
            fc.features
              .map((f: any) => ({
                name: f.properties.zone_name || f.properties.name || 'Zone',
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
                count: f.properties.violation_count || f.properties.count || 0,
              }))
              .filter((z: Zone) => z.lat && z.lng && z.count > 0)
              .sort((a: Zone, b: Zone) => b.count - a.count)
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-slate-400 text-sm">Loading map…</span>
      </div>
    );
  }

  const center =
    zones.length > 0 ? { lat: zones[0].lat, lng: zones[0].lng } : BENGALURU_CENTER;

  return (
    <APIProvider apiKey={MAPS_KEY}>
      <Map
        mapId={theme === 'dark' ? 'dark-map' : 'light-map'}
        defaultCenter={center}
        defaultZoom={11}
        gestureHandling="cooperative"
        style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
        colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
        streetViewControl={false}
        mapTypeControl={false}
      >
        <ZoneMarkers zones={zones} />
      </Map>
    </APIProvider>
  );
}
