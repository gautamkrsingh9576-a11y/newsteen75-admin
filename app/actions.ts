'use server';
import { redirect } from 'next/navigation';
import { configured, createClient, permitted } from '@/lib/supabase/server';
export async function login(_: string, form: FormData): Promise<string> {
 if (!configured()) return 'Configuration required. Contact the dashboard owner.';
 const email=String(form.get('email')||'').trim().toLowerCase(), password=String(form.get('password')||'');
 if (!permitted(email)) return 'Unable to sign in. Check your credentials or access.';
 const client=await createClient(); const {data,error}=await client.auth.signInWithPassword({email,password});
 if(error || !data.user?.email_confirmed_at || !permitted(data.user?.email)) { await client.auth.signOut(); return 'Unable to sign in. Check your credentials or access.'; }
 redirect('/');
}
export async function logout() { if(configured()) { const client=await createClient(); await client.auth.signOut(); } redirect('/login'); }
