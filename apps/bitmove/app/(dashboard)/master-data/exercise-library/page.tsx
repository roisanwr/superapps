import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ExerciseLibraryClient from "./ExerciseLibraryClient";

export const metadata = {
  title: "EXERCISE LIBRARY | MASTER DATA | BITMOVE",
};

export default async function ExerciseLibraryPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all exercises
  const exercises = await prisma.exercise_library.findMany({
    orderBy: [
      { target_muscle: "asc" },
      { name: "asc" }
    ]
  });

  return <ExerciseLibraryClient initialData={exercises} userId={session.user.id} />;
}
