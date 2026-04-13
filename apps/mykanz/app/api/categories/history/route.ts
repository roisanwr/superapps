// app/api/categories/history/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories, fiatTransactions, wallets } from '@woilaa/db-mykanz/schema/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

// GET: Fetch transaction history for a specific category
// Usage: GET /api/categories/history?categoryId=<id>&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate = searchParams.get('endDate') ?? undefined;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId wajib dikirim!' },
        { status: 400 }
      );
    }

    // Validate ownership
    const categoryResult = await db.select().from(categories).where(and(eq(categories.id, categoryId), eq(categories.userId, user.sub)));
    const category = categoryResult[0];

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan!' },
        { status: 404 }
      );
    }

    const conditions = [
      eq(fiatTransactions.userId, user.sub),
      eq(fiatTransactions.categoryId, categoryId)
    ];

    if (startDate) {
      conditions.push(gte(fiatTransactions.transactionDate, new Date(`${startDate}T00:00:00.000Z`)));
    }
    if (endDate) {
      conditions.push(lte(fiatTransactions.transactionDate, new Date(`${endDate}T23:59:59.999Z`)));
    }

    const transactionsRaw = await db.select({
        id: fiatTransactions.id,
        transaction_date: fiatTransactions.transactionDate,
        amount: fiatTransactions.amount,
        transaction_type: fiatTransactions.transactionType,
        description: fiatTransactions.description,
        wallets_fiat_transactions_wallet_idTowallets: { name: wallets.name, currency: wallets.currency },
    })
    .from(fiatTransactions)
    .leftJoin(wallets, eq(fiatTransactions.walletId, wallets.id))
    .where(and(...conditions))
    .orderBy(desc(fiatTransactions.transactionDate));
    
    // Map decimals to numbers for JSON serialization
    const transactions = transactionsRaw.map((tx: any) => ({
      ...tx,
      amount: Number(tx.amount)
    }));

    return NextResponse.json(
      {
        success: true,
        data: transactions,
        categoryName: category.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gagal fetch histori kategori:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem.' },
      { status: 500 }
    );
  }
}
