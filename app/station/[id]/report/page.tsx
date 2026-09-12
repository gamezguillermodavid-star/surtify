'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const FUEL_OPTIONS = ['Diésel', 'Gasolina 95', 'Gasolina 98', 'GLP'] as const;

const FUEL_TYPE_MAP: Record<(typeof FUEL_OPTIONS)[number], string> = {
  Diésel: 'diesel',
  'Gasolina 95': 'gasolina_95',
  'Gasolina 98': 'gasolina_98',
  GLP: 'glp',
};

export default function ReportPricePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [fuel, setFuel] = useState<(typeof FUEL_OPTIONS)[number]>(FUEL_OPTIONS[0]);
  const [price, setPrice] = useState('1.58');
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        router.replace('/auth');
        return;
      }

      setAuthChecking(false);
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router, supabase.auth]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/auth');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Introduce un precio válido.');
      return;
    }

    const photoFile = photoInputRef.current?.files?.[0];
    const hasPhoto = Boolean(photoFile);
    const xpAwarded = hasPhoto ? 3 : 1;
    const eventType = hasPhoto ? 'report_price_with_photo' : 'report_price';

    setLoading(true);

    const { error: priceError } = await supabase.from('fuel_prices').insert({
      station_id: params.id,
      fuel_type: FUEL_TYPE_MAP[fuel],
      price: parsedPrice,
      reported_by: user.id,
    });

    if (priceError) {
      setLoading(false);
      setError(priceError.message);
      return;
    }

    if (photoFile) {
      const storagePath = `${params.id}/${user.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('station-photos')
        .upload(storagePath, photoFile, { contentType: photoFile.type });

      if (!uploadError) {
        const { error: photoRowError } = await supabase
          .from('station_photos')
          .insert({
            station_id: params.id,
            user_id: user.id,
            storage_path: storagePath,
          });

        if (photoRowError) {
          console.warn('No se pudo registrar la foto:', photoRowError.message);
        }
      } else {
        console.warn('No se pudo subir la foto:', uploadError.message);
      }
    }

    const { error: xpError } = await supabase.from('xp_events').insert({
      user_id: user.id,
      event_type: eventType,
      xp_awarded: xpAwarded,
    });

    if (xpError) {
      setLoading(false);
      setError(xpError.message);
      return;
    }

    const { data: profile, error: profileFetchError } = await supabase
      .from('users')
      .select('total_xp, streak_count')
      .eq('id', user.id)
      .single();

    if (profileFetchError) {
      setLoading(false);
      setError(profileFetchError.message);
      return;
    }

    const { error: profileUpdateError } = await supabase
      .from('users')
      .update({
        total_xp: (profile?.total_xp ?? 0) + xpAwarded,
        streak_count: (profile?.streak_count ?? 0) + 1,
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      setLoading(false);
      setError(profileUpdateError.message);
      return;
    }

    setLoading(false);
    router.push(`/station/${params.id}`);
  }

  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-6">
        <p className="text-sm text-muted">Comprobando sesión…</p>
      </main>
    );
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
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-28 bg-transparent text-center font-mono text-3xl font-bold text-ink outline-none"
          />
          <span className="text-sm text-muted">€ / litro</span>
        </div>

        <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line px-4 py-6 text-center text-xs text-muted">
          <span className="mb-1 text-xl text-yellow">＋</span>
          Añade una foto del cartel de precios
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
          />
        </label>

        <div className="rounded-xl border border-green/30 bg-green/10 px-4 py-3 text-xs text-green">
          ⚡ Ganas 3 puntos por reportar con foto
        </div>

        {error && <p className="text-sm text-red">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="tap-target rounded-xl bg-yellow py-4 font-display font-semibold uppercase tracking-wide text-[#141414] disabled:opacity-60"
        >
          {loading ? 'Enviando…' : 'Confirmar precio'}
        </button>
      </form>
    </main>
  );
}
