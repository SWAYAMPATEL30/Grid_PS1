'use client';

import { useEffect, useState } from 'react';
import { useFilters } from '@/context/filters-context';
import { parkSightApi } from '@/lib/api-client';
import { ZoneListItem, ZoneFeatureCollection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MapPin, Download, RotateCcw, Loader2 } from 'lucide-react';

export default function HeatmapPage() {
  const { selectedZones, setSelectedZones } = useFilters();
  const [zones, setZones] = useState<ZoneListItem[]>([]);
  const [zoneFeatures, setZoneFeatures] = useState<ZoneFeatureCollection | null>(null);
  const [activeZone, setActiveZone] = useState<string>(selectedZones[0] || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [zoneList, featureCollection] = await Promise.all([
          parkSightApi.getZonesList(),
          parkSightApi.getHeatmapZones()
        ]);
        setZones(zoneList.slice(0, 12)); // Top 12 zones for buttons
        setZoneFeatures(featureCollection);
      } catch (error) {
        console.error('Failed to load map data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Use the top 4 zones from features for the legend cards
  const topFeatures = [...(zoneFeatures?.features || [])]
    .sort((a, b) => b.properties.violation_count - a.properties.violation_count)
    .slice(0, 4);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Violation Heatmap</h1>
          <p className="mt-2 text-slate-400">Interactive map with violation density, clusters, and enforcement zones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setActiveZone('all')}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Zone Selector */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Enforcement Zones</h3>
        {loading && !zones.length ? (
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 w-32 bg-slate-800 animate-pulse rounded-md" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeZone === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveZone('all')}
              className={activeZone === 'all' ? 'bg-blue-600 text-white' : 'border-slate-700 text-slate-300'}
            >
              <MapPin className="h-4 w-4 mr-2" />
              All Zones
            </Button>
            {zones.map(zone => (
              <Button
                key={zone.zone_id}
                variant={activeZone === zone.zone_id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveZone(zone.zone_id)}
                className={activeZone === zone.zone_id ? 'bg-blue-600 text-white' : 'border-slate-700 text-slate-300'}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {zone.zone_name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="flex h-screen flex-col md:h-[600px]">
          <div className="border-b border-slate-800 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-100 flex items-center gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
                  {activeZone === 'all' ? 'All Zones' : zones.find(z => z.zone_id === activeZone)?.zone_name || 'Zone'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">Data powered by PostGIS • Displaying up to 50k violation points</p>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 flex items-center justify-center relative">
            {loading && !zoneFeatures ? (
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-10 backdrop-blur-sm">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              </div>
            ) : null}
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-slate-400">Leaflet map component will mount here</p>
              <p className="text-xs text-slate-500 mt-2">Will consume /api/heatmap/points and /api/heatmap/zones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Zones Legend */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading && !topFeatures.length
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-800 animate-pulse rounded-xl" />
            ))
          : topFeatures.map((f, index) => (
            <div key={f.properties?.zone_name || index} className="rounded-xl border border-slate-800 bg-slate-900 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <MapPin className="h-16 w-16" />
              </div>
              <h3 className="font-semibold text-slate-100 truncate pr-8" title={f.properties?.zone_name}>
                {f.properties?.zone_name || 'Unknown Zone'}
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Violations</span>
                  <span className="font-semibold text-slate-100">{(f.properties.violation_count || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Density</span>
                  <span className="font-semibold text-emerald-400">{(f.properties.density_per_km2 || 0).toFixed(1)} /km²</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-500">Top Issue</span>
                  <span className="text-xs font-medium bg-slate-800 text-slate-300 px-2 py-1 rounded truncate max-w-[120px]" title={f.properties.top_violation_type}>
                    {f.properties.top_violation_type || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
