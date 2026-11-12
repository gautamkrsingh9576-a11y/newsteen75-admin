'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_USER_ID } from '@/lib/supabase/admin-session';

export async function signInAdmin(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }

  const client = await createClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  if (data.user.id !== ADMIN_USER_ID) {
    await client.auth.signOut();
    return { ok: false, error: 'This account is not authorized for NewsTeen75 Admin.' };
  }

  redirect('/');
}

export async function signOutAdmin() {
  const client = await createClient();
  await client.auth.signOut();
  redirect('/login');
}
