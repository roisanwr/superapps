// app/api/users/me/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@woilaa/db-mykanz/schema/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import bcrypt from 'bcryptjs';

// GET: Get the currently logged-in user's profile
export async function GET() {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        created_at: users.createdAt,
    }).from(users).where(eq(users.id, userSession.sub));
    const user = userResult[0];

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update the currently logged-in user's profile
export async function PUT(req: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama tidak boleh kosong!' },
        { status: 400 }
      );
    }

    const updatedUserResult = await db.update(users).set({ name: name.trim() })
    .where(eq(users.id, userSession.sub))
    .returning({
        id: users.id,
        name: users.name,
        email: users.email,
    });
    const updatedUser = updatedUserResult[0];

    return NextResponse.json(
      { success: true, message: 'Profil berhasil diupdate!', data: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gagal update user:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupdate profil.' },
      { status: 500 }
    );
  }
}

// DELETE: Permanently delete the currently logged-in user's account
export async function DELETE(req: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Konfirmasi password wajib diisi.' }, { status: 400 });
    }

    const userResult = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userSession.sub));
    const user = userResult[0];

    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash as string);
    if (!isMatch) {
      return NextResponse.json({ error: 'Password tidak sesuai.' }, { status: 400 });
    }

    // Cascade delete — all related data (wallets, transactions, etc.) will be removed
    await db.delete(users).where(eq(users.id, userSession.sub));

    return NextResponse.json({ success: true, message: 'Akun berhasil dihapus.' });
  } catch (error) {
    console.error('Gagal hapus akun:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
