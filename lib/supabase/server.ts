import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const SUPABASE_URL = 'https://vwoqjsjlfxcvsjygxwgp.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_hKXsHS1YImdkp6G7IFhslA_AUz-XgU7';

export function configured() {
  return true;
}

export async function createClient() {
  const jar = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(values: { name: string; value: string; options: CookieOptions }[]) {
          try {
            values.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            // Read-only Server Components cannot mutate cookies.
          }
        },
      },
    },
  );
}
