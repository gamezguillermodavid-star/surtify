'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PriceConfirmButtons({
  fuelPriceId,
}: {
  fuelPriceId: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [voted, setVoted] = useState<1 | -1 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function vote(value: 1 | -1) {
    if (loading || voted) return;
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth');
      return;
    }

    const { error: voteError } = await supabase.from('price_confirmations').insert({
      fuel_price_id: fuelPriceId,
      user_id: user.id,
      vote: value,
    });

    setLoading(false);

    if (voteError) {
      setError('No se pudo registrar tu voto.');
      return;
    }

    setVoted(value);
  }

  if (voted) {
    return <p className="text-xs text-green">¡Gracias por confirmarlo!</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => vote(1)}
          disabled={loading}
          className="tap-target rounded-xl border border-line bg-surface text-lg disabled:opacity-60"
        >
          👍
        </button>
        <button
          type="button"
          onClick={() => vote(-1)}
          disabled={loading}
          className="tap-target rounded-xl border border-line bg-surface text-lg disabled:opacity-60"
        >
          👎
        </button>
      </div>
      {error && <p className="text-[11px] text-red">{error}</p>}
    </div>
  );
}
