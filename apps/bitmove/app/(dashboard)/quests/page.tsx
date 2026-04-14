import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { tasks, taskLibrary } from "@woilaa/db-bitmove";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { QuestList } from "./QuestList";
import { CreateQuestForm } from "./CreateQuestForm";

export const metadata = {
  title: "DIRECTIVES | BITMOVE",
};

export default async function QuestsPage() {
  const user = await requireUser().catch(() => null);
  
  if (!user?.sub) {
    return redirect("/login");
  }

  // Fetch alive tasks for the user
  const userTasks = await db.query.tasks.findMany({
    where: eq(tasks.userId, user.sub),
    orderBy: (t, { asc, desc }) => [
      asc(t.isCompleted),
      desc(t.createdAt) // Using createdAt instead of created_at
    ]
  });

  const library = await db.query.taskLibrary.findMany({
    orderBy: (tl, { asc }) => [asc(tl.category)]
  });

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-white">
          ACTIVE DIRECTIVES
        </h1>
        <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-2 border-l-2 border-primary pl-3">
          COMPLETE ASSIGNED TASKS TO GATHER XP AND AVOID PENALTIES.
        </p>
      </div>

      <QuestList initialTasks={userTasks as any} />
      <CreateQuestForm library={library} />
    </div>
  );
}
