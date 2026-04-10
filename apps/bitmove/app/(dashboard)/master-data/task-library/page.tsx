import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TaskLibraryClient from "./TaskLibraryClient";

export const metadata = {
  title: "TASK LIBRARY | MASTER DATA | BITMOVE",
};

export default async function TaskLibraryPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all tasks ordered by category, then title
  const tasks = await prisma.task_library.findMany({
    orderBy: [
      { category: "asc" },
      { title: "asc" }
    ]
  });

  return <TaskLibraryClient initialData={tasks} />;
}
