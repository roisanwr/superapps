// app/(dashboard)/settings/page.tsx
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import SettingsPage from '@/components/SettingsPage';

export const metadata = {
  title: 'Pengaturan — MyKanz',
  description: 'Kelola profil, keamanan, dan data akun MyKanz kamu.',
};

export default async function Settings() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <SettingsPage
      user={{
        id: user.sub,
        name: user.name,
        email: user.email,
        created_at: null,
      }}
    />
  );
}
