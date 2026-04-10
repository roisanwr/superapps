"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Operative not found." };
        default:
          return { error: "System malfunction." };
      }
    }
    throw error;
  }
}

export async function registerAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!username || !password) {
    return { error: "Codename and Passcode are required." };
  }

  // Check existing user
  const existingUser = await prisma.profiles.findUnique({
    where: { username },
  });

  if (existingUser) {
    return { error: "Codename already in use." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.profiles.create({
      data: {
        username,
        password_hash: hashedPassword,
        full_name: fullName,
      },
    });
  } catch (error) {
    return { error: "Failed to initialize operative profile." };
  }

  redirect("/login");
}
