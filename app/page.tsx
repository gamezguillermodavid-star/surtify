import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="text-5xl">⛽</div>
      <h1 className="font-display text-2xl uppercase tracking-wide">
        Bienvenido a Surtify
      </h1>
      <p className="max-w-xs text-sm text-muted">
        Sin datos oficiales con retraso. Los precios los confirma gente como
        tú, minuto a minuto.
      </p>
      <Link
        href="/auth"
        className="tap-target w-full max-w-xs rounded-xl bg-yellow px-6 py-4 text-center font-display font-semibold uppercase tracking-wide text-[#141414]"
      >
        Empezar
      </Link>
    </main>
  );
}
