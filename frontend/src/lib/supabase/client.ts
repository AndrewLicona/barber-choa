import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Singleton para evitar múltiples instancias
let _client: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabase() {
  if (!_client) {
    _client = createSupabaseClient(url, key);
  }
  return _client;
}
