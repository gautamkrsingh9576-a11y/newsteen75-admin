import { createClient } from '@/lib/supabase/server';

export const ADMIN_USER_ID = '61eea936-70cc-430b-8417-7c0ce3ae59f9';

export async function createAdminSessionClient() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();

  if (error || !user || user.id !== ADMIN_USER_ID) {
    throw new Error('Unauthorized admin session.');
  }

  return client;
}
