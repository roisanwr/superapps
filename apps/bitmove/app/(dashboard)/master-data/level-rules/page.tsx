import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { levelRules } from "@woilaa/db-bitmove";
import { asc } from "drizzle-orm";
import LevelRulesClient from "./LevelRulesClient";

export const metadata = {
  title: "LEVEL RULES | MASTER DATA | BITMOVE",
};

export default async function LevelRulesPage() {
  const user = await requireUser().catch(() => null);
  
  if (!user?.sub) {
    redirect("/login");
  }

  const rules = await db.query.levelRules.findMany({
    orderBy: [asc(levelRules.level)]
  });

  return <LevelRulesClient initialData={rules as any} />;
}
