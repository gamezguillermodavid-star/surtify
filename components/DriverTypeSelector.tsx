'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { friendlyErrorMessage } from '@/lib/friendly-error';

type DriverType = 'particular' | 'profesional';

const OPTIONS: { value: DriverType; label: string }[] = [
  { value: 'particular', label: 'Particular' },
  { value: 'profesional', label: '🚕 Profesional' },
];

export default function DriverTypeSelector({
  initialDriverType,
}: {
  initialDriverType: DriverType;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [driverType, setDriverType] = useState<DriverType>(initialDriverType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectDriverType(next: DriverType) {
    if (next === driverType || loading) return;
    setError(null);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError('Tienes que iniciar sesión de nuevo.');
      return;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ driver_type: next })
      .eq('id', user.id);

    setLoading(false);

    if (updateError) {
      setError(friendlyErrorMessage(updateError.message));
      return;
    }

    setDriverType(next);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-center gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={loading}
            onClick={() => selectDriverType(option.value)}
            className={`tap-target rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide disabled:opacity-60 ${
              driverType === option.value
                ? 'border-yellow bg-yellow text-[#141414]'
                : 'border-line bg-surface text-muted'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <p className="text-center text-xs text-red">{error}</p>}
    </div>
  );
}
