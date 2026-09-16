'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'surtify_install_dismissed_at';
const DISMISS_DAYS = 14;

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
    const dismissedRecently =
      dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    if (dismissedRecently) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center gap-3 border-b border-line bg-surface px-4 py-3 shadow-md">
      <img src="/icons/icon-192.png" alt="Surtify" className="h-10 w-10 flex-shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold text-ink">Instalar Surtify</p>
        <p className="truncate text-xs text-muted">surtify-b3wb.vercel.app</p>
      </div>
      <button
        onClick={handleDismiss}
        className="px-2 py-1 text-sm font-medium text-muted"
        aria-label="Cerrar"
      >
        Ahora no
      </button>
      <button
        onClick={handleInstall}
        className="flex-shrink-0 rounded-full bg-yellow px-4 py-1.5 text-sm font-semibold text-ink"
      >
        Instalar
      </button>
    </div>
  );
}
