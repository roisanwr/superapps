// app/api/goals/funds/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { goals, fiatTransactions, categories } from '@woilaa/db-mykanz/schema/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

// POST: Add funds to a goal (tabungan)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { goal_id, amount, wallet_id } = body;

    if (!goal_id || !amount || !wallet_id) {
      return NextResponse.json(
        { error: 'Nominal tabungan dan Dompet sumber wajib diisi!' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(String(amount));

    if (parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Nominal tabungan harus lebih dari 0!' },
        { status: 400 }
      );
    }

    const goalResult = await db.select().from(goals).where(and(eq(goals.id, goal_id), eq(goals.userId, user.sub)));
    const goal = goalResult[0];

    if (!goal) {
      return NextResponse.json(
        { error: 'Target Impian tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (goal.asset_id) {
      return NextResponse.json(
        {
          error:
            'Target berbasis aset hanya bisa diupdate otomatis dari menu Investasi!',
        },
        { status: 400 }
      );
    }

    const getOrCreateCategory = async (
      catName: string,
      catType: any,
      txCtx?: any
    ) => {
      const q = (txCtx || db);
      let catRes = await q.select().from(categories).where(and(eq(categories.userId, user.sub), eq(categories.name, catName), eq(categories.type, catType)));
      if (catRes.length === 0) {
        catRes = await q.insert(categories).values({ userId: user.sub, name: catName, type: catType }).returning();
      }
      return catRes[0].id;
    };

    await db.transaction(async (tx) => {
      const catId = await getOrCreateCategory('Tabungan Impian', 'PENGELUARAN', tx);

      await tx.insert(fiatTransactions).values({
          userId: user.sub,
          walletId: wallet_id,
          categoryId: catId,
          transactionType: 'PENGELUARAN',
          amount: parsedAmount,
          description: `Nabung untuk: ${goal.name}`,
      });

      const newAmount = Number(goal.currentAmount || 0) + parsedAmount;

      await tx.update(goals).set({ currentAmount: newAmount, updatedAt: new Date() }).where(eq(goals.id, goal_id));
    });

    return NextResponse.json(
      { success: true, message: 'Tabungan berhasil ditambahkan!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gagal menabung:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat menabung.' },
      { status: 500 }
    );
  }
}
