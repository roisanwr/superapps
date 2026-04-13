// app/api/wallets/history/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq, and, or, desc, aliasedTable } from 'drizzle-orm';
import { fiatTransactions, categories, wallets } from '@woilaa/db-mykanz/schema/schema';
import { getCurrentUser } from '@/lib/session';

// GET: Fetch transaction history for a specific wallet
// Usage: GET /api/wallets/history?walletId=<id>
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const walletId = searchParams.get('walletId');

    if (!walletId) {
      return NextResponse.json(
        { error: 'walletId wajib dikirim!' },
        { status: 400 }
      );
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
       categories: { name: categories.name },
       wallets_fiat_transactions_to_wallet_idTowallets: { name: toWallets.name },
       wallets_fiat_transactions_wallet_idTowallets: { name: wallets.name }
    })
    .from(fiatTransactions)
    .leftJoin(categories, eq(fiatTransactions.categoryId, categories.id))
    .leftJoin(wallets, eq(fiatTransactions.walletId, wallets.id))
    .leftJoin(toWallets, eq(fiatTransactions.toWalletId, toWallets.id))
    .where(and(
       eq(fiatTransactions.userId, user.sub),
       or(eq(fiatTransactions.walletId, walletId), eq(fiatTransactions.toWalletId, walletId))
    ))
    .orderBy(desc(fiatTransactions.transactionDate))
    .limit(50);

    const formattedData = transactions.map((tx) => {
      const isSource = tx.wallet_id === walletId;
      const isDestination = tx.to_wallet_id === walletId;

      let typeLabel = '';
      let isIncome = false;

      if (tx.transaction_type === 'PEMASUKAN') {
        typeLabel = 'Pemasukan';
        isIncome = true;
      } else if (tx.transaction_type === 'PENGELUARAN') {
        typeLabel = 'Pengeluaran';
        isIncome = false;
      } else if (tx.transaction_type === 'TRANSFER') {
        if (isSource) {
          typeLabel = `Trf Keluar ke ${tx.wallets_fiat_transactions_to_wallet_idTowallets?.name || 'Dompet Lain'}`;
          isIncome = false;
        } else if (isDestination) {
          typeLabel = `Trf Masuk dari ${tx.wallets_fiat_transactions_wallet_idTowallets?.name || 'Dompet Lain'}`;
          isIncome = true;
        }
      }

      return {
        id: tx.id,
        date: tx.transaction_date,
        amount: Number(tx.amount),
        typeLabel,
        isIncome,
        category: tx.categories?.name || '-',
        description: tx.description || '-',
      };
    });

    return NextResponse.json(
      { success: true, data: formattedData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gagal ambil history wallet:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil riwayat transaksi.' },
      { status: 500 }
    );
  }
}
