'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { friendlyErrorMessage } from '@/lib/friendly-error';
import { ensurePushSubscription } from '@/lib/push';

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`tap-target relative h-7 w-12 rounded-full transition-colors disabled:opacity-60 ${
        checked ? 'bg-yellow' : 'bg-surface2'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function NotificationSettings({
  initialNotifyFavorites,
  initialNotifyZone,
}: {
  initialNotifyFavorites: boolean;
  initialNotifyZone: boolean;
}) {
  const supabase = createClient();
  const [notifyFavorites, setNotifyFavorites] = useState(initialNotifyFavorites);
  const [notifyZone, setNotifyZone] = useState(initialNotifyZone);
  const [loading, setLoading] = useState<'favorites' | 'zone' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleFavorites() {
    if (loading) return;
    setError(null);
    setLoading('favorites');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(null);
      setError('Tienes que iniciar sesión de nuevo.');
      return;
    }

    const next = !notifyFavorites;

    if (next) {
      await ensurePushSubscription(supabase, user.id).catch(() => {});
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ notify_favorites: next })
      .eq('id', user.id);

    setLoading(null);

    if (updateError) {
      setError(friendlyErrorMessage(updateError.message));
      return;
    }

    setNotifyFavorites(next);
  }

  async function toggleZone() {
    if (loading) return;
    setError(null);
    setLoading('zone');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(null);
      setError('Tienes que iniciar sesión de nuevo.');
      return;
    }

    if (notifyZone) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          notify_zone: false,
          last_latitude: null,
          last_longitude: null,
          last_location_updated_at: null,
        })
        .eq('id', user.id);

      setLoading(null);

      if (updateError) {
        setError(friendlyErrorMessage(updateError.message));
        return;
      }

      setNotifyZone(false);
      return;
    }

    if (!('geolocation' in navigator)) {
      setLoading(null);
      setError('Tu navegador no soporta geolocalización.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await ensurePushSubscription(supabase, user.id).catch(() => {});

        const { error: updateError } = await supabase
          .from('users')
          .update({
            notify_zone: true,
            last_latitude: position.coords.latitude,
            last_longitude: position.coords.longitude,
            last_location_updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        setLoading(null);

        if (updateError) {
          setError(friendlyErrorMessage(updateError.message));
          return;
        }

        setNotifyZone(true);
      },
      () => {
        setLoading(null);
        setError('Necesitamos tu ubicación para activar las notificaciones de zona.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-ink">Favoritos</div>
          <div className="text-[11px] text-muted">
            Avisos de tus gasolineras favoritas
          </div>
        </div>
        <Toggle
          checked={notifyFavorites}
          disabled={loading !== null}
          onChange={toggleFavorites}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-ink">Zona</div>
          <div className="text-[11px] text-muted">
            Avisos de gasolineras cerca de ti
          </div>
        </div>
        <Toggle checked={notifyZone} disabled={loading !== null} onChange={toggleZone} />
      </div>
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}
