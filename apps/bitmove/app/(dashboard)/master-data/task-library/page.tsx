import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { taskLibrary } from "@woilaa/db-bitmove";
import { asc } from "drizzle-orm";
import TaskLibraryClient from "./TaskLibraryClient";

export const metadata = {
  title: "TASK LIBRARY | MASTER DATA | BITMOVE",
};

export default async function TaskLibraryPage() {
  const user = await requireUser().catch(() => null);
  
  if (!user?.sub) {
    redirect("/login");
  }

  // Fetch all tasks ordered by category, then title
  const tasks = await db.query.taskLibrary.findMany({
    orderBy: [asc(taskLibrary.category), asc(taskLibrary.title)]
  });

  return <TaskLibraryClient initialData={tasks as any} />;
}
