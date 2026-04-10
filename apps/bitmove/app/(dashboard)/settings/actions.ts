"use server"

import { auth, signOut } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const timezone = formData.get("timezone") as string;

  if (!username) return { error: "Codename is required." };

  try {
    await prisma.profiles.update({
      where: { id: session.user.id },
      data: {
        full_name: fullName,
        username,
        timezone,
        updated_at: new Date()
      }
    });

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: "That Codename is already taken by another operative." };
    }
    return { error: "Failed to update profile." };
  }
}

export async function logOutAction() {
  await signOut({ redirectTo: "/login" });
}
