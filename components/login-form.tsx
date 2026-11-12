'use client';

import { FormEvent, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

const ADMIN_USER_ID = '61eea936-70cc-430b-8417-7c0ce3ae59f9';

export default function LoginForm() {
  const [email, setEmail] = useState('gautamkrsingh9576@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const client = createBrowserSupabaseClient();
    const { data, error: signInError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setError('Email or password is incorrect.');
      setLoading(false);
      return;
    }

    if (data.user.id !== ADMIN_USER_ID) {
      await client.auth.signOut();
      setError('This account is not authorized for NewsTeen75 Admin.');
      setLoading(false);
      return;
    }

    window.location.assign('/');
  }

  return (
    <form onSubmit={submit} className="login-form">
      {error && <div className="login-error">{error}</div>}
      <label>
        <span>Email address</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      <label>
        <span>Password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in to dashboard'}
      </button>
    </form>
  );
}
