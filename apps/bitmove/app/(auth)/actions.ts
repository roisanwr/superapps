"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and Passcode are required." };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? "System malfunction." };
    }

    // Cookie sudah di-set oleh API route via Set-Cookie header.
    // Redirect ke dashboard.
  } catch {
    return { error: "System malfunction. Try again." };
  }

  redirect("/");
}

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const name = formData.get("fullName") as string;

  if (!email || !username || !password) {
    return { error: "All fields are required." };
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
      return { error: data.error ?? "Failed to initialize operative profile." };
    }
  } catch {
    return { error: "Failed to initialize operative profile." };
  }

  redirect("/login");
}
