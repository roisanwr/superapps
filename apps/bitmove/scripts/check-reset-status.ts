// Script untuk mengecek status seluruh sistem reset harian
// Jalankan: npx tsx scripts/check-reset-status.ts

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔍 === BITMOVE DAILY RESET DIAGNOSTIC ===\n");

  // 1. Cek pg_cron extension
  console.log("1️⃣  Checking pg_cron extension...");
  try {
    const extensions: any[] = await prisma.$queryRawUnsafe(
      `SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_cron'`
    );
    if (extensions.length > 0) {
      console.log(`   ✅ pg_cron is ENABLED (v${extensions[0].extversion})`);
    } else {
      console.log("   ❌ pg_cron is NOT ENABLED! Go to Supabase → Database → Extensions → Enable pg_cron");
      return;
    }
  } catch (e: any) {
    console.log(`   ❌ Error checking pg_cron: ${e.message}`);
    return;
  }

  // 2. Cek cron jobs
  console.log("\n2️⃣  Checking registered cron jobs...");
  try {
    const jobs: any[] = await prisma.$queryRawUnsafe(
      `SELECT jobid, jobname, schedule, command FROM cron.job`
    );
    if (jobs.length === 0) {
      console.log("   ❌ No cron jobs registered! Run: npx tsx scripts/deploy-cron.ts");
    } else {
      jobs.forEach((j) => {
        console.log(`   📋 Job: "${j.jobname}" | Schedule: "${j.schedule}" | Command: "${j.command}"`);
      });
      const hasReset = jobs.some((j) => j.jobname === "hourly-smart-global-reset");
      if (hasReset) {
        console.log("   ✅ hourly-smart-global-reset is registered!");
      } else {
        console.log("   ❌ hourly-smart-global-reset NOT FOUND! Run: npx tsx scripts/deploy-cron.ts");
      }
    }
  } catch (e: any) {
    console.log(`   ❌ Error checking cron jobs: ${e.message}`);
  }

  // 3. Cek recent cron runs
  console.log("\n3️⃣  Checking recent cron execution history...");
  try {
    const runs: any[] = await prisma.$queryRawUnsafe(
      `SELECT runid, job_id, status, start_time, end_time, return_message 
       FROM cron.job_run_details 
       ORDER BY start_time DESC LIMIT 5`
    );
    if (runs.length === 0) {
      console.log("   ⚠️  No cron execution history found (cron might have never run)");
    } else {
      runs.forEach((r) => {
        const status = r.status === "succeeded" ? "✅" : "❌";
        console.log(`   ${status} Run #${r.runid} | Status: ${r.status} | Time: ${r.start_time} | Msg: ${r.return_message || "OK"}`);
      });
    }
  } catch (e: any) {
    console.log(`   ⚠️  Could not check run history: ${e.message}`);
  }

  // 4. Cek handle_smart_global_reset function exists
  console.log("\n4️⃣  Checking if handle_smart_global_reset() function exists...");
  try {
    const funcs: any[] = await prisma.$queryRawUnsafe(
      `SELECT routine_name FROM information_schema.routines 
       WHERE routine_name = 'handle_smart_global_reset' AND routine_schema = 'public'`
    );
    if (funcs.length > 0) {
      console.log("   ✅ Function handle_smart_global_reset() EXISTS");
    } else {
      console.log("   ❌ Function handle_smart_global_reset() NOT FOUND! Deploy db.sql to Supabase.");
    }
  } catch (e: any) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  // 5. Cek profile reset dates
  console.log("\n5️⃣  Checking user profiles reset status...");
  try {
    const profiles: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, username, timezone, last_reset_date, last_weekly_reset, last_active_date,
              (now() AT TIME ZONE coalesce(timezone, 'Asia/Jakarta'))::date as local_today,
              CASE WHEN (now() AT TIME ZONE coalesce(timezone, 'Asia/Jakarta'))::date > last_reset_date 
                   THEN 'NEEDS RESET' ELSE 'UP TO DATE' END as status
       FROM profiles`
    );
    if (profiles.length === 0) {
      console.log("   ⚠️  No profiles found");
    } else {
      profiles.forEach((p) => {
        const icon = p.status === "NEEDS RESET" ? "🔴" : "🟢";
        console.log(`   ${icon} User: ${p.username || "unnamed"} | TZ: ${p.timezone} | Last Reset: ${p.last_reset_date} | Local Today: ${p.local_today} | Status: ${p.status}`);
      });
    }
  } catch (e: any) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  // 6. Cek daily tasks status
  console.log("\n6️⃣  Checking daily tasks status...");
  try {
    const taskStats: any[] = await prisma.$queryRawUnsafe(
      `SELECT p.username, 
              COUNT(t.id) as total_daily_tasks,
              COUNT(CASE WHEN t.is_completed THEN 1 END) as completed,
              COUNT(CASE WHEN NOT t.is_completed THEN 1 END) as pending
       FROM tasks t 
       JOIN profiles p ON p.id = t.user_id
       WHERE t.frequency = 'Daily' 
       GROUP BY p.username`
    );
    if (taskStats.length === 0) {
      console.log("   ⚠️  No daily tasks found for any user");
    } else {
      taskStats.forEach((s) => {
        console.log(`   📊 User: ${s.username} | Total: ${s.total_daily_tasks} | ✅ Done: ${s.completed} | ⏳ Pending: ${s.pending}`);
      });
    }
  } catch (e: any) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  console.log("\n🏁 === DIAGNOSTIC COMPLETE ===");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
