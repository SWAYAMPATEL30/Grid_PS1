'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from 'next-themes';

const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946];

interface Props {
  officers: any[];
  hotspots: any[];
}

export function LiveMap({ officers, hotspots }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tileUrl = resolvedTheme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={BENGALURU_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%', backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#f8fafc' }}
        zoomControl={false}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        
        {/* Render Hotspots */}
        {hotspots.map((h, i) => {
          const isCritical = h.score > 75;
          const isHigh = h.score > 50;
          const color = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#eab308';
          // Use properties of hotspots if available, else approximate near Bengaluru
          const lat = h.lat || (BENGALURU_CENTER[0] + (Math.sin(i) * 0.05));
          const lng = h.lon || (BENGALURU_CENTER[1] + (Math.cos(i) * 0.05));
          
          return (
            <CircleMarker
              key={`h-${i}`}
              center={[lat, lng]}
              radius={10}
              pathOptions={{
                fillColor: color,
                color: color,
                weight: 2,
                fillOpacity: 0.5,
              }}
            >
              <Popup className={resolvedTheme === 'dark' ? 'dark-popup' : ''}>
                <div className="p-1 min-w-[120px]">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {h.zone}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Score: {h.score?.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">Violations: {(h.violation_count || 0).toLocaleString()}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Render Officers */}
        {officers.map((o, i) => {
          const lat = o.latitude || (BENGALURU_CENTER[0] + (Math.cos(i * 1.3) * 0.05));
          const lng = o.longitude || (BENGALURU_CENTER[1] + (Math.sin(i * 1.3) * 0.05));
          return (
            <CircleMarker
              key={`o-${o.id || i}`}
              center={[lat, lng]}
              radius={6}
              pathOptions={{
                fillColor: '#22c55e',
                color: '#fff',
                weight: 2,
                fillOpacity: 1,
              }}
            >
              <Popup className={resolvedTheme === 'dark' ? 'dark-popup' : ''}>
                <div className="p-1">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {o.full_name || o.officer_id || `Officer ${i+1}`}
                  </p>
                  <p className="text-xs text-green-600 font-semibold mt-1">● On Duty</p>
                  <p className="text-xs text-slate-500">{o.police_station || o.station}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container { font-family: inherit; z-index: 10; }
        .dark-popup .leaflet-popup-content-wrapper, .dark-popup .leaflet-popup-tip {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
      `}} />
    </div>
  );
}
