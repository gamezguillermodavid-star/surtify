'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FUEL_OPTIONS = ['Diésel', 'Gasolina 95', 'Gasolina 98', 'GLP'];

export default function ReportPricePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [fuel, setFuel] = useState(FUEL_OPTIONS[0]);
  const [price, setPrice] = useState('1.58');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Aquí se llamará a Supabase para insertar en fuel_prices + xp_events.
    router.push(`/station/${params.id}`);
  }

  return (
    <main className="min-h-screen px-5 py-6">
      <h2 className="font-display text-lg uppercase tracking-wide">
        Reportar precio
      </h2>
      <p className="mb-5 text-xs text-muted">
        Estación Aurora · Calle Mayor 14
      </p>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {FUEL_OPTIONS.map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFuel(f)}
              className={`tap-target rounded-xl border px-3 py-2 text-sm ${
                fuel === f
                  ? 'border-yellow bg-yellow font-semibold text-[#141414]'
                  : 'border-line bg-surface text-ink'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-baseline justify-center gap-2 rounded-2xl bg-surface2 py-5">
          <input
            type="number"
            step="0.001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-28 bg-transparent text-center font-mono text-3xl font-bold text-ink outline-none"
          />
          <span className="text-sm text-muted">€ / litro</span>
        </div>

        <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line px-4 py-6 text-center text-xs text-muted">
          <span className="mb-1 text-xl text-yellow">＋</span>
          Añade una foto del cartel de precios
          <input type="file" accept="image/*" className="hidden" />
        </label>

        <div className="rounded-xl border border-green/30 bg-green/10 px-4 py-3 text-xs text-green">
          ⚡ Ganas 3 puntos por reportar con foto
        </div>

        <button className="tap-target rounded-xl bg-yellow py-4 font-display font-semibold uppercase tracking-wide text-[#141414]">
          Confirmar precio
        </button>
      </form>
    </main>
  );
}
