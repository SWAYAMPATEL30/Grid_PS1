'use client';

import { useEffect, useState } from 'react';
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

// Dark map style (no Cloud Console mapId needed)
const DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
  { featureType: 'poi', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#023e58' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5ce' }] },
  { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#023747' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'transit', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'transit.line', elementType: 'geometry.fill', stylers: [{ color: '#283d6a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

interface Zone {
  name: string;
  lat: number;
  lng: number;
  count: number;
}

function getMarkerStyle(count: number, maxCount: number) {
  const pct = count / maxCount;
  if (pct > 0.7) return '#ef4444';
  if (pct > 0.4) return '#f97316';
  if (pct > 0.2) return '#eab308';
  return '#22c55e';
}

function ZoneMarkers({ zones }: { zones: Zone[] }) {
  const [selected, setSelected] = useState<Zone | null>(null);
  const maxCount = Math.max(...zones.map(z => z.count), 1);

  return (
    <>
      {zones.map((zone, i) => {
        const bg = getMarkerStyle(zone.count, maxCount);
        const size = 34 + Math.round((zone.count / maxCount) * 28);
        const label =
          zone.count >= 1000 ? `${(zone.count / 1000).toFixed(1)}k` : String(zone.count);
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
                boxShadow: `0 3px 14px rgba(0,0,0,0.4), 0 0 0 1px ${bg}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: Math.max(9, size / 3.8),
                fontWeight: 800,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.18)';
                e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.5), 0 0 0 2px ${bg}88`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 3px 14px rgba(0,0,0,0.4), 0 0 0 1px ${bg}44`;
              }}
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
          <div style={{ padding: '6px 10px', minWidth: 170, fontFamily: 'sans-serif' }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>
              {selected.name}
            </p>
            <p style={{ fontSize: 12, color: '#475569' }}>
              <span style={{ fontWeight: 700, color: '#1d4ed8', fontSize: 16 }}>
                {selected.count.toLocaleString()}
              </span>{' '}violations
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
  const { resolvedTheme } = useTheme();

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
        <span className="text-slate-400 text-sm">Loading violation map…</span>
      </div>
    );
  }

  const center = zones.length > 0 ? { lat: zones[0].lat, lng: zones[0].lng } : BENGALURU_CENTER;

  return (
    <APIProvider apiKey={MAPS_KEY}>
      <Map
        defaultCenter={center}
        defaultZoom={11}
        gestureHandling="cooperative"
        style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
        styles={resolvedTheme === 'dark' ? DARK_STYLES : []}
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
      >
        <ZoneMarkers zones={zones} />
      </Map>
    </APIProvider>
  );
}
