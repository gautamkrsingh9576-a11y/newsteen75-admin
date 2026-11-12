import { redirect } from 'next/navigation';
import { signInAdmin } from '@/app/auth-actions';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_USER_ID } from '@/lib/supabase/admin-session';

export const dynamic = 'force-dynamic';

const messages: Record<string, string> = {
  missing: 'Email and password are required.',
  invalid: 'Email or password is incorrect.',
  unauthorized: 'This account is not authorized for NewsTeen75 Admin.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();

  if (user?.id === ADMIN_USER_ID) {
    redirect('/');
  }

  const params = await searchParams;
  const message = params.error ? messages[params.error] : null;

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-mark">N<span>75</span></div>
        <div className="eyebrow">PRIVATE WORKSPACE</div>
        <h1>Welcome back.</h1>
        <p>Sign in to manage your NewsTeen75 dashboard.</p>

        {message && <div className="login-error">{message}</div>}

        <form action={signInAdmin} className="login-form">
          <label>
            <span>Email address</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit">Sign in to dashboard</button>
        </form>
      </section>
    </main>
  );
}
