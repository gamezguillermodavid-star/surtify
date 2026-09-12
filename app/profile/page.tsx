import BottomNav from '@/components/BottomNav';
import SignOutButton from '@/components/SignOutButton';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const BADGES = ['📸', '🎯', '🔥', '🗺️', '🏆', '⚡', '👑', '🛰️'];
const UNLOCKED = 3;

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
    .select('display_name, total_xp, level, streak_count, driver_type')
    .eq('id', user.id)
    .single();

  const displayName = profile?.display_name?.trim() || user.email || 'Usuario';
  const totalXp = profile?.total_xp ?? 0;
  const level = profile?.level ?? 'Novato';
  const streakCount = profile?.streak_count ?? 0;
  const formattedXp = totalXp.toLocaleString('es-ES');

  return (
    <main className="min-h-screen pb-24">
      <div className="flex flex-col items-center px-6 pt-8 text-center">
        {/* TODO: calcular a partir de xp_events y territories cuando existan */}
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
            strokeDasharray="230"
            strokeDashoffset="60"
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
            72%
          </text>
        </svg>
        <div className="font-display text-sm uppercase tracking-wide">
          {level}
        </div>
        <div className="mt-1 font-mono text-xs text-muted">
          {formattedXp} XP · faltan 460 XP para Leyenda
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
          <div className="font-mono text-lg font-bold text-yellow">86</div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Reportes
          </div>
        </div>
        {/* TODO: calcular a partir de xp_events y territories cuando existan */}
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-yellow">#3</div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            En tu zona
          </div>
        </div>
      </div>

      <div className="mt-6 px-5 font-display text-xs uppercase tracking-wide text-muted">
        Insignias
      </div>
      {/* TODO: calcular a partir de xp_events y territories cuando existan */}
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

      <div className="flex justify-center px-5">
        <SignOutButton />
      </div>

      <BottomNav />
    </main>
  );
}
