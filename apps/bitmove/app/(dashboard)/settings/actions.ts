"use server"

import { requireUser, deleteSession } from "@/lib/session"
import { db } from "@/lib/db"
import { profiles } from "@woilaa/db-bitmove"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const timezone = formData.get("timezone") as string;

  if (!username) return { error: "Codename is required." };

  try {
    await db.update(profiles).set({
      fullName,
      username,
      timezone,
      updatedAt: new Date()
    }).where(eq(profiles.id, user.sub));

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    // Basic unique constraint check can be refined based on driver
    if (error?.message?.includes("unique") || error?.code === 'P2002' || error?.code === '23505') {
      return { error: "That Codename is already taken by another operative." };
    }
    return { error: "Failed to update profile." };
  }
}

export async function logOutAction() {
  deleteSession();
  redirect("/login");
}
