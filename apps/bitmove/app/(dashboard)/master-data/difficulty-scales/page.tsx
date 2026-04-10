import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DifficultyScalesClient from "./DifficultyScalesClient";

export const metadata = {
  title: "DIFFICULTY SCALES | MASTER DATA | BITMOVE",
};

export default async function DifficultyScalesPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all difficulty scales
  const scales = await prisma.difficulty_scales.findMany({
    orderBy: [
      { scale_type: "asc" },
      { tier: "asc" }
    ]
  });

  return <DifficultyScalesClient initialData={scales} />;
}
