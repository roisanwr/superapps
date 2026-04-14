import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exerciseLibrary } from "@woilaa/db-bitmove";
import { asc } from "drizzle-orm";
import ExerciseLibraryClient from "./ExerciseLibraryClient";

export const metadata = {
  title: "EXERCISE LIBRARY | MASTER DATA | BITMOVE",
};

export default async function ExerciseLibraryPage() {
  const user = await requireUser().catch(() => null);
  
  if (!user?.sub) {
    redirect("/login");
  }

  const exercises = await db.query.exerciseLibrary.findMany({
    orderBy: [asc(exerciseLibrary.name)]
  });

  return <ExerciseLibraryClient initialData={exercises as any} userId={user.sub} />;
}
