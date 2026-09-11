'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep('otp');
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/map');
  }

  return (
    <main className="flex min-h-screen flex-col justify-center px-6">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow font-display text-2xl font-bold text-[#141414]">
        S
      </div>

      {step === 'email' && (
        <form onSubmit={sendOtp} className="flex flex-col gap-4">
          <h2 className="font-display text-xl uppercase tracking-wide">
            Regístrate con tu email
          </h2>
          <p className="text-sm text-muted">
            Sin contraseña: te enviamos un código de un solo uso.
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
            {loading ? 'Enviando…' : 'Enviar código'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={verifyOtp} className="flex flex-col gap-4">
          <h2 className="font-display text-xl uppercase tracking-wide">
            Verifica tu correo
          </h2>
          <p className="text-sm text-muted">
            Te hemos enviado un código de seis dígitos a {email}
          </p>
          <input
            type="text"
            required
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-xl border border-yellow bg-surface px-4 py-3 text-center font-mono text-lg tracking-[0.5em] text-ink"
          />
          {error && <p className="text-sm text-red">{error}</p>}
          <button
            disabled={loading}
            className="tap-target rounded-xl bg-yellow px-6 py-4 font-display font-semibold uppercase tracking-wide text-[#141414] disabled:opacity-60"
          >
            {loading ? 'Verificando…' : 'Confirmar código'}
          </button>
        </form>
      )}
    </main>
  );
}
