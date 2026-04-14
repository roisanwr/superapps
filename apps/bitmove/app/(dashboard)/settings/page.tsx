import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { profiles } from "@woilaa/db-bitmove";
import { eq } from "drizzle-orm";
import { SettingsClient } from "./SettingsClient";

export const metadata = {
  title: "SYSTEM SETTINGS | BITMOVE",
};

export default async function SettingsPage() {
  const user = await requireUser().catch(() => null);
  
  if (!user?.sub) {
    return <div>Unauthorized Access.</div>;
  }

  // Fetch the user's current profile settings
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.sub)
  });

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-8 border-b border-outline-variant/30 pb-6">
        <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter text-white">
          SYSTEM SETTINGS
        </h1>
        <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mt-2 border-l-2 border-primary pl-3">
          CONFIGURE OPERATIVE IDENTITY AND PREFERENCES.
        </p>
      </div>

      <SettingsClient profile={profile} />
    </div>
  );
}
