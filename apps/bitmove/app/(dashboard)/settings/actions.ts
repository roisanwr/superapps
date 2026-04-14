"use server"

import { requireUser } from "@/lib/session"
import { db } from "@/lib/db"
import { profiles } from "@woilaa/db-bitmove"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  const timezone = formData.get("timezone") as string;

  try {
    await db.update(profiles).set({
      timezone,
      updatedAt: new Date()
    }).where(eq(profiles.userId, user.sub));

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: "Failed to update profile timezone." };
  }
}

export async function logOutAction() {
  // Use Hub logout API for single sign out
  redirect("http://localhost:3000/api/auth/logout");
}
