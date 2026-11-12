import { redirect } from 'next/navigation';
import Shell from '@/components/shell';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_USER_ID } from '@/lib/supabase/admin-session';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();

  if (!user || user.id !== ADMIN_USER_ID) {
    redirect('/login');
  }

  return <Shell>{children}</Shell>;
}
