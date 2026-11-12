import { redirect } from 'next/navigation';
import LoginForm from '@/components/login-form';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_USER_ID } from '@/lib/supabase/admin-session';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();

  if (user?.id === ADMIN_USER_ID) {
    redirect('/');
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-mark">N<span>75</span></div>
        <div className="eyebrow">PRIVATE WORKSPACE</div>
        <h1>Welcome back.</h1>
        <p>Sign in to manage your NewsTeen75 dashboard.</p>
        <LoginForm />
      </section>
    </main>
  );
}
