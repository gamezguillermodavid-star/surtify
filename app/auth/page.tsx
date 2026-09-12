'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Mode = 'register' | 'login';

const inputClassName =
  'rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink';

export default function AuthPage() {
  const supabase = createClient();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('register');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('users').upsert(
        { id: data.user.id, display_name: nickname },
        { onConflict: 'id' }
      );

      if (profileError) {
        setLoading(false);
        setError(profileError.message);
        return;
      }
    }

    setLoading(false);
    router.push('/map');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push('/map');
  }

  return (
    <main className="flex min-h-screen flex-col justify-center px-6">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow font-display text-2xl font-bold text-[#141414]">
        S
      </div>

      {mode === 'register' ? (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <h2 className="font-display text-xl uppercase tracking-wide">
            Crear cuenta
          </h2>
          <p className="text-sm text-muted">
            Elige un nickname y regístrate con email y contraseña.
          </p>
          <input
            type="text"
            required
            placeholder="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={inputClassName}
          />
          <input
            type="email"
            required
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClassName}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Repetir contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClassName}
          />
          {error && <p className="text-sm text-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="tap-target rounded-xl bg-yellow px-6 py-4 font-display font-semibold uppercase tracking-wide text-[#141414] disabled:opacity-60"
          >
            {loading ? 'Registrando…' : 'Registrarse'}
          </button>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="text-sm text-muted underline"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <h2 className="font-display text-xl uppercase tracking-wide">
            Iniciar sesión
          </h2>
          <p className="text-sm text-muted">
            Entra con tu email y contraseña.
          </p>
          <input
            type="email"
            required
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClassName}
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
          />
          {error && <p className="text-sm text-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="tap-target rounded-xl bg-yellow px-6 py-4 font-display font-semibold uppercase tracking-wide text-[#141414] disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className="text-sm text-muted underline"
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </form>
      )}
    </main>
  );
}
