'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { parkSightApi } from '@/lib/api-client';
import { useTheme } from 'next-themes';

const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946];

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

export function InteractiveMapPreview() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    parkSightApi.getHeatmapZones()
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

  if (!mounted || loading) {
    return (
      <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-slate-400 text-sm">Loading map…</span>
      </div>
    );
  }

  const maxCount = Math.max(...zones.map(z => z.count), 1);
  const tileUrl = resolvedTheme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
      <MapContainer
        center={zones.length > 0 ? [zones[0].lat, zones[0].lng] : BENGALURU_CENTER}
        zoom={11}
        style={{ height: '100%', width: '100%', backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#f8fafc' }}
        zoomControl={false}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {zones.map((zone, i) => {
          const color = getMarkerColor(zone.count, maxCount);
          const radius = 6 + Math.round((zone.count / maxCount) * 16);
          return (
            <CircleMarker
              key={i}
              center={[zone.lat, zone.lng]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                color: 'white',
                weight: 1.5,
                fillOpacity: 0.8,
              }}
            >
              <Popup className={resolvedTheme === 'dark' ? 'dark-popup' : ''}>
                <div className="p-1 min-w-[140px]">
                  <p className="font-bold text-sm text-slate-800">{zone.name}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    <strong className="text-blue-600 text-base">{zone.count.toLocaleString()}</strong> violations
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {/* Dynamic CSS injection to fix Popup styling in dark mode since Leaflet CSS is global */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container { font-family: inherit; }
        .dark-popup .leaflet-popup-content-wrapper, .dark-popup .leaflet-popup-tip {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
        .dark-popup .leaflet-popup-content p { color: #cbd5e1 !important; }
        .dark-popup .leaflet-popup-content strong { color: #60a5fa !important; }
      `}} />
    </div>
  );
}
