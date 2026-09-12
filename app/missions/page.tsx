import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const MISSIONS = [
  { period: 'Semanal', title: 'Reporta 3 gasolineras distintas', xp: 40, progress: 66 },
  { period: 'Semanal', title: 'Sube 2 fotos de carteles', xp: 25, progress: 50 },
  {
    period: 'Mensual · ideal si repostas poco',
    title: 'Reporta 1 precio este mes',
    xp: 15,
    progress: 0,
  },
  { period: 'Semanal', title: 'Confirma 5 precios de otros', xp: 20, progress: 20 },
];

const RANKING = [
  { pos: 1, name: 'Marta94', xp: '3.120 XP' },
  { pos: 2, name: 'Alex_T', xp: '2.860 XP' },
  { pos: 3, name: 'Javi_R (tú)', xp: '2.340 XP', me: true },
  { pos: 4, name: 'Lucía_M', xp: '1.980 XP' },
];

export default async function MissionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <main className="min-h-screen pb-24">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="font-display text-lg uppercase tracking-wide">
          ⛽ Surtify
        </span>
      </div>

      <div className="mt-4 px-4">
        <div className="mb-2 font-display text-xs uppercase tracking-wide text-muted">
          Misiones activas
        </div>
        <div className="space-y-3">
          {MISSIONS.map((m) => (
            <div
              key={m.title}
              className="rounded-2xl border border-line bg-surface px-4 py-4"
            >
              <div className="mb-1 text-[10px] uppercase tracking-wide text-muted">
                {m.period}
              </div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">{m.title}</span>
                <span className="font-mono text-xs text-yellow">
                  +{m.xp} XP
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface2">
                <div
                  className="h-full rounded-full bg-green"
                  style={{ width: `${m.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-violet/35 bg-violet/10 px-4 py-3 text-xs">
          <div className="mb-1 font-display uppercase tracking-wide text-violet">
            Territorio: Centro
          </div>
          Marta94 lidera esta zona con 12 aportes esta semana. Te faltan 4
          para arrebatarle el puesto.
        </div>

        <div className="mb-2 mt-6 font-display text-xs uppercase tracking-wide text-muted">
          Ranking de tu zona
        </div>
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {RANKING.map((r) => (
            <div
              key={r.pos}
              className={`flex items-center gap-3 px-4 py-3 ${
                r.me ? 'bg-yellow/10' : ''
              }`}
            >
              <span className="w-5 font-mono text-xs text-muted">
                {r.pos}
              </span>
              <span className="h-6 w-6 rounded-full bg-violet/60" />
              <span className="flex-1 text-sm">{r.name}</span>
              <span className="font-mono text-xs text-muted">{r.xp}</span>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
