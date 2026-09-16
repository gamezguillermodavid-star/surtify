import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

// Solo para uso en código de servidor (API routes). Se salta la RLS,
// nunca debe importarse desde un componente cliente.
export function createServiceClient() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
