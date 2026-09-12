'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Map, {
  GeolocateControl,
  Marker,
  NavigationControl,
  Popup,
} from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { buildGoogleMapsUrl, buildWazeUrl } from '@/lib/directions';

export type PriceLevel = 'cheap' | 'mid' | 'high';

export type MapStation = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  price: number | null;
  level: PriceLevel | null;
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

export default function StationsMap({ stations }: { stations: MapStation[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedId) ?? null,
    [stations, selectedId]
  );

  const initialViewState = useMemo(() => {
    if (stations.length === 0) {
      return { latitude: 41.3598, longitude: 2.0997, zoom: 13 };
    }
    const avgLat =
      stations.reduce((sum, s) => sum + s.latitude, 0) / stations.length;
    const avgLng =
      stations.reduce((sum, s) => sum + s.longitude, 0) / stations.length;
    return { latitude: avgLat, longitude: avgLng, zoom: 13 };
  }, [stations]);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id));
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
    <div className="relative mx-4 mt-4 h-[360px] overflow-hidden rounded-2xl border border-line">
      <Map
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <GeolocateControl
          position="top-right"
          trackUserLocation
          positionOptions={{ enableHighAccuracy: true }}
        />

        {stations.map((station) => (
          <Marker
            key={station.id}
            longitude={station.longitude}
            latitude={station.latitude}
            anchor="bottom"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              handleMarkerClick(station.id);
            }}
          >
            <div
              className="tap-target flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-lg shadow-md"
              style={{
                backgroundColor: station.level
                  ? LEVEL_COLOR[station.level]
                  : '#9ca3af',
              }}
            >
              ⛽
            </div>
          </Marker>
        ))}

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
              </div>
              {selectedStation.address && (
                <div className="mt-0.5 text-muted">{selectedStation.address}</div>
              )}
              <div className="mt-1 font-mono font-bold">
                {selectedStation.price != null
                  ? `${formatPrice(selectedStation.price)} € · Diésel`
                  : 'Sin precio reportado'}
              </div>
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
      </Map>
    </div>
  );
}
