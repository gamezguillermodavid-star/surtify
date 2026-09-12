import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const STATIONS = [
  { id: '1', name: 'Estación Aurora', price: '1,579', level: 'cheap' as const, distance: '900 m' },
  { id: '2', name: 'Repostaje Norte', price: '1,629', level: 'mid' as const, distance: '1,4 km' },
  { id: '3', name: 'Vía Combustibles', price: '1,699', level: 'high' as const, distance: '2,1 km' },
];

const LEVEL_CLASS: Record<string, string> = {
  cheap: 'bg-green text-[#0d0d0d]',
  mid: 'bg-yellow text-[#0d0d0d]',
  high: 'bg-red text-white',
};

export default async function MapPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const cheapest = STATIONS[0];

  return (
    <main className="min-h-screen pb-24">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="font-display text-lg uppercase tracking-wide">
          ⛽ Surtify
        </span>
        <ThemeToggle />
      </div>

      <p className="px-4 pt-4 text-sm text-muted">
        Mapa de ejemplo — se sustituirá por Mapbox con la ubicación real y los
        marcadores de gasolineras cercanas.
      </p>

      <div className="mx-4 mt-4 space-y-2">
        {STATIONS.map((s) => (
          <Link
            key={s.id}
            href={`/station/${s.id}`}
            className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3"
          >
            <div>
              <div className="font-display text-sm uppercase">{s.name}</div>
              <div className="text-xs text-muted">A {s.distance} · Diésel</div>
            </div>
            <span
              className={`rounded-lg px-3 py-1 font-mono text-sm font-bold ${LEVEL_CLASS[s.level]}`}
            >
              {s.price} €
            </span>
          </Link>
        ))}
      </div>

      <div className="mx-4 mt-6 rounded-2xl border border-line bg-surface2 px-4 py-3 text-sm">
        La más barata cerca de ti: <b>{cheapest.name}</b> a {cheapest.distance}
        , {cheapest.price} €.
      </div>

      <BottomNav />
    </main>
  );
}
