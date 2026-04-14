"use server";

import { requireUser } from "@/lib/session";
import { createAndActivateProgram, updateAndActivateProgram, activateProgram, deleteProgram, type TierEnum } from "@/lib/services/programService";
import { revalidatePath } from "next/cache";

export interface SlotInput {
  exerciseId: string;
  weekNumber: number;
  dayOfWeek: number;
  targetTier: TierEnum;
  notes?: string;
}

export async function saveAndActivateProgram(
  title: string,
  totalWeeks: number,
  slots: SlotInput[],
  programId?: string
) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  if (!title.trim()) throw new Error("Judul program tidak boleh kosong");
  if (slots.length === 0) throw new Error("Program harus memiliki minimal 1 latihan");

  if (programId) {
    await updateAndActivateProgram(programId, user.sub, {
      title: title.trim(),
      totalWeeks,
      slots,
    });
  } else {
    await createAndActivateProgram(user.sub, {
      title: title.trim(),
      totalWeeks,
      slots,
    });
  }

  revalidatePath("/training");
  revalidatePath("/training/builder");
}

export async function removeProgramAction(programId: string) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  await deleteProgram(programId, user.sub);
  revalidatePath("/training");
  revalidatePath("/training/builder");
}

export async function setActiveProgramAction(programId: string) {
  const user = await requireUser();
  if (!user?.sub) throw new Error("Unauthorized");

  await activateProgram(programId, user.sub);
  revalidatePath("/training");
  revalidatePath("/training/builder");
}
