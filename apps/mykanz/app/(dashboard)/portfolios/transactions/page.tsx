import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import { assets as assetsSchema, wallets as walletsSchema, assetTransactions, userPortfolios } from '@woilaa/db-mykanz/schema/schema';
import { eq, desc, asc, and, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ArrowRightLeft } from 'lucide-react';
import AddInvestmentModal from '@/components/AddInvestmentModal';
import InvestmentTransactionList from '@/components/InvestmentTransactionList';

export default async function PortfolioTransactionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  const userId = user.sub;

  // Fetch needed data for the modal
  const [assets, wallets, transactionsRaw] = await Promise.all([
    db.select().from(assetsSchema).where(eq(assetsSchema.userId, userId)).orderBy(asc(assetsSchema.name)),
    db.select().from(walletsSchema).where(and(eq(walletsSchema.userId, userId), isNull(walletsSchema.deletedAt))).orderBy(asc(walletsSchema.name)),
    db.select({
      id: assetTransactions.id,
      portfolioId: assetTransactions.portfolioId,
      transactionType: assetTransactions.transactionType,
      walletId: assetTransactions.walletId,
      units: assetTransactions.units,
      pricePerUnit: assetTransactions.pricePerUnit,
      totalAmount: assetTransactions.totalAmount,
      transactionDate: assetTransactions.transactionDate,
      notes: assetTransactions.notes,
      user_portfolios: userPortfolios,
      assets: assetsSchema
    })
    .from(assetTransactions)
    .leftJoin(userPortfolios, eq(assetTransactions.portfolioId, userPortfolios.id))
    .leftJoin(assetsSchema, eq(userPortfolios.assetId, assetsSchema.id))
    .where(eq(assetTransactions.userId, userId))
    .orderBy(desc(assetTransactions.transactionDate))
  ]);

  const serializedTransactions = transactionsRaw.map(row => ({
    id: row.id,
    portfolio_id: row.portfolioId,
    transaction_type: row.transactionType,
    wallet_id: row.walletId,
    units: row.units?.toString() || '0',
    price_per_unit: row.pricePerUnit?.toString() || '0',
    total_amount: row.totalAmount?.toString() || '0',
    transaction_date: row.transactionDate,
    notes: row.notes,
    user_portfolios: row.user_portfolios ? {
      ...row.user_portfolios,
      total_units: row.user_portfolios.totalUnits?.toString(),
      average_buy_price: row.user_portfolios.averageBuyPrice?.toString(),
      assets: row.assets
    } : null
  }));

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-xl">
            <ArrowRightLeft className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Catatan Investasi
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Kelola dan pantau aktivitas pembelian / penjualan aset investasimu.
            </p>
          </div>
        </div>
        <AddInvestmentModal assets={assets} wallets={wallets} />
      </div>

      {serializedTransactions.length > 0 && (
         <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm mt-6">
           <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Riwayat Transaksi</h2>
           <InvestmentTransactionList transactions={serializedTransactions} />
         </div>
      )}

      {serializedTransactions.length === 0 && (
         <InvestmentTransactionList transactions={[]} />
      )}

    </div>
  );
}
