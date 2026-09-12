import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

const FUEL_TYPES = [
  { key: 'diesel', label: 'Diésel' },
  { key: 'gasolina_95', label: 'Gasolina 95' },
  { key: 'gasolina_98', label: 'Gasolina 98' },
  { key: 'glp', label: 'GLP' },
] as const;

function formatPrice(price: number): string {
  return price.toLocaleString('es-ES', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export default async function StationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: station, error: stationError } = await supabase
    .from('gas_stations')
    .select('id, name, address, services')
    .eq('id', params.id)
    .single();

  const { data: fuelPrices, error: pricesError } = await supabase
    .from('fuel_prices')
    .select('fuel_type, price, reported_at')
    .eq('station_id', params.id)
    .order('reported_at', { ascending: false });

  if (stationError && !station) {
    return (
      <main className="min-h-screen px-4 py-6">
        <Link href="/map" className="text-sm text-muted">
          ‹ Volver
        </Link>
        <p className="mt-4 text-sm text-red">
          Error cargando gasolineras: {stationError.message}
        </p>
      </main>
    );
  }

  if (!station) {
    notFound();
  }

  const latestByFuelType = new Map<
    string,
    { price: number; reported_at: string }
  >();

  for (const row of fuelPrices ?? []) {
    if (!latestByFuelType.has(row.fuel_type)) {
      latestByFuelType.set(row.fuel_type, {
        price: Number(row.price),
        reported_at: row.reported_at,
      });
    }
  }

  const fuels = FUEL_TYPES.map(({ key, label }) => {
    const latest = latestByFuelType.get(key);
    return {
      key,
      label,
      price: latest?.price ?? null,
    };
  });

  const pricesWithData = fuels
    .map((fuel) => fuel.price)
    .filter((price): price is number => price != null);

  const lowestPrice =
    pricesWithData.length > 0 ? Math.min(...pricesWithData) : null;

  const services: string[] = (station.services ?? []) as string[];

  return (
    <main className="min-h-screen pb-10">
      <div className="relative flex h-36 items-end bg-surface2 px-4 py-4">
        <Link
          href="/map"
          className="tap-target absolute left-3 top-3 flex items-center justify-center rounded-full bg-black/35 text-xl text-white"
        >
          ‹
        </Link>
        <div>
          <div className="font-display text-xl uppercase">{station.name}</div>
          <div className="text-xs text-muted">
            {station.address ?? 'Dirección no disponible'}
          </div>
        </div>
      </div>

      {(stationError || pricesError) && (
        <div className="mx-4 mt-4 space-y-1 text-sm text-red">
          {stationError && (
            <p>Error cargando gasolineras: {stationError.message}</p>
          )}
          {pricesError && (
            <p>Error cargando gasolineras: {pricesError.message}</p>
          )}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto px-4 py-4">
        {fuels.map((fuel) => {
          const isBest =
            fuel.price != null &&
            lowestPrice != null &&
            fuel.price === lowestPrice;

          return (
            <div
              key={fuel.key}
              className={`min-w-[92px] rounded-2xl border px-4 py-3 ${
                isBest ? 'border-green' : 'border-line'
              } bg-surface`}
            >
              <div className="text-xs uppercase text-muted">{fuel.label}</div>
              <div
                className={`mt-1 font-mono text-lg font-bold ${
                  isBest ? 'text-green' : 'text-ink'
                }`}
              >
                {fuel.price != null ? `${formatPrice(fuel.price)} €` : 'Sin datos'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-4 flex items-center justify-between rounded-2xl bg-surface2 px-4 py-3">
        <p className="text-xs text-muted">
          Precio reportado hace 12 minutos.
          <br />
          ¿Sigue siendo correcto?
        </p>
        <div className="flex gap-2">
          <button className="tap-target rounded-xl border border-line bg-surface text-lg">
            👍
          </button>
          <button className="tap-target rounded-xl border border-line bg-surface text-lg">
            👎
          </button>
        </div>
      </div>

      {services.length > 0 && (
        <div className="mx-4 mt-4 flex flex-wrap gap-2">
          {services.map((service) => (
            <span
              key={service}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted"
            >
              {service}
            </span>
          ))}
        </div>
      )}

      <div className="mx-4 mt-6">
        <Link
          href={`/station/${params.id}/report`}
          className="tap-target block w-full rounded-xl bg-yellow py-4 text-center font-display font-semibold uppercase tracking-wide text-[#141414]"
        >
          Reportar precio
        </Link>
      </div>
    </main>
  );
}
