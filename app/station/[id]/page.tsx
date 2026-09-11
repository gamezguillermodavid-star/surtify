import Link from 'next/link';

const FUELS = [
  { name: 'Diésel', price: '1,579', best: true },
  { name: 'Gasolina 95', price: '1,674', best: false },
  { name: 'Gasolina 98', price: '1,789', best: false },
];

const SERVICES = ['☕ Cafetería', '🚻 Aseos', '🧽 Lavado', '🏪 Tienda'];

export default function StationPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen pb-10">
      <div className="relative flex h-36 items-end bg-surface2 px-4 py-4">
        <Link
          href="/map"
          className="tap-target absolute left-3 top-3 flex items-center justify-center rounded-full bg-black/35 text-xl text-white"
        >
          ‹
        </Link>
        <div>
          <div className="font-display text-xl uppercase">
            Estación Aurora
          </div>
          <div className="text-xs text-muted">
            Calle Mayor 14 · Abierta 24 horas
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-4">
        {FUELS.map((f) => (
          <div
            key={f.name}
            className={`min-w-[92px] rounded-2xl border px-4 py-3 ${
              f.best ? 'border-green' : 'border-line'
            } bg-surface`}
          >
            <div className="text-xs uppercase text-muted">{f.name}</div>
            <div
              className={`mt-1 font-mono text-lg font-bold ${
                f.best ? 'text-green' : 'text-ink'
              }`}
            >
              {f.price} €
            </div>
          </div>
        ))}
      </div>

      <div className="mx-4 flex items-center justify-between rounded-2xl bg-surface2 px-4 py-3">
        <p className="text-xs text-muted">
          Precio reportado hace 12 minutos.
          <br />
          ¿Sigue siendo correcto?
        </p>
        <div className="flex gap-2">
          <button className="tap-target rounded-xl border border-line bg-surface text-lg">
            👍
          </button>
          <button className="tap-target rounded-xl border border-line bg-surface text-lg">
            👎
          </button>
        </div>
      </div>

      <div className="mx-4 mt-4 flex flex-wrap gap-2">
        {SERVICES.map((s) => (
          <span
            key={s}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mx-4 mt-6">
        <Link
          href={`/station/${params.id}/report`}
          className="tap-target block w-full rounded-xl bg-yellow py-4 text-center font-display font-semibold uppercase tracking-wide text-[#141414]"
        >
          Reportar precio
        </Link>
      </div>
    </main>
  );
}
