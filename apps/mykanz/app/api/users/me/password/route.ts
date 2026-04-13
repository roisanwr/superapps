// app/api/users/me/password/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@woilaa/db-mykanz/schema/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Semua field wajib diisi.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password baru minimal 8 karakter.' },
        { status: 400 }
      );
    }

    const userResult = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userSession.sub));
    const user = userResult[0];

    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash as string);
    if (!isMatch) {
      return NextResponse.json({ error: 'Password lama tidak sesuai.' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userSession.sub));

    return NextResponse.json({ success: true, message: 'Password berhasil diubah!' });
  } catch (error) {
    console.error('Gagal ganti password:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
