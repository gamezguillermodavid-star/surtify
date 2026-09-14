'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-4xl">⛽💥</div>
      <h1 className="font-display text-lg uppercase tracking-wide text-ink">
        Algo ha ido mal
      </h1>
      <p className="max-w-xs text-sm text-muted">
        No hemos podido cargar esto. Puede que el servidor haya tardado
        demasiado en responder. Prueba a intentarlo de nuevo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="tap-target rounded-xl bg-yellow px-6 py-3 font-display font-semibold uppercase tracking-wide text-[#141414]"
      >
        Reintentar
      </button>
    </main>
  );
}
