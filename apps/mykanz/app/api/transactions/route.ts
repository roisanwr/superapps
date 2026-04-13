// app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fiatTransactions, categories, wallets } from '@woilaa/db-mykanz/schema/schema';
import { eq, or, desc, and, aliasedTable } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

// GET: Fetch transactions with optional filters
// Usage: GET /api/transactions?type=SEMUA&walletId=<id>
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type');
    const filterWalletId = searchParams.get('walletId');

    const conditions = [eq(fiatTransactions.userId, user.sub)];

    if (filterType && filterType !== 'SEMUA') {
      conditions.push(eq(fiatTransactions.transactionType, filterType as any));
    }

    if (filterWalletId) {
      conditions.push(or(eq(fiatTransactions.walletId, filterWalletId), eq(fiatTransactions.toWalletId, filterWalletId)));
    }

    const toWallets = aliasedTable(wallets, 'to_wallets');
    
    const transactions = await db.select({
      id: fiatTransactions.id,
      transaction_date: fiatTransactions.transactionDate,
      amount: fiatTransactions.amount,
      description: fiatTransactions.description,
      transaction_type: fiatTransactions.transactionType,
      wallet_id: fiatTransactions.walletId,
      to_wallet_id: fiatTransactions.toWalletId,
      categories: { name: categories.name, type: categories.type },
      wallets_fiat_transactions_to_wallet_idTowallets: { name: toWallets.name, currency: toWallets.currency },
      wallets_fiat_transactions_wallet_idTowallets: { name: wallets.name, currency: wallets.currency }
    })
    .from(fiatTransactions)
    .leftJoin(categories, eq(fiatTransactions.categoryId, categories.id))
    .leftJoin(wallets, eq(fiatTransactions.walletId, wallets.id))
    .leftJoin(toWallets, eq(fiatTransactions.toWalletId, toWallets.id))
    .where(and(...conditions))
    .orderBy(desc(fiatTransactions.transactionDate))
    .limit(100);

    return NextResponse.json({ success: true, data: transactions }, { status: 200 });
  } catch (error) {
    console.error('Gagal fetch transaksi:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new transaction
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      transaction_type,
      wallet_id,
      amount,
      description = null,
      transaction_date,
      category_id,
      to_wallet_id,
      admin_fee = 0,
    } = body;

    if (!transaction_type || !wallet_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Data tidak lengkap atau jumlah tidak valid!' },
        { status: 400 }
      );
    }

    const txDate = transaction_date
      ? new Date(`${transaction_date}T00:00:00.000Z`)
      : undefined;

    const payload: any = {
      userId: user.sub,
      transactionType: transaction_type,
      walletId: wallet_id,
      amount,
      description,
      ...(txDate && { transactionDate: txDate }),
    };

    if (transaction_type === 'TRANSFER') {
      if (!to_wallet_id || wallet_id === to_wallet_id) {
        return NextResponse.json(
          { error: 'Dompet tujuan tidak valid!' },
          { status: 400 }
        );
      }

      payload.toWalletId = to_wallet_id;

      await db.transaction(async (tx) => {
        await tx.insert(fiatTransactions).values(payload);

        if (admin_fee > 0) {
          let adminCat = await tx.select().from(categories).where(and(
             eq(categories.userId, user.sub),
             eq(categories.name, 'Biaya Admin'),
             eq(categories.type, 'PENGELUARAN')
          ));
  
          let catId = adminCat[0]?.id;
  
          if (!adminCat || adminCat.length === 0) {
            const newCat = await tx.insert(categories).values({
                userId: user.sub,
                name: 'Biaya Admin',
                type: 'PENGELUARAN',
            }).returning();
            catId = newCat[0].id;
          }
  
          await tx.insert(fiatTransactions).values({
                userId: user.sub,
                transactionType: 'PENGELUARAN',
                walletId: wallet_id,
                categoryId: catId,
                amount: admin_fee,
                description: `Biaya Admin Transfer${description ? ' - ' + description : ''}`,
                ...(txDate && { transactionDate: txDate }),
          });
        }
      });
    } else {
      if (category_id) payload.categoryId = category_id;
      await db.insert(fiatTransactions).values(payload);
    }

    return NextResponse.json(
      { success: true, message: 'Transaksi berhasil dicatat!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Gagal membuat transaksi:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a transaction
// Usage: DELETE /api/transactions?id=<id>
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID Transaksi wajib dikirim!' },
        { status: 400 }
      );
    }

    await db.delete(fiatTransactions).where(and(eq(fiatTransactions.id, id), eq(fiatTransactions.userId, user.sub)));

    return NextResponse.json(
      { success: true, message: 'Transaksi berhasil dihapus!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gagal menghapus transaksi:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus transaksi.' },
      { status: 500 }
    );
  }
}
