'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const supabase = createClient();

  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep('sent');
  }

  return (
    <main className="flex min-h-screen flex-col justify-center px-6">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow font-display text-2xl font-bold text-[#141414]">
        S
      </div>

      {step === 'email' && (
        <form onSubmit={sendMagicLink} className="flex flex-col gap-4">
          <h2 className="font-display text-xl uppercase tracking-wide">
            Regístrate con tu email
          </h2>
          <p className="text-sm text-muted">
            Sin contraseña: te enviamos un enlace de acceso.
          </p>
          <input
            type="email"
            required
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
          />
          {error && <p className="text-sm text-red">{error}</p>}
          <button
            disabled={loading}
            className="tap-target rounded-xl bg-yellow px-6 py-4 font-display font-semibold uppercase tracking-wide text-[#141414] disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}

      {step === 'sent' && (
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl uppercase tracking-wide">
            Revisa tu correo
          </h2>
          <p className="text-sm text-muted">
            Te hemos enviado un enlace de acceso a {email}. Ábrelo desde este
            mismo dispositivo para entrar.
          </p>
        </div>
      )}
    </main>
  );
}
