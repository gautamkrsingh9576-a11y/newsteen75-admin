import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasUrl = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  );
  const hasSecret = Boolean(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  let dbOk = false;
  let errorType: string | null = null;

  try {
    const client = createAdminClient();
    const { error } = await client
      .from('admin_custom_articles')
      .select('id', { head: true, count: 'exact' })
      .limit(1);

    if (error) {
      errorType = error.code || 'query_error';
    } else {
      dbOk = true;
    }
  } catch (error) {
    errorType = error instanceof Error ? error.message : 'unknown_error';
  }

  return NextResponse.json(
    { hasUrl, hasSecret, dbOk, errorType },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
