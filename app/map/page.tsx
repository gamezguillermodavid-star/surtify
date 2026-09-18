import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import StationsMap, { type FuelType, type MapStation } from '@/components/StationsMap';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { friendlyErrorMessage } from '@/lib/friendly-error';

const DRIVING_FUEL_TYPES: FuelType[] = ['diesel', 'gasolina_95', 'gasolina_98', 'glp'];

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
    .select('id, name, brand, address, latitude, longitude')
    .order('name');

  const { data: fuelPrices, error: pricesError } = await supabase
    .from('fuel_prices')
    .select('station_id, fuel_type, price')
    .in('fuel_type', DRIVING_FUEL_TYPES)
    .order('reported_at', { ascending: false });

  const latestPriceByStationAndFuel = new Map<string, number>();
  for (const row of fuelPrices ?? []) {
    const key = `${row.station_id}:${row.fuel_type}`;
    if (!latestPriceByStationAndFuel.has(key)) {
      latestPriceByStationAndFuel.set(key, Number(row.price));
    }
  }

  const mapStations: MapStation[] = (stations ?? []).map((station) => ({
    id: station.id,
    name: station.name,
    brand: station.brand,
    address: station.address,
    latitude: station.latitude,
    longitude: station.longitude,
    prices: Object.fromEntries(
      DRIVING_FUEL_TYPES.map((fuelType) => [
        fuelType,
        latestPriceByStationAndFuel.get(`${station.id}:${fuelType}`) ?? null,
      ])
    ) as Record<FuelType, number | null>,
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
            <p>{friendlyErrorMessage(stationsError.message)}</p>
          )}
          {pricesError && <p>{friendlyErrorMessage(pricesError.message)}</p>}
        </div>
      )}

      <StationsMap stations={mapStations} />

      <BottomNav />
    </main>
  );
}
