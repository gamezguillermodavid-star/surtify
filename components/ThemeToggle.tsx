'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('surtify-theme');
    const isDark = stored === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    window.localStorage.setItem('surtify-theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      className="tap-target flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-sm text-ink"
    >
      {dark ? '☀️ Claro' : '🌙 Oscuro'}
    </button>
  );
}
