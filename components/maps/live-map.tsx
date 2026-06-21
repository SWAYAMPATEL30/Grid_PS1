'use client';

import { useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBn23tjZdsuSGbuE436_tPkjW3vNCpmAuY';
const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };

const containerStyle = {
  width: '100%',
  height: '100%'
};

interface Props {
  officers: any[];
  hotspots: any[];
}

export function LiveMap({ officers, hotspots }: Props) {
  const { resolvedTheme } = useTheme();
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [activeMarker, setActiveMarker] = useState<any>(null);

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

  if (!isLoaded) return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={BENGALURU_CENTER}
        zoom={12}
        options={mapOptions}
        onClick={() => setActiveMarker(null)}
      >
        {/* Hotspots */}
        {hotspots.map((h, i) => {
          const isCritical = h.score > 75;
          const isHigh = h.score > 50;
          const color = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#eab308';
          const lat = h.lat || (BENGALURU_CENTER.lat + (Math.sin(i) * 0.05));
          const lng = h.lon || (BENGALURU_CENTER.lng + (Math.cos(i) * 0.05));

          return (
            <Circle
              key={`h-${i}`}
              center={{ lat, lng }}
              radius={600}
              options={{
                fillColor: color,
                fillOpacity: 0.3,
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: 2,
              }}
              onClick={() => setActiveMarker({ type: 'hotspot', data: h, lat, lng })}
            />
          );
        })}

        {/* Officers */}
        {officers.map((o, i) => {
          const lat = o.latitude || (BENGALURU_CENTER.lat + (Math.cos(i * 1.3) * 0.05));
          const lng = o.longitude || (BENGALURU_CENTER.lng + (Math.sin(i * 1.3) * 0.05));

          return (
            <Marker
              key={`o-${o.id || i}`}
              position={{ lat, lng }}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="12" fill="#22c55e" stroke="white" stroke-width="3"/><circle cx="16" cy="16" r="4" fill="white"/></svg>'),
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 16),
              }}
              onClick={() => setActiveMarker({ type: 'officer', data: o, lat, lng })}
            />
          );
        })}

        {/* Info Window */}
        {activeMarker && (
          <InfoWindow
            position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <div className="p-1 min-w-[120px] text-slate-800">
              {activeMarker.type === 'hotspot' ? (
                <>
                  <p className="font-bold text-sm text-slate-900">{activeMarker.data.zone}</p>
                  <p className="text-xs text-slate-600 mt-1">Score: {activeMarker.data.score?.toFixed(1)}</p>
                  <p className="text-xs text-slate-600">Violations: {(activeMarker.data.violation_count || 0).toLocaleString()}</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-sm text-slate-900">{activeMarker.data.full_name || activeMarker.data.officer_id}</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">● On Duty</p>
                  <p className="text-xs text-slate-600">{activeMarker.data.police_station || activeMarker.data.station}</p>
                </>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
