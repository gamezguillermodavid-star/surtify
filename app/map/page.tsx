import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import StationsMap, { type MapStation, type PriceLevel } from '@/components/StationsMap';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

function formatPrice(price: number): string {
  return price.toLocaleString('es-ES', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function assignPriceLevels(
  stationsWithPrice: { id: string; price: number }[]
): Map<string, PriceLevel> {
  const levels = new Map<string, PriceLevel>();

  if (stationsWithPrice.length === 0) {
    return levels;
  }

  if (stationsWithPrice.length === 1) {
    levels.set(stationsWithPrice[0].id, 'cheap');
    return levels;
  }

  const min = Math.min(...stationsWithPrice.map((s) => s.price));
  const max = Math.max(...stationsWithPrice.map((s) => s.price));

  for (const station of stationsWithPrice) {
    if (station.price === min) {
      levels.set(station.id, 'cheap');
    } else if (station.price === max) {
      levels.set(station.id, 'high');
    } else {
      levels.set(station.id, 'mid');
    }
  }

  return levels;
}

export default async function MapPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: stations, error: stationsError } = await supabase
    .from('gas_stations')
    .select('id, name, address, latitude, longitude')
    .order('name');

  const { data: dieselPrices, error: pricesError } = await supabase
    .from('fuel_prices')
    .select('station_id, price')
    .eq('fuel_type', 'diesel')
    .order('reported_at', { ascending: false });

  const latestDieselByStation = new Map<string, number>();
  for (const row of dieselPrices ?? []) {
    if (!latestDieselByStation.has(row.station_id)) {
      latestDieselByStation.set(row.station_id, Number(row.price));
    }
  }

  const stationsWithPrice = (stations ?? [])
    .filter((station) => latestDieselByStation.has(station.id))
    .map((station) => ({
      id: station.id,
      price: latestDieselByStation.get(station.id)!,
    }));

  const priceLevels = assignPriceLevels(stationsWithPrice);

  const cheapest =
    stationsWithPrice.length > 0
      ? stationsWithPrice.reduce((best, current) =>
          current.price < best.price ? current : best
        )
      : null;

  const cheapestStation =
    cheapest && stations
      ? stations.find((station) => station.id === cheapest.id)
      : null;

  const mapStations: MapStation[] = (stations ?? []).map((station) => ({
    id: station.id,
    name: station.name,
    address: station.address,
    latitude: station.latitude,
    longitude: station.longitude,
    price: latestDieselByStation.get(station.id) ?? null,
    level: priceLevels.get(station.id) ?? null,
  }));

  return (
    <main className="min-h-screen pb-24">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="font-display text-lg uppercase tracking-wide">
          ⛽ Surtify
        </span>
        <ThemeToggle />
      </div>

      {(stationsError || pricesError) && (
        <div className="mx-4 mt-4 space-y-1 text-sm text-red">
          {stationsError && (
            <p>Error cargando gasolineras: {stationsError.message}</p>
          )}
          {pricesError && (
            <p>Error cargando precios: {pricesError.message}</p>
          )}
        </div>
      )}

      <StationsMap stations={mapStations} />

      {cheapestStation && cheapest && (
        <div className="mx-4 mt-4 rounded-2xl border border-line bg-surface2 px-4 py-3 text-sm">
          La más barata cerca de ti: <b>{cheapestStation.name}</b>,{' '}
          {formatPrice(cheapest.price)} €.
        </div>
      )}

      <BottomNav />
    </main>
  );
}
