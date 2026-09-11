'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/map', label: 'Mapa', icon: '🗺️' },
  { href: '/missions', label: 'Misiones', icon: '🏁' },
  { href: '/profile', label: 'Perfil', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-surface px-2 pb-2 pt-1">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tap-target flex flex-col items-center justify-center gap-1 text-xs ${
              active ? 'text-yellow' : 'text-muted'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
