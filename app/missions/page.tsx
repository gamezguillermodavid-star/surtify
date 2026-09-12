import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/server';
import { startOfMonthISO, startOfWeekISO } from '@/lib/period';
import { redirect } from 'next/navigation';

type Mission = {
  id: string;
  title: string;
  period: 'semanal' | 'mensual';
  xp_reward: number;
  target_count: number;
  metric: string | null;
};

async function computeProgress(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  metric: string | null
): Promise<number> {
  const weekStart = startOfWeekISO();
  const monthStart = startOfMonthISO();

  switch (metric) {
    case 'distinct_stations_week': {
      const { data } = await supabase
        .from('fuel_prices')
        .select('station_id')
        .eq('reported_by', userId)
        .gte('reported_at', weekStart);
      return new Set((data ?? []).map((row) => row.station_id)).size;
    }
    case 'photos_week': {
      const { count } = await supabase
        .from('station_photos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', weekStart);
      return count ?? 0;
    }
    case 'price_reports_month': {
      const { count } = await supabase
        .from('fuel_prices')
        .select('id', { count: 'exact', head: true })
        .eq('reported_by', userId)
        .gte('reported_at', monthStart);
      return count ?? 0;
    }
    default:
      return 0;
  }
}

export default async function MissionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: missionsData } = await supabase
    .from('missions')
    .select('id, title, period, xp_reward, target_count, metric')
    .eq('active', true)
    .order('period', { ascending: true });

  const missions = (missionsData ?? []) as Mission[];

  const missionsWithProgress = await Promise.all(
    missions.map(async (mission) => {
      const progress = await computeProgress(supabase, user.id, mission.metric);
      const percent = Math.max(
        0,
        Math.min(100, Math.round((progress / mission.target_count) * 100))
      );
      return { ...mission, progress, percent };
    })
  );

  const { data: territory } = await supabase
    .from('territories')
    .select('zone_name')
    .limit(1)
    .maybeSingle();

  const { data: leaderboard } = await supabase
    .from('users')
    .select('id, display_name, total_xp')
    .order('total_xp', { ascending: false })
    .limit(20);

  const weekStart = startOfWeekISO();
  const { data: weeklyEvents } = await supabase
    .from('xp_events')
    .select('user_id')
    .gte('created_at', weekStart);

  const weeklyCountByUser = new Map<string, number>();
  for (const row of weeklyEvents ?? []) {
    weeklyCountByUser.set(
      row.user_id,
      (weeklyCountByUser.get(row.user_id) ?? 0) + 1
    );
  }

  let leaderUserId: string | null = null;
  let leaderCount = 0;
  for (const [userId, count] of weeklyCountByUser.entries()) {
    if (count > leaderCount) {
      leaderCount = count;
      leaderUserId = userId;
    }
  }

  const myWeeklyCount = weeklyCountByUser.get(user.id) ?? 0;
  const leaderName =
    leaderUserId != null
      ? leaderboard?.find((row) => row.id === leaderUserId)?.display_name ??
        'Alguien'
      : null;

  const aporte = (count: number) => (count === 1 ? 'aporte' : 'aportes');

  let territoryMessage: string;
  if (leaderUserId == null) {
    territoryMessage = 'Sé el primero en aportar esta semana en tu zona.';
  } else if (leaderUserId === user.id) {
    territoryMessage = `Vas en cabeza en tu zona con ${leaderCount} ${aporte(leaderCount)} esta semana.`;
  } else {
    const missing = Math.max(1, leaderCount - myWeeklyCount);
    territoryMessage = `${leaderName} lidera esta zona con ${leaderCount} ${aporte(leaderCount)} esta semana. Te faltan ${missing} para arrebatarle el puesto.`;
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
          {missionsWithProgress.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-line bg-surface px-4 py-4"
            >
              <div className="mb-1 text-[10px] uppercase tracking-wide text-muted">
                {m.period === 'semanal' ? 'Semanal' : 'Mensual'}
              </div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">{m.title}</span>
                <span className="font-mono text-xs text-yellow">
                  +{m.xp_reward} XP
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface2">
                <div
                  className="h-full rounded-full bg-green"
                  style={{ width: `${m.percent}%` }}
                />
              </div>
              <div className="mt-1 text-right text-[10px] text-muted">
                {m.progress}/{m.target_count}
              </div>
            </div>
          ))}
          {missionsWithProgress.length === 0 && (
            <p className="text-xs text-muted">
              No hay misiones activas ahora mismo.
            </p>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-violet/35 bg-violet/10 px-4 py-3 text-xs">
          <div className="mb-1 font-display uppercase tracking-wide text-violet">
            Territorio: {territory?.zone_name ?? 'Sin asignar'}
          </div>
          {territoryMessage}
        </div>

        <div className="mb-2 mt-6 font-display text-xs uppercase tracking-wide text-muted">
          Ranking de tu zona
        </div>
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {(leaderboard ?? []).map((r, i) => {
            const isMe = r.id === user.id;
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  isMe ? 'bg-yellow/10' : ''
                }`}
              >
                <span className="w-5 font-mono text-xs text-muted">
                  {i + 1}
                </span>
                <span className="h-6 w-6 rounded-full bg-violet/60" />
                <span className="flex-1 text-sm">
                  {r.display_name?.trim() || 'Usuario'}
                  {isMe ? ' (tú)' : ''}
                </span>
                <span className="font-mono text-xs text-muted">
                  {(r.total_xp ?? 0).toLocaleString('es-ES')} XP
                </span>
              </div>
            );
          })}
          {(leaderboard ?? []).length === 0 && (
            <p className="px-4 py-3 text-xs text-muted">
              Todavía no hay usuarios en el ranking.
            </p>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
