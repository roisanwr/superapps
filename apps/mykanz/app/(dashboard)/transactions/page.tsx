// app/(dashboard)/transactions/page.tsx
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { fiatTransactions, wallets as walletsTable, categories as categoriesTable } from '@woilaa/db-mykanz';
import { eq, and, gte, lte, desc, ilike, or, isNull, aliasedTable } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import AddTransactionModal from '@/components/AddTransactionModal';
import TransactionList from '@/components/TransactionList';
import TransactionFilters from '@/components/TransactionFilters';
import { TrendingDown, TrendingUp, FilterX } from 'lucide-react';

export default async function TransactionsPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const searchParams = await props.searchParams;
  const { type, categoryId, walletId, startDate, endDate, search, minAmount, maxAmount } = searchParams;

  // Fetch Wallets for the Add form & Filters
  const wallets = await db.select({ id: walletsTable.id, name: walletsTable.name, currency: walletsTable.currency })
    .from(walletsTable)
    .where(and(eq(walletsTable.userId, user.sub), isNull(walletsTable.deletedAt)));

  // Fetch Categories for the Add form & Filters
  const categories = await db.select({ id: categoriesTable.id, name: categoriesTable.name, type: categoriesTable.type })
    .from(categoriesTable)
    .where(and(eq(categoriesTable.userId, user.sub), isNull(categoriesTable.deletedAt)));

  // Build conditions array for Drizzle
  const conditions: any[] = [eq(fiatTransactions.userId, user.sub)];

  if (type) conditions.push(eq(fiatTransactions.transactionType, type as any));
  if (categoryId && type !== 'TRANSFER') conditions.push(eq(fiatTransactions.categoryId, categoryId));
  if (walletId) conditions.push(or(eq(fiatTransactions.walletId, walletId), eq(fiatTransactions.toWalletId, walletId)));
  if (startDate) conditions.push(gte(fiatTransactions.transactionDate, new Date(`${startDate}T00:00:00.000Z`)));
  if (endDate) conditions.push(lte(fiatTransactions.transactionDate, new Date(`${endDate}T23:59:59.999Z`)));
  if (search && search.trim()) conditions.push(ilike(fiatTransactions.description, `%${search.trim()}%`));

  // Fetch Transactions for List  
  const toWalletsAlias = aliasedTable(walletsTable, 'toWallets');
  const transactionsRaw = await db.select({
    id: fiatTransactions.id,
    transaction_type: fiatTransactions.transactionType,
    transaction_date: fiatTransactions.transactionDate,
    amount: fiatTransactions.amount,
    exchange_rate: fiatTransactions.exchangeRate,
    description: fiatTransactions.description,
    categories: { name: categoriesTable.name, type: categoriesTable.type },
    wallets_fiat_transactions_wallet_idTowallets: { name: walletsTable.name, currency: walletsTable.currency },
    wallets_fiat_transactions_to_wallet_idTowallets: { name: toWalletsAlias.name, currency: toWalletsAlias.currency },
  })
  .from(fiatTransactions)
  .leftJoin(categoriesTable, eq(fiatTransactions.categoryId, categoriesTable.id))
  .leftJoin(walletsTable, eq(fiatTransactions.walletId, walletsTable.id))
  .leftJoin(toWalletsAlias, eq(fiatTransactions.toWalletId, toWalletsAlias.id))
  .where(and(...conditions))
  .orderBy(desc(fiatTransactions.transactionDate))
  .limit(100);

  // Convert Decimals to Numbers for serialization
  const transactions = transactionsRaw.map((tx: any) => ({
    ...tx,
    amount: Number(tx.amount),
    exchange_rate: tx.exchange_rate ? Number(tx.exchange_rate) : null
  }));

  // Calculate Simple Monthly Stats
  const totalIncome = transactions
    .filter((tx: any) => tx.transaction_type === 'PEMASUKAN')
    .reduce((acc: number, curr: any) => acc + curr.amount, 0);
    
  const totalExpense = transactions
    .filter((tx: any) => tx.transaction_type === 'PENGELUARAN')
    .reduce((acc: number, curr: any) => acc + curr.amount, 0);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Riwayat Transaksi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau arus kas masuk, keluar, dan transfer uangmu.
          </p>
        </div>
        
        {/* MODAL TRIGGER */}
        <AddTransactionModal wallets={wallets} categories={categories} />
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-emerald-800 dark:text-emerald-400 font-semibold mb-1">Pemasukan (Terfilter)</p>
            <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{formatRupiah(totalIncome)}</h3>
          </div>
          <div className="p-4 bg-emerald-200 dark:bg-emerald-500/20 rounded-full">
            <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-rose-800 dark:text-rose-400 font-semibold mb-1">Pengeluaran (Terfilter)</p>
            <h3 className="text-3xl font-black text-rose-700 dark:text-rose-300">{formatRupiah(totalExpense)}</h3>
          </div>
          <div className="p-4 bg-rose-200 dark:bg-rose-500/20 rounded-full">
            <TrendingDown className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
      </div>

      {/* FILTER COMPONENT */}
      <TransactionFilters categories={categories} wallets={wallets} />

      {/* TRANSACTION LIST SECTION */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Data Transaksi {transactions.length === 100 && <span className="text-orange-500 text-sm italic font-normal ml-2">(Max 100 data terbaru)</span>}
        </h3>
        
        {conditions.length > 1 && transactions.length === 0 ? (
           <div className="text-center py-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <FilterX className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Berdasarkan filter saat ini,<br/>Belum ada transaksi yang ditemukan.</p>
           </div>
        ) : (
          <TransactionList transactions={transactions} />
        )}
      </div>

    </div>
  );
}
