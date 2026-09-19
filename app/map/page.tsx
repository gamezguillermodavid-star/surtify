import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import StationsMap from '@/components/StationsMap';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function MapPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <main className="min-h-screen pb-24">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="font-display text-lg uppercase tracking-wide">
          ⛽ Surtify
        </span>
        <ThemeToggle />
      </div>

      <StationsMap />

      <BottomNav />
    </main>
  );
}
