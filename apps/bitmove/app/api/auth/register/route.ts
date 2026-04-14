// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  isEmailTaken,
  isUsernameTaken,
  createUser,
} from "@woilaa/db-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, email, password } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi!" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter!" },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingEmail = await isEmailTaken(email);
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email ini sudah terdaftar. Coba pakai email lain!" },
        { status: 409 }
      );
    }

    // Cek apakah username sudah terdaftar
    const existingUsername = await isUsernameTaken(username);
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username ini sudah terdaftar. Coba pakai username lain!" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Buat user baru di authdb (auto-grant akses sudah di-handle di fungsi ini)
    const newUser = await createUser({
      email,
      username,
      name,
      passwordHash,
      role: "user",
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Akun berhasil dibuat! Silakan login.",
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          username: newUser.username,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
