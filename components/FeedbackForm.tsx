'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function FeedbackForm() {
  const supabase = createClient();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = body.trim();
    if (trimmed.length === 0) {
      setError('Escribe algo antes de enviar.');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('Tienes que iniciar sesión de nuevo.');
      return;
    }

    setLoading(true);
    const { error: insertError } = await supabase.from('app_feedback').insert({
      user_id: user.id,
      body: trimmed,
    });
    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setBody('');
    setSent(true);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setSent(false);
        }}
        placeholder="¿Qué mejorarías de la app?"
        rows={3}
        className="w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted"
      />
      {error && <p className="text-xs text-red">{error}</p>}
      {sent && !error && (
        <p className="text-xs text-green">Gracias, lo hemos recibido.</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="tap-target self-start rounded-xl bg-yellow px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#141414] disabled:opacity-60"
      >
        {loading ? 'Enviando…' : 'Enviar comentario'}
      </button>
    </form>
  );
}
