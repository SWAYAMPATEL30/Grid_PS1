'use client';

import dynamic from 'next/dynamic';

interface Hotspot {
  x: number;
  y: number;
  violations: number;
  zone: string;
}

interface Hotspot3DProps {
  hotspots?: Hotspot[];
  height?: number;
}

// Placeholder for 3D visualization
export function Hotspot3D({ 
  hotspots = [
    { x: 2, y: 2, violations: 450, zone: 'Downtown Core' },
    { x: 7, y: 3, violations: 380, zone: 'Market Street' },
    { x: 5, y: 8, violations: 320, zone: 'Park Avenue' },
    { x: 3, y: 6, violations: 290, zone: 'Business District' },
    { x: 8, y: 7, violations: 250, zone: 'Harbor District' },
  ],
  height = 500
}: Hotspot3DProps) {
  return (
    <div style={{ width: '100%', height, borderRadius: '8px', overflow: 'hidden', background: '#1e293b', border: '1px solid #475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📊</div>
        <div style={{ fontSize: '1rem', fontWeight: '500', color: '#e2e8f0' }}>3D Violation Hotspot Map</div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>Interactive 3D visualization with orbit controls</div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {hotspots.map((h, idx) => (
            <div 
              key={idx} 
              style={{ 
                padding: '0.5rem 1rem', 
                background: '#374151', 
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#d1d5db'
              }}
            >
              {h.zone}: {h.violations}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
