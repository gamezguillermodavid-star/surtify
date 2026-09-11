import BottomNav from '@/components/BottomNav';

const BADGES = ['📸', '🎯', '🔥', '🗺️', '🏆', '⚡', '👑', '🛰️'];
const UNLOCKED = 3;

export default function ProfilePage() {
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
          Guardián de precios
        </div>
        <div className="mt-1 font-mono text-xs text-muted">
          2.340 XP · faltan 460 XP para Leyenda
        </div>
        <div className="mt-2 font-display text-lg uppercase">Javi_R</div>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-line bg-surface2 px-3 py-1 text-xs text-muted">
          🚕 Conductor profesional
        </span>
      </div>

      <div className="mt-6 flex justify-center gap-8">
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-yellow">6</div>
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

      <BottomNav />
    </main>
  );
}
