import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { buildGoogleMapsUrl, buildWazeUrl } from '@/lib/directions';
import { friendlyErrorMessage } from '@/lib/friendly-error';
import PriceConfirmButtons from './PriceConfirmButtons';
import Schedule from './Schedule';
import FavoriteButton from '@/components/FavoriteButton';

const SERVICE_LABELS: Record<string, string> = {
  aseos: '🚻 Aseos',
  pago_tarjeta: '💳 Pago con tarjeta',
  tienda: '🏪 Tienda',
  aire_agua: '💨 Aire y agua',
  lavado: '🚿 Lavado',
};

const WAIT_LABELS: Record<string, { label: string; className: string }> = {
  sin_espera: { label: '🟢 Sin espera', className: 'border-green text-green' },
  espera_normal: {
    label: '🟡 Espera normal',
    className: 'border-yellow text-yellow',
  },
  mucha_espera: { label: '🔴 Mucha espera', className: 'border-red text-red' },
};

function relativeTime(isoDate: string): string {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(isoDate).getTime()) / 60000)
  );
  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

const FUEL_TYPES = [
  { key: 'diesel', label: 'Diésel' },
  { key: 'gasoleo_premium', label: 'Gasóleo Premium' },
  { key: 'gasoleo_b', label: 'Gasóleo B' },
  { key: 'gasolina_95', label: 'Gasolina 95' },
  { key: 'gasolina_95_premium', label: 'Gasolina 95 Premium' },
  { key: 'gasolina_98', label: 'Gasolina 98' },
  { key: 'glp', label: 'GLP' },
  { key: 'adblue', label: 'AdBlue' },
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
    .select('id, name, address, latitude, longitude, schedule')
    .eq('id', params.id)
    .single();

  const { data: fuelPrices, error: pricesError } = await supabase
    .from('fuel_prices')
    .select('id, fuel_type, price, reported_at')
    .eq('station_id', params.id)
    .order('reported_at', { ascending: false });

  const { data: serviceReports } = await supabase
    .from('service_reports')
    .select('service')
    .eq('station_id', params.id);

  const { data: waitReports } = await supabase
    .from('wait_time_reports')
    .select('level, created_at')
    .eq('station_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (stationError && !station) {
    return (
      <main className="min-h-screen px-4 py-6">
        <Link href="/map" className="text-sm text-muted">
          ‹ Volver
        </Link>
        <p className="mt-4 text-sm text-red">
          {friendlyErrorMessage(stationError.message)}
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
    .filter((fuel) => fuel.key !== 'adblue')
    .map((fuel) => fuel.price)
    .filter((price): price is number => price != null);

  const lowestPrice =
    pricesWithData.length > 0 ? Math.min(...pricesWithData) : null;

  const confirmedServices = Array.from(
    new Set((serviceReports ?? []).map((row) => row.service))
  );

  const latestWait = waitReports && waitReports.length > 0 ? waitReports[0] : null;

  const latestReport = fuelPrices && fuelPrices.length > 0 ? fuelPrices[0] : null;

  return (
    <main className="min-h-screen pb-10">
      <div className="relative flex h-36 items-end bg-surface2 px-4 py-4">
        <Link
          href="/map"
          className="tap-target absolute left-3 top-3 flex items-center justify-center rounded-full bg-black/35 text-xl text-white"
        >
          ‹
        </Link>
        <FavoriteButton stationId={station.id} />
        <div>
          <div className="font-display text-xl uppercase">{station.name}</div>
          <div className="text-xs text-muted">
            {station.address ?? 'Dirección no disponible'}
          </div>
        </div>
      </div>

      {pricesError && (
        <div className="mx-4 mt-4 space-y-1 text-sm text-red">
          <p>{friendlyErrorMessage(pricesError.message)}</p>
        </div>
      )}

      <div className="mx-4 mt-4 grid grid-cols-2 gap-2">
        <a
          href={buildWazeUrl(station.latitude, station.longitude)}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface py-3 text-sm font-semibold uppercase text-ink"
        >
          🧭 Waze
        </a>
        <a
          href={buildGoogleMapsUrl(station.latitude, station.longitude)}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface py-3 text-sm font-semibold uppercase text-ink"
        >
          🗺️ Maps
        </a>
      </div>

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

      {latestReport && (
        <div className="mx-4 flex items-center justify-between rounded-2xl bg-surface2 px-4 py-3">
          <p className="text-xs text-muted">
            Último precio reportado.
            <br />
            ¿Sigue siendo correcto?
          </p>
          <PriceConfirmButtons fuelPriceId={latestReport.id} />
        </div>
      )}

      <Schedule raw={station.schedule} />

      {latestWait && WAIT_LABELS[latestWait.level] && (
        <div className="mx-4 mt-4">
          <span
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold ${WAIT_LABELS[latestWait.level].className}`}
          >
            {WAIT_LABELS[latestWait.level].label}
          </span>
          <span className="ml-2 text-[11px] text-muted">
            reportado {relativeTime(latestWait.created_at)}
          </span>
        </div>
      )}

      {confirmedServices.length > 0 && (
        <div className="mx-4 mt-4 flex flex-wrap gap-2">
          {confirmedServices.map((service) => (
            <span
              key={service}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted"
            >
              {SERVICE_LABELS[service] ?? service}
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
