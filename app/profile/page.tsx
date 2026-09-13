import BottomNav from '@/components/BottomNav';
import FeedbackForm from '@/components/FeedbackForm';
import SignOutButton from '@/components/SignOutButton';
import { createClient } from '@/lib/supabase/server';
import { getLevelProgress } from '@/lib/levels';
import { redirect } from 'next/navigation';

const BADGES = ['📸', '🎯', '🔥', '🗺️', '🏆', '⚡', '👑', '🛰️'];
// TODO: aún no hay criterio de desbloqueo real para las insignias.
const UNLOCKED = 0;

const RING_ARC_LENGTH = 90 * Math.PI;

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, total_xp, streak_count, driver_type')
    .eq('id', user.id)
    .single();

  const { count: reportsCount } = await supabase
    .from('fuel_prices')
    .select('id', { count: 'exact', head: true })
    .eq('reported_by', user.id);

  const { data: allUsersByXp } = await supabase
    .from('users')
    .select('id, total_xp')
    .order('total_xp', { ascending: false });

  const rank = allUsersByXp
    ? allUsersByXp.findIndex((row) => row.id === user.id) + 1
    : null;
  const totalRankedUsers = allUsersByXp?.length ?? null;

  const displayName = profile?.display_name?.trim() || user.email || 'Usuario';
  const totalXp = profile?.total_xp ?? 0;
  const streakCount = profile?.streak_count ?? 0;
  const formattedXp = totalXp.toLocaleString('es-ES');
  const levelProgress = getLevelProgress(totalXp);
  const ringOffset =
    RING_ARC_LENGTH * (1 - levelProgress.progressPercent / 100);

  return (
    <main className="min-h-screen pb-24">
      <div className="flex flex-col items-center px-6 pt-8 text-center">
        <svg viewBox="0 0 220 130" className="h-32 w-56">
          <path
            d="M20,120 A90,90 0 0 1 200,120"
            fill="none"
            className="stroke-surface2"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M20,120 A90,90 0 0 1 200,120"
            fill="none"
            className="stroke-yellow"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={RING_ARC_LENGTH}
            strokeDashoffset={ringOffset}
          />
          <text
            x="110"
            y="95"
            textAnchor="middle"
            fontFamily="var(--font-space-mono)"
            fontSize="26"
            fontWeight={700}
            className="fill-ink"
          >
            {levelProgress.progressPercent}%
          </text>
        </svg>
        <div className="font-display text-sm uppercase tracking-wide">
          {levelProgress.name}
        </div>
        <div className="mt-1 font-mono text-xs text-muted">
          {levelProgress.isMaxLevel
            ? `${formattedXp} XP · Nivel máximo alcanzado`
            : `${formattedXp} XP · faltan ${levelProgress.xpToNext.toLocaleString(
                'es-ES'
              )} XP para ${levelProgress.nextName}`}
        </div>
        <div className="mt-2 font-display text-lg uppercase">{displayName}</div>
        {profile?.driver_type === 'profesional' && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-line bg-surface2 px-3 py-1 text-xs text-muted">
            🚕 Conductor profesional
          </span>
        )}
      </div>

      <div className="mt-6 flex justify-center gap-8">
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-yellow">
            {streakCount}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Racha aportes
          </div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-yellow">
            {reportsCount ?? 0}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Reportes
          </div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-yellow">
            {rank != null ? `#${rank}` : '—'}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            {totalRankedUsers != null && totalRankedUsers > 1
              ? `De ${totalRankedUsers} usuarios`
              : 'En tu zona'}
          </div>
        </div>
      </div>

      <div className="mt-6 px-5 font-display text-xs uppercase tracking-wide text-muted">
        Insignias
      </div>
      {/* TODO: definir criterios reales de desbloqueo por insignia */}
      <div className="mt-2 grid grid-cols-4 gap-3 px-5">
        {BADGES.map((b, i) => (
          <div
            key={b}
            className={`flex aspect-square items-center justify-center rounded-2xl border border-line bg-surface text-xl ${
              i >= UNLOCKED ? 'opacity-25' : ''
            }`}
          >
            {b}
          </div>
        ))}
      </div>

      <div className="mt-6 px-5">
        <div className="mb-2 font-display text-xs uppercase tracking-wide text-muted">
          Comentarios de mejora
        </div>
        <FeedbackForm />
      </div>

      <div className="mt-6 flex justify-center px-5">
        <SignOutButton />
      </div>

      <BottomNav />
    </main>
  );
}
