'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="mt-6 rounded-xl border border-line bg-surface px-6 py-3 text-sm text-muted transition-colors hover:bg-surface2"
    >
      Cerrar sesión
    </button>
  );
}
