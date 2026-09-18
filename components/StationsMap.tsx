'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MapGL, {
  GeolocateControl,
  Layer,
  NavigationControl,
  Popup,
  Source,
} from 'react-map-gl/mapbox';
import type { LayerProps, MapMouseEvent, MapRef } from 'react-map-gl/mapbox';
import type { GeoJSONSource } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { buildGoogleMapsUrl, buildWazeUrl } from '@/lib/directions';
import { formatDistanceKm, haversineDistanceKm } from '@/lib/geo';

const NEARBY_RADIUS_KM = 10;
const FUEL_TYPE_STORAGE_KEY = 'surtify:map-fuel-type';

export type PriceLevel = 'cheap' | 'mid' | 'high';

export type FuelType = 'diesel' | 'gasolina_95' | 'gasolina_98' | 'glp';

const FUEL_TYPE_OPTIONS: { key: FuelType; label: string }[] = [
  { key: 'diesel', label: 'Diésel' },
  { key: 'gasolina_95', label: 'Gasolina 95' },
  { key: 'gasolina_98', label: 'Gasolina 98' },
  { key: 'glp', label: 'GLP' },
];

const FUEL_TYPE_KEYS = FUEL_TYPE_OPTIONS.map((option) => option.key);

function isFuelType(value: string | null): value is FuelType {
  return value != null && (FUEL_TYPE_KEYS as string[]).includes(value);
}

export type MapStation = {
  id: string;
  name: string;
  brand: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  prices: Record<FuelType, number | null>;
};

const LEVEL_COLOR: Record<PriceLevel, string> = {
  cheap: '#2fbf71',
  mid: '#f5c542',
  high: '#e5484d',
};

function formatPrice(price: number): string {
  return price.toLocaleString('es-ES', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

const CLUSTER_LAYER: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'stations',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#8aa0ff', 25, '#5c7cfa', 100, '#3b5bdb'],
    'circle-radius': ['step', ['get', 'point_count'], 16, 25, 20, 100, 26],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
  },
};

const CLUSTER_COUNT_LAYER: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'stations',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12,
  },
  paint: {
    'text-color': '#ffffff',
  },
};

const UNCLUSTERED_POINT_LAYER: LayerProps = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'stations',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'match',
      ['get', 'level'],
      'cheap',
      LEVEL_COLOR.cheap,
      'mid',
      LEVEL_COLOR.mid,
      'high',
      LEVEL_COLOR.high,
      '#9ca3af',
    ],
    'circle-radius': 9,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
  },
};

export default function StationsMap({ stations }: { stations: MapStation[] }) {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('diesel');

  useEffect(() => {
    const saved = localStorage.getItem(FUEL_TYPE_STORAGE_KEY);
    if (isFuelType(saved)) {
      setSelectedFuel(saved);
    }
  }, []);

  const handleSelectFuel = useCallback((fuel: FuelType) => {
    setSelectedFuel(fuel);
    localStorage.setItem(FUEL_TYPE_STORAGE_KEY, fuel);
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setLocationDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const stationsById = useMemo(() => {
    const map = new Map<string, MapStation>();
    for (const station of stations) map.set(station.id, station);
    return map;
  }, [stations]);

  const selectedStation = selectedId ? stationsById.get(selectedId) ?? null : null;

  const priceLevelByStationId = useMemo(() => {
    const levels = new Map<string, PriceLevel>();

    const withPrice = stations
      .map((station) => ({ station, price: station.prices[selectedFuel] }))
      .filter(
        (entry): entry is { station: MapStation; price: number } => entry.price != null
      );

    for (const entry of withPrice) {
      const nearby = withPrice.filter(
        (other) =>
          haversineDistanceKm(
            entry.station.latitude,
            entry.station.longitude,
            other.station.latitude,
            other.station.longitude
          ) <= NEARBY_RADIUS_KM
      );

      const min = Math.min(...nearby.map((n) => n.price));
      const max = Math.max(...nearby.map((n) => n.price));

      if (entry.price === min) {
        levels.set(entry.station.id, 'cheap');
      } else if (entry.price === max) {
        levels.set(entry.station.id, 'high');
      } else {
        levels.set(entry.station.id, 'mid');
      }
    }

    return levels;
  }, [stations, selectedFuel]);

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: stations.map((station) => ({
        type: 'Feature' as const,
        properties: {
          id: station.id,
          level: priceLevelByStationId.get(station.id) ?? 'unknown',
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [station.longitude, station.latitude],
        },
      })),
    }),
    [stations, priceLevelByStationId]
  );

  const initialViewState = useMemo(() => {
    if (stations.length === 0) {
      return { latitude: 41.3598, longitude: 2.0997, zoom: 11 };
    }
    const avgLat = stations.reduce((sum, s) => sum + s.latitude, 0) / stations.length;
    const avgLng = stations.reduce((sum, s) => sum + s.longitude, 0) / stations.length;
    return { latitude: avgLat, longitude: avgLng, zoom: 11 };
  }, [stations]);

  const nearestCheapest = useMemo(() => {
    if (!userPosition) return null;

    const withPrice = stations
      .map((station) => ({ station, price95: station.prices.gasolina_95 }))
      .filter(
        (entry): entry is { station: MapStation; price95: number } => entry.price95 != null
      );
    if (withPrice.length === 0) return null;

    const withDistance = withPrice.map((entry) => ({
      station: entry.station,
      price95: entry.price95,
      distanceKm: haversineDistanceKm(
        userPosition.latitude,
        userPosition.longitude,
        entry.station.latitude,
        entry.station.longitude
      ),
    }));

    let candidates = withDistance.filter((entry) => entry.distanceKm <= NEARBY_RADIUS_KM);
    if (candidates.length === 0) {
      candidates = [...withDistance].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5);
    }

    return candidates.reduce((best, current) =>
      current.price95 < best.price95 ? current : best
    );
  }, [stations, userPosition]);

  const flyToStation = useCallback((station: MapStation) => {
    setSelectedId(station.id);
    mapRef.current?.easeTo({
      center: [station.longitude, station.latitude],
      zoom: 15,
      duration: 800,
    });
  }, []);

  const searchResults = useMemo(() => {
    const query = normalizeSearchText(searchQuery.trim());
    if (query.length < 2) return [];

    return stations
      .filter((station) => {
        const haystack = normalizeSearchText(
          `${station.name} ${station.brand ?? ''} ${station.address ?? ''}`
        );
        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [stations, searchQuery]);

  const handleSelectSearchResult = useCallback(
    (station: MapStation) => {
      flyToStation(station);
      setSearchQuery('');
      setIsSearchFocused(false);
    },
    [flyToStation]
  );

  const handleMapClick = useCallback((event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      setSelectedId(null);
      return;
    }

    if (feature.layer?.id === 'clusters') {
      const clusterId = feature.properties?.cluster_id as number | undefined;
      const map = mapRef.current?.getMap();
      const source = map?.getSource('stations') as GeoJSONSource | undefined;
      if (source && clusterId != null && feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;
          mapRef.current?.easeTo({ center: [lng, lat], zoom });
        });
      }
      return;
    }

    if (feature.layer?.id === 'unclustered-point') {
      const id = feature.properties?.id as string | undefined;
      setSelectedId(id ?? null);
    }
  }, []);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <div className="mx-4 mt-4 rounded-2xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
        Falta configurar NEXT_PUBLIC_MAPBOX_TOKEN para mostrar el mapa.
      </div>
    );
  }

  return (
    <>
    <div className="relative mx-4 mt-4">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
        placeholder="Buscar gasolinera por nombre, marca o dirección…"
        className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none placeholder:text-muted"
      />
      {isSearchFocused && searchQuery.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-line bg-surface shadow-lg">
          {searchResults.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">
              Sin resultados para &ldquo;{searchQuery}&rdquo;
            </p>
          ) : (
            searchResults.map((station) => (
              <button
                key={station.id}
                type="button"
                onMouseDown={() => handleSelectSearchResult(station)}
                className="block w-full border-b border-line px-4 py-2.5 text-left text-sm last:border-b-0"
              >
                <div className="font-display text-sm uppercase text-ink">
                  {station.name}
                  {station.brand ? ` · ${station.brand}` : ''}
                </div>
                {station.address && (
                  <div className="text-xs text-muted">{station.address}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>

    <div className="mx-4 mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted">Colorear por:</span>
      {FUEL_TYPE_OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => handleSelectFuel(key)}
          className={`tap-target rounded-xl border px-3 py-1.5 text-xs ${
            selectedFuel === key
              ? 'border-yellow bg-yellow font-semibold text-[#141414]'
              : 'border-line bg-surface text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>

    <div className="relative mx-4 mt-3 h-[360px] overflow-hidden rounded-2xl border border-line">
      <MapGL
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={['clusters', 'unclustered-point']}
        onClick={handleMapClick}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <GeolocateControl
          position="top-right"
          trackUserLocation
          positionOptions={{ enableHighAccuracy: true }}
        />

        <Source id="stations" type="geojson" data={geojson} cluster clusterMaxZoom={14} clusterRadius={50}>
          <Layer {...CLUSTER_LAYER} />
          <Layer {...CLUSTER_COUNT_LAYER} />
          <Layer {...UNCLUSTERED_POINT_LAYER} />
        </Source>

        {selectedStation && (
          <Popup
            longitude={selectedStation.longitude}
            latitude={selectedStation.latitude}
            anchor="top"
            onClose={() => setSelectedId(null)}
            closeOnClick={false}
          >
            <div className="min-w-[160px] text-xs text-[#141414]">
              <div className="font-display text-sm uppercase">
                {selectedStation.name}
                {selectedStation.brand ? ` · ${selectedStation.brand}` : ''}
              </div>
              {selectedStation.address && (
                <div className="mt-0.5 text-muted">{selectedStation.address}</div>
              )}
              {FUEL_TYPE_OPTIONS.map(({ key, label }) => {
                const price = selectedStation.prices[key];
                return (
                  <div key={key} className="mt-0.5 font-mono font-bold">
                    {price != null
                      ? `${formatPrice(price)} € · ${label}`
                      : `${label}: sin precio reportado`}
                  </div>
                );
              })}
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <a
                  href={buildWazeUrl(selectedStation.latitude, selectedStation.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-center font-semibold uppercase text-[#141414]"
                >
                  🧭 Waze
                </a>
                <a
                  href={buildGoogleMapsUrl(selectedStation.latitude, selectedStation.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-center font-semibold uppercase text-[#141414]"
                >
                  🗺️ Maps
                </a>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/station/${selectedStation.id}`)}
                className="mt-1.5 w-full rounded-lg bg-yellow px-2 py-1 font-semibold uppercase"
              >
                Ver ficha
              </button>
            </div>
          </Popup>
        )}
      </MapGL>
    </div>

    {nearestCheapest && (
      <button
        type="button"
        onClick={() => flyToStation(nearestCheapest.station)}
        className="mx-4 mt-4 block w-full rounded-2xl border border-line bg-surface2 px-4 py-3 text-left text-sm"
      >
        <div className="text-xs text-muted">
          Más barata cerca de ti · Gasolina 95
        </div>
        <div className="mt-0.5 font-display text-sm uppercase">
          {nearestCheapest.station.name}
          {nearestCheapest.station.brand ? ` · ${nearestCheapest.station.brand}` : ''}
        </div>
        {nearestCheapest.station.address && (
          <div className="mt-0.5 text-xs text-muted">
            {nearestCheapest.station.address}
          </div>
        )}
        <div className="mt-1 font-mono font-bold">
          {formatPrice(nearestCheapest.price95)} € · a{' '}
          {formatDistanceKm(nearestCheapest.distanceKm)}
        </div>
      </button>
    )}

    {!userPosition && !nearestCheapest && locationDenied && (
      <div className="mx-4 mt-4 rounded-2xl border border-line bg-surface2 px-4 py-3 text-sm text-muted">
        Activa la ubicación en el navegador para ver la gasolinera más barata cerca de ti.
      </div>
    )}
    </>
  );
}
