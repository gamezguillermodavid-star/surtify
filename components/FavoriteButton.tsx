'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ensurePushSubscription } from '@/lib/push';

export default function FavoriteButton({ stationId }: { stationId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('station_id', stationId)
        .maybeSingle();

      if (cancelled) return;

      setIsFavorite(Boolean(data));
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [stationId, supabase]);

  async function toggle() {
    if (loading) return;

    if (!userId) {
      router.push('/auth');
      return;
    }

    setLoading(true);

    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('station_id', stationId);

      setLoading(false);
      if (!error) setIsFavorite(false);
      return;
    }

    const { error } = await supabase.from('favorites').insert({
      user_id: userId,
      station_id: stationId,
    });

    setLoading(false);

    if (!error) {
      setIsFavorite(true);
      ensurePushSubscription(supabase, userId).catch(() => {});
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      className="tap-target absolute right-3 top-3 flex items-center justify-center rounded-full bg-black/35 text-xl text-white disabled:opacity-60"
    >
      {isFavorite ? '★' : '☆'}
    </button>
  );
}
