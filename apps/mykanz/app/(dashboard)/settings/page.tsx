// app/(dashboard)/settings/page.tsx
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import { users } from '@woilaa/db-auth';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import SettingsPage from '@/components/SettingsPage';

export const metadata = {
  title: 'Pengaturan — MyKanz',
  description: 'Kelola profil, keamanan, dan data akun MyKanz kamu.',
};

export default async function Settings() {
  const userSession = await getCurrentUser();
  if (!userSession) redirect('/login');

  const userResult = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    created_at: users.createdAt,
  }).from(users).where(eq(users.id, userSession.sub));

  const user = userResult[0];
  if (!user) redirect('/login');

  return (
    <SettingsPage
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at?.toISOString() ?? null,
      }}
    />
  );
}
