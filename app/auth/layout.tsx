import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Si ya hay sesión, no tiene sentido mostrar el login/registro.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/map');
  }

  return children;
}
