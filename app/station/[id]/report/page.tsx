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
  const [prices, setPrices] = useState<Record<(typeof FUEL_OPTIONS)[number], string>>({
    Diésel: '',
    'Gasolina 95': '',
    'Gasolina 98': '',
    GLP: '',
  });
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [station, setStation] = useState<{
    name: string;
    address: string | null;
  } | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [readyToContinue, setReadyToContinue] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuthAndLoadStation() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        router.replace('/auth');
        return;
      }

      const { data: stationData } = await supabase
        .from('gas_stations')
        .select('name, address')
        .eq('id', params.id)
        .single();

      if (cancelled) return;

      if (stationData) {
        setStation({ name: stationData.name, address: stationData.address });
      }

      setAuthChecking(false);
    }

    checkAuthAndLoadStation();

    return () => {
      cancelled = true;
    };
  }, [params.id, router, supabase]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhotoPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : null;
    });
    setPhotoFileName(file?.name ?? null);
  }

  function clearPhoto() {
    if (photoInputRef.current) photoInputRef.current.value = '';
    setPhotoPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setPhotoFileName(null);
  }

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

    const parsedPrice = parseFloat(prices[fuel]);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Introduce un precio válido.');
      return;
    }

    const photoFile = photoInputRef.current?.files?.[0];

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

    let photoUploaded = false;

    if (photoFile) {
      const storagePath = `${params.id}/${user.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('station-photos')
        .upload(storagePath, photoFile, { contentType: photoFile.type });

      if (uploadError) {
        setLoading(false);
        setReadyToContinue(true);
        setError(
          `El precio se ha guardado, pero no se pudo subir la foto: ${uploadError.message}`
        );
        return;
      }

      const { error: photoRowError } = await supabase
        .from('station_photos')
        .insert({
          station_id: params.id,
          user_id: user.id,
          storage_path: storagePath,
        });

      if (photoRowError) {
        setLoading(false);
        setReadyToContinue(true);
        setError(
          `El precio se ha guardado, pero no se pudo registrar la foto: ${photoRowError.message}`
        );
        return;
      }

      photoUploaded = true;
    }

    const xpAwarded = photoUploaded ? 3 : 1;
    const eventType = photoUploaded ? 'report_price_with_photo' : 'report_price';

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
        {station?.name ?? 'Gasolinera'}
        {station?.address ? ` · ${station.address}` : ''}
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
            placeholder="1.XX"
            value={prices[fuel]}
            onChange={(e) =>
              setPrices((previous) => ({ ...previous, [fuel]: e.target.value }))
            }
            className="w-28 bg-transparent text-center font-mono text-3xl font-bold text-ink outline-none placeholder:text-muted"
          />
          <span className="text-sm text-muted">€ / litro</span>
        </div>

        {photoPreviewUrl ? (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreviewUrl}
              alt="Vista previa del cartel de precios"
              className="h-14 w-14 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-ink">
                {photoFileName}
              </div>
              <div className="text-[11px] text-green">Foto lista para enviar</div>
            </div>
            <button
              type="button"
              onClick={clearPhoto}
              className="tap-target rounded-lg border border-line px-2 py-1 text-[11px] uppercase text-muted"
            >
              Quitar
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line px-4 py-6 text-center text-xs text-muted">
            <span className="mb-1 text-xl text-yellow">＋</span>
            Añade una foto del cartel de precios
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
        )}

        <div className="rounded-xl border border-green/30 bg-green/10 px-4 py-3 text-xs text-green">
          ⚡ Ganas 3 puntos por reportar con foto
        </div>

        {error && <p className="text-sm text-red">{error}</p>}

        {readyToContinue ? (
          <button
            type="button"
            onClick={() => router.push(`/station/${params.id}`)}
            className="tap-target rounded-xl bg-yellow py-4 font-display font-semibold uppercase tracking-wide text-[#141414]"
          >
            Continuar a la ficha
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="tap-target rounded-xl bg-yellow py-4 font-display font-semibold uppercase tracking-wide text-[#141414] disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Confirmar precio'}
          </button>
        )}
      </form>
    </main>
  );
}
