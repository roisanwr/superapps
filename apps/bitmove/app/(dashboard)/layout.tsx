import { DashboardShell } from "@/components/layout/DashboardShell";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let streak = 0;
  let xp = 0;
  let points = 0;
  let level = 1;
  let username = "Operative";

  if (session?.user?.id) {
    const profile = await prisma.profiles.findUnique({
      where: { id: session.user.id },
      select: { 
        streak_current: true, 
        current_xp: true, 
        current_points: true,
        level: true,
        username: true,
      }
    });
    streak = profile?.streak_current || 0;
    xp = profile?.current_xp || 0;
    points = profile?.current_points || 0;
    level = profile?.level || 1;
    username = profile?.username || session.user.name || "Operative";
  }

  return (
    <DashboardShell streak={streak} xp={xp} points={points} level={level} username={username}>
      {children}
    </DashboardShell>
  );
}

