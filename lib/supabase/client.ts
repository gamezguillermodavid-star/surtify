import { createBrowserClient } from '@supabase/ssr';

// En build (o si el proyecto aún no tiene Supabase configurado) usamos un
// placeholder válido para que `next build` no falle. En producción real,
// define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
