'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const violationIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Violation {
  id: string;
  licensePlate: string;
  location: { lat: number; lng: number };
  violationType: string;
}

export function InteractiveMapPreview() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Generate random violations in SF area
    const mockViolations: Violation[] = Array.from({ length: 15 }).map((_, i) => ({
      id: `v-${i}`,
      licensePlate: `ABC${1000 + i}`,
      location: {
        lat: 37.7749 + (Math.random() - 0.5) * 0.1,
        lng: -122.4194 + (Math.random() - 0.5) * 0.1
      },
      violationType: ['expired_meter', 'no_parking', 'fire_zone'][Math.floor(Math.random() * 3)]
    }));
    setViolations(mockViolations);
  }, []);

  if (!mounted) {
    return <div className="h-full bg-slate-800 animate-pulse" />;
  }

  return (
    <MapContainer
      center={[37.7749, -122.4194]}
      zoom={13}
      className="h-full w-full"
      style={{ height: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />
      {violations.map(violation => (
        <Marker
          key={violation.id}
          position={[violation.location.lat, violation.location.lng]}
          icon={violationIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{violation.licensePlate}</p>
              <p className="text-xs text-gray-600">{violation.violationType}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
