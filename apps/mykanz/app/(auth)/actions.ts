"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function loginAction(prevState: any, formData: FormData) {
  const identifier = formData.get("identifier") as string;
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Username/Email dan password wajib diisi." };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? "Terjadi kesalahan sistem." };
    }
  } catch (e) {
    return { error: "Gagal terhubung ke server." };
  }

  redirect("/");
}

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !username || !password || !name) {
    return { error: "Semua kolom wajib diisi." };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/api/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, name }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? "Gagal membuat akun." };
    }
  } catch (e) {
    return { error: "Gagal terhubung ke server." };
  }

  redirect("/login");
}
