import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import LevelRulesClient from "./LevelRulesClient";

export const metadata = {
  title: "LEVEL RULES | MASTER DATA | BITMOVE",
};

export default async function LevelRulesPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const levelRules = await prisma.level_rules.findMany({
    orderBy: { level: "asc" }
  });

  return <LevelRulesClient initialData={levelRules} />;
}
