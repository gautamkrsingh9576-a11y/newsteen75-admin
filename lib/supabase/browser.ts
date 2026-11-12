'use client';

import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = 'https://vwoqjsjlfxcvsjygxwgp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_hKXsHS1YImdkp6G7IFhslA_AUz-XgU7';

export function createBrowserSupabaseClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
