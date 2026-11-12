import { createClient } from '@supabase/supabase-js';

function cleanEnv(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.replace(/^["']|["']$/g, '').trim();
}

export function createAdminClient() {
  const url = cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL,
  );

  const secret = cleanEnv(
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!url || !secret) {
    throw new Error('Supabase server configuration is missing.');
  }

  return createClient(url.replace(/\/$/, ''), secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
