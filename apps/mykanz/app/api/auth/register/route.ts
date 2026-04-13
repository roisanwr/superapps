// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@woilaa/db-mykanz/schema/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// POST: Register a new user
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Semua kolom wajib diisi!' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUserResult = await db.select().from(users).where(eq(users.email, email));
    const existingUser = existingUserResult[0];

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email ini sudah terdaftar. Coba pakai email lain ya!' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUserResult = await db.insert(users).values({
        name,
        email,
        passwordHash: hashedPassword,
    }).returning();
    const newUser = newUserResult[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Akun berhasil dibuat! Silakan login.',
        data: { id: newUser.id, name: newUser.name, email: newUser.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Gagal register user:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
