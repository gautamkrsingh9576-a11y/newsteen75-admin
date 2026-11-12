import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function configured() { return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.ADMIN_EMAIL_ALLOWLIST); }
export async function createClient() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => jar.getAll(), setAll(values: {name:string;value:string;options:CookieOptions}[]) { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* Server components cannot write cookies; middleware refreshes them. */ } } } });
}
export function permitted(email?: string) { return Boolean(email && (process.env.ADMIN_EMAIL_ALLOWLIST || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase())); }
