// app/api/export/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { fiatTransactions, assetTransactions, userPortfolios, assets, categories, wallets } from '@woilaa/db-mykanz/schema/schema';
import { eq, desc, aliasedTable } from 'drizzle-orm';

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCsv).join(',');
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') ?? 'transaksi';

    const userId = user.sub;

    if (type === 'investasi') {
      // Export investasi (asset transactions)
      const rows = await db.select({
        transaction_date: assetTransactions.transactionDate,
        transaction_type: assetTransactions.transactionType,
        units: assetTransactions.units,
        price_per_unit: assetTransactions.pricePerUnit,
        total_amount: assetTransactions.totalAmount,
        notes: assetTransactions.notes,
        user_portfolios: {
           assets: { name: assets.name, ticker_symbol: assets.tickerSymbol, asset_type: assets.assetType, currency: assets.currency }
        }
      })
      .from(assetTransactions)
      .leftJoin(userPortfolios, eq(assetTransactions.portfolioId, userPortfolios.id))
      .leftJoin(assets, eq(userPortfolios.assetId, assets.id))
      .where(eq(assetTransactions.userId, userId))
      .orderBy(desc(assetTransactions.transactionDate));

      const headers = ['Tanggal', 'Aset', 'Ticker', 'Tipe Aset', 'Jenis Transaksi', 'Jumlah Unit', 'Harga per Unit', 'Total', 'Mata Uang', 'Catatan'];
      const lines = [
        headers.join(','),
        ...rows.map((r) => rowToCsv([
          r.transaction_date ? new Date(r.transaction_date).toLocaleDateString('id-ID') : '',
          r.user_portfolios.assets.name,
          r.user_portfolios.assets.ticker_symbol,
          r.user_portfolios.assets.asset_type,
          r.transaction_type,
          r.units.toString(),
          r.price_per_unit.toString(),
          r.total_amount.toString(),
          r.user_portfolios.assets.currency,
          r.notes,
        ])),
      ];

      const csv = lines.join('\n');
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="mykanz_investasi_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Default: export fiat transactions
    const toWallets = aliasedTable(wallets, 'toWallets');
    const rows = await db.select({
      transaction_date: fiatTransactions.transactionDate,
      transaction_type: fiatTransactions.transactionType,
      amount: fiatTransactions.amount,
      description: fiatTransactions.description,
      categories: { name: categories.name },
      wallets_fiat_transactions_wallet_idTowallets: { name: wallets.name, currency: wallets.currency },
      wallets_fiat_transactions_to_wallet_idTowallets: { name: toWallets.name },
    })
    .from(fiatTransactions)
    .leftJoin(categories, eq(fiatTransactions.categoryId, categories.id))
    .leftJoin(wallets, eq(fiatTransactions.walletId, wallets.id))
    .leftJoin(toWallets, eq(fiatTransactions.toWalletId, toWallets.id))
    .where(eq(fiatTransactions.userId, userId))
    .orderBy(desc(fiatTransactions.transactionDate));

    const headers = ['Tanggal', 'Jenis', 'Dompet', 'Ke Dompet', 'Kategori', 'Jumlah', 'Mata Uang', 'Deskripsi'];
    const lines = [
      headers.join(','),
      ...rows.map((r) => rowToCsv([
        r.transaction_date ? new Date(r.transaction_date).toLocaleDateString('id-ID') : '',
        r.transaction_type,
        r.wallets_fiat_transactions_wallet_idTowallets?.name,
        r.wallets_fiat_transactions_to_wallet_idTowallets?.name,
        r.categories?.name,
        r.amount.toString(),
        r.wallets_fiat_transactions_wallet_idTowallets?.currency,
        r.description,
      ])),
    ];

    const csv = lines.join('\n');
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="mykanz_transaksi_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Gagal export:', error);
    return NextResponse.json({ error: 'Gagal mengekspor data.' }, { status: 500 });
  }
}
