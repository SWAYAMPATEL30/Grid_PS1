'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { parkSightApi } from '@/lib/api-client';

const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

interface Zone {
  name: string;
  lat: number;
  lng: number;
  count: number;
}

function getMarkerColor(count: number, maxCount: number): string {
  const pct = count / maxCount;
  if (pct > 0.7) return '#ef4444'; // red
  if (pct > 0.4) return '#f97316'; // orange
  if (pct > 0.2) return '#eab308'; // yellow
  return '#22c55e'; // green
}

function ZoneMarkers({ zones }: { zones: Zone[] }) {
  const [selected, setSelected] = useState<Zone | null>(null);
  const maxCount = Math.max(...zones.map(z => z.count), 1);

  return (
    <>
      {zones.map((zone, i) => {
        const color = getMarkerColor(zone.count, maxCount);
        const size = 24 + Math.round((zone.count / maxCount) * 32);
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
                background: color,
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: Math.max(9, size / 3),
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.15s',
              }}
              title={zone.name}
            >
              {zone.count > 999 ? `${(zone.count / 1000).toFixed(1)}k` : zone.count}
            </div>
          </AdvancedMarker>
        );
      })}
      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div style={{ padding: '4px 8px', minWidth: 140 }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{selected.name}</p>
            <p style={{ fontSize: 12, color: '#555' }}>
              {selected.count.toLocaleString()} violations
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

  useEffect(() => {
    parkSightApi.getHeatmapZones()
      .then((fc: any) => {
        if (fc?.features) {
          setZones(
            fc.features.map((f: any) => ({
              name: f.properties.name,
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
              count: f.properties.count,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-full w-full bg-slate-800 animate-pulse rounded-lg" />;
  }

  return (
    <APIProvider apiKey={MAPS_KEY}>
      <Map
        mapId="overview-map"
        defaultCenter={zones.length > 0 ? { lat: zones[0].lat, lng: zones[0].lng } : BENGALURU_CENTER}
        defaultZoom={11}
        gestureHandling="cooperative"
        disableDefaultUI={false}
        style={{ width: '100%', height: '100%' }}
        colorScheme="DARK"
      >
        <ZoneMarkers zones={zones} />
      </Map>
    </APIProvider>
  );
}
