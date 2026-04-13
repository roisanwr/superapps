import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { assets as assetsTable, wallets as walletsTable, assetTransactions, userPortfolios } from '@woilaa/db-mykanz';
import { eq, and, isNull, desc, asc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ArrowRightLeft } from 'lucide-react';
import AddInvestmentModal from '@/components/AddInvestmentModal';
import InvestmentTransactionList from '@/components/InvestmentTransactionList';

export default async function PortfolioTransactionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  const userId = user.sub;

  // Fetch needed data for the modal
  const assets = await db.select().from(assetsTable).where(eq(assetsTable.userId, userId)).orderBy(asc(assetsTable.name));
  const wallets = await db.select().from(walletsTable).where(and(eq(walletsTable.userId, userId), isNull(walletsTable.deletedAt))).orderBy(asc(walletsTable.name));

  const transactionsRaw = await db.select({
    id: assetTransactions.id,
    transactionType: assetTransactions.transactionType,
    transactionDate: assetTransactions.transactionDate,
    units: assetTransactions.units,
    pricePerUnit: assetTransactions.pricePerUnit,
    totalAmount: assetTransactions.totalAmount,
    portfolioId: assetTransactions.portfolioId,
    assetName: assetsTable.name,
    ticker: assetsTable.tickerSymbol,
    unitName: assetsTable.unitName,
    assetType: assetsTable.assetType,
    portfolioTotalUnits: userPortfolios.totalUnits,
    portfolioAvgPrice: userPortfolios.averageBuyPrice,
  })
  .from(assetTransactions)
  .leftJoin(userPortfolios, eq(assetTransactions.portfolioId, userPortfolios.id))
  .leftJoin(assetsTable, eq(userPortfolios.assetId, assetsTable.id))
  .where(eq(assetTransactions.userId, userId))
  .orderBy(desc(assetTransactions.transactionDate));
  
  const transactions = transactionsRaw.map((t: any) => ({
    id: t.id,
    transaction_type: t.transactionType,
    transaction_date: t.transactionDate,
    units: t.units,
    price_per_unit: t.pricePerUnit,
    total_amount: t.totalAmount,
    user_portfolios: {
       id: t.portfolioId,
       total_units: t.portfolioTotalUnits,
       average_buy_price: t.portfolioAvgPrice,
       assets: { name: t.assetName, ticker_symbol: t.ticker, unit_name: t.unitName, asset_type: t.assetType }
    }
  }));

  const serializedTransactions = transactions.map(tx => ({
    ...tx,
    units: tx.units.toString(),
    price_per_unit: tx.price_per_unit.toString(),
    total_amount: tx.total_amount.toString(),
    user_portfolios: tx.user_portfolios ? {
      ...tx.user_portfolios,
      total_units: tx.user_portfolios.total_units?.toString(),
      average_buy_price: tx.user_portfolios.average_buy_price?.toString(),
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
