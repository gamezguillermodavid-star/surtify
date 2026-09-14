import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-4xl">🧭</div>
      <h1 className="font-display text-lg uppercase tracking-wide text-ink">
        No encontramos esto
      </h1>
      <p className="max-w-xs text-sm text-muted">
        La página que buscas no existe o se ha movido.
      </p>
      <Link
        href="/map"
        className="tap-target rounded-xl bg-yellow px-6 py-3 font-display font-semibold uppercase tracking-wide text-[#141414]"
      >
        Ir al mapa
      </Link>
    </main>
  );
}
