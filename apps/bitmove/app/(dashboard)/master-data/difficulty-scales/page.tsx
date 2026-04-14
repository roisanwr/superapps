import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { difficultyScales } from "@woilaa/db-bitmove";
import { asc } from "drizzle-orm";
import DifficultyScalesClient from "./DifficultyScalesClient";

export const metadata = {
  title: "DIFFICULTY SCALES | MASTER DATA | BITMOVE",
};

export default async function DifficultyScalesPage() {
  const user = await requireUser().catch(() => null);
  
  if (!user?.sub) {
    redirect("/login");
  }

  const scales = await db.query.difficultyScales.findMany({
    orderBy: [asc(difficultyScales.scaleType), asc(difficultyScales.tier)]
  });

  return <DifficultyScalesClient initialData={scales as any} />;
}
