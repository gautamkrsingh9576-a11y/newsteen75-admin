'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_USER_ID } from '@/lib/supabase/admin-session';

export async function signInAdmin(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/login?error=missing');
  }

  const client = await createClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect('/login?error=invalid');
  }

  if (data.user.id !== ADMIN_USER_ID) {
    await client.auth.signOut();
    redirect('/login?error=unauthorized');
  }

  redirect('/');
}

export async function signOutAdmin() {
  const client = await createClient();
  await client.auth.signOut();
  redirect('/login');
}
