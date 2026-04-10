import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { QuestList } from "./QuestList";
import { CreateQuestForm } from "./CreateQuestForm";

export const metadata = {
  title: "DIRECTIVES | BITMOVE",
};

export default async function QuestsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Unauthorized Access.</div>;
  }

  // Fetch alive tasks for the user
  const tasks = await prisma.tasks.findMany({
    where: { user_id: session.user.id },
    orderBy: [
      { is_completed: "asc" },
      { created_at: "desc" }
    ]
  });

  const taskLibrary = await prisma.task_library.findMany({
    orderBy: { category: "asc" }
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

      <QuestList initialTasks={tasks} />
      <CreateQuestForm library={taskLibrary} />
    </div>
  );
}
