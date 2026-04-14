import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { wallets, fiatTransactions, userPortfolios } from "@woilaa/db-mykanz/schema/schema";
import { eq, sum } from "drizzle-orm";

export async function GET() {
  try {
    const user = await requireUser();
    
    // Total Wallet Balance
    const [walletSum] = await db
      .select({ total: sum(wallets.balance) })
      .from(wallets)
      .where(eq(wallets.userId, user.sub));

    const totalCash = Number(walletSum?.total || 0);

    // This month expenses (simplified)
    const expenseTotal = 0; // In a full implementation, filter fiatTransactions by current month & PENGELUARAN

    return NextResponse.json({
      netWorth: totalCash,
      monthlyExpense: expenseTotal,
      monthlyIncome: 0,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
