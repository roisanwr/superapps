import { eq, and, desc, gte, lte, sql, isNull } from "drizzle-orm";
import { db } from "../client";
import {
  fiatTransactions,
  assetTransactions,
  userPortfolios,
  type NewFiatTransaction,
  type NewAssetTransaction,
  type FiatTransaction,
  type AssetTransaction,
  type NewUserPortfolio,
} from "../schema/schema";
import { validateCategoryType } from "./categories";
import { validateTransferWallets, validateWalletOwnership } from "./wallets";

// ==========================================
// FIAT TRANSACTIONS — CREATE
// ==========================================

/**
 * Buat transaksi PEMASUKAN atau PENGELUARAN
 * Validasi: wallet milik user + kategori sesuai tipe
 */
export async function createFiatTransaction(
  userId: string,
  data: Omit<NewFiatTransaction, "id" | "userId" | "createdAt" | "updatedAt" | "toWalletId">
): Promise<FiatTransaction> {
  // Validasi wallet
  const walletValid = await validateWalletOwnership(data.walletId!, userId);
  if (!walletValid) throw new Error("Wallet tidak ditemukan atau bukan milik user");

  // Validasi kategori strict sesuai tipe transaksi
  if (data.categoryId) {
    const catType = data.transactionType === "PEMASUKAN" ? "PEMASUKAN" : "PENGELUARAN";
    const catValid = await validateCategoryType(data.categoryId, userId, catType);
    if (!catValid.valid) throw new Error(catValid.reason);
  }

  const [tx] = await db
    .insert(fiatTransactions)
    .values({ ...data, userId })
    .returning();
  return tx;
}

/**
 * Buat transaksi TRANSFER antar wallet
 * Atomic: satu operasi = dua insert (debit dari wallet asal, credit ke wallet tujuan)
 */
export async function createTransferTransaction(
  userId: string,
  data: {
    fromWalletId: string;
    toWalletId: string;
    amount: string;
    exchangeRate?: string;
    categoryId?: string;
    description?: string;
    transactionDate?: Date;
  }
): Promise<{ debit: FiatTransaction; credit: FiatTransaction }> {
  // Validasi kedua wallet
  const walletCheck = await validateTransferWallets(
    data.fromWalletId,
    data.toWalletId,
    userId
  );
  if (!walletCheck.valid) throw new Error(walletCheck.reason);

  // Atomic: dua insert dalam satu transaksi DB
  return await db.transaction(async (trx) => {
    // Debit dari wallet asal
    const [debit] = await trx
      .insert(fiatTransactions)
      .values({
        userId,
        walletId: data.fromWalletId,
        toWalletId: data.toWalletId,
        transactionType: "TRANSFER",
        amount: data.amount,
        exchangeRate: data.exchangeRate ?? "1.0",
        categoryId: data.categoryId,
        description: data.description ?? "Transfer",
        transactionDate: data.transactionDate ?? new Date(),
      })
      .returning();

    // Credit ke wallet tujuan
    const [credit] = await trx
      .insert(fiatTransactions)
      .values({
        userId,
        walletId: data.toWalletId,
        toWalletId: data.fromWalletId,
        transactionType: "TRANSFER",
        amount: data.amount,
        exchangeRate: data.exchangeRate ?? "1.0",
        categoryId: data.categoryId,
        description: data.description ?? "Transfer",
        transactionDate: data.transactionDate ?? new Date(),
      })
      .returning();

    return { debit, credit };
  });
}

// ==========================================
// FIAT TRANSACTIONS — READ
// ==========================================

/**
 * Ambil transaksi user dengan filter opsional:
 * - by walletId
 * - by date range
 * - by transactionType
 * - limit & offset untuk pagination
 */
export async function getFiatTransactions(
  userId: string,
  filters?: {
    walletId?: string;
    from?: Date;
    to?: Date;
    type?: "PEMASUKAN" | "PENGELUARAN" | "TRANSFER";
    limit?: number;
    offset?: number;
  }
): Promise<FiatTransaction[]> {
  const conditions = [eq(fiatTransactions.userId, userId)];

  if (filters?.walletId)
    conditions.push(eq(fiatTransactions.walletId, filters.walletId));
  if (filters?.type)
    conditions.push(eq(fiatTransactions.transactionType, filters.type));
  if (filters?.from)
    conditions.push(gte(fiatTransactions.transactionDate, filters.from));
  if (filters?.to)
    conditions.push(lte(fiatTransactions.transactionDate, filters.to));

  return db
    .select()
    .from(fiatTransactions)
    .where(and(...conditions))
    .orderBy(desc(fiatTransactions.transactionDate))
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0);
}

/**
 * Ambil satu transaksi by ID — pastikan milik user (authorization check)
 */
export async function getFiatTransactionById(
  transactionId: string,
  userId: string
): Promise<FiatTransaction | null> {
  const [tx] = await db
    .select()
    .from(fiatTransactions)
    .where(
      and(
        eq(fiatTransactions.id, transactionId),
        eq(fiatTransactions.userId, userId)
      )
    );
  return tx ?? null;
}

// ==========================================
// FIAT TRANSACTIONS — DELETE
// ==========================================

/**
 * Hapus transaksi fiat (hard delete)
 * Wallet balance otomatis terupdate karena view wallet_balances
 * kalkulasi ulang dari semua transaksi yang tersisa
 */
export async function deleteFiatTransaction(
  transactionId: string,
  userId: string
): Promise<boolean> {
  const [deleted] = await db
    .delete(fiatTransactions)
    .where(
      and(
        eq(fiatTransactions.id, transactionId),
        eq(fiatTransactions.userId, userId)
      )
    )
    .returning({ id: fiatTransactions.id });
  return !!deleted;
}

// ==========================================
// ASSET TRANSACTIONS — CREATE (ATOMIC)
// ==========================================

/**
 * Buat transaksi BELI aset — atomic dengan fiat transaction
 * Alur:
 * 1. Cek/buat portfolio entry untuk aset ini
 * 2. INSERT fiat_transactions (pengeluaran dari wallet)
 * 3. INSERT asset_transactions (linked ke fiat tx)
 * 4. Trigger update_portfolio_stats otomatis update DCA di user_portfolios
 * Semua dalam satu DB transaction — ROLLBACK jika salah satu gagal
 */
export async function createBuyAssetTransaction(
  userId: string,
  data: {
    portfolioId: string;
    walletId: string;
    units: string;
    pricePerUnit: string;
    totalAmount: string;
    notes?: string;
    transactionDate?: Date;
  }
): Promise<{ fiatTx: FiatTransaction; assetTx: AssetTransaction }> {
  const walletValid = await validateWalletOwnership(data.walletId, userId);
  if (!walletValid) throw new Error("Wallet tidak ditemukan atau bukan milik user");

  return await db.transaction(async (trx) => {
    // Step 1: INSERT fiat transaction (pengeluaran)
    const [fiatTx] = await trx
      .insert(fiatTransactions)
      .values({
        userId,
        walletId: data.walletId,
        transactionType: "PENGELUARAN",
        amount: data.totalAmount,
        description: `Beli aset`,
        transactionDate: data.transactionDate ?? new Date(),
      })
      .returning();

    // Step 2: INSERT asset transaction (linked ke fiat tx)
    const [assetTx] = await trx
      .insert(assetTransactions)
      .values({
        userId,
        portfolioId: data.portfolioId,
        transactionType: "BELI",
        units: data.units,
        pricePerUnit: data.pricePerUnit,
        totalAmount: data.totalAmount,
        linkedFiatTransactionId: fiatTx.id, // NOT NULL untuk BELI
        notes: data.notes,
        transactionDate: data.transactionDate ?? new Date(),
      })
      .returning();

    // Trigger update_portfolio_stats akan otomatis re-kalkulasi DCA

    return { fiatTx, assetTx };
  });
}

/**
 * Buat transaksi JUAL aset — atomic dengan fiat transaction
 * Uang masuk ke wallet (PEMASUKAN)
 */
export async function createSellAssetTransaction(
  userId: string,
  data: {
    portfolioId: string;
    walletId: string;
    units: string;
    pricePerUnit: string;
    totalAmount: string;
    notes?: string;
    transactionDate?: Date;
  }
): Promise<{ fiatTx: FiatTransaction; assetTx: AssetTransaction }> {
  const walletValid = await validateWalletOwnership(data.walletId, userId);
  if (!walletValid) throw new Error("Wallet tidak ditemukan atau bukan milik user");

  return await db.transaction(async (trx) => {
    // Step 1: INSERT fiat transaction (pemasukan dari hasil jual)
    const [fiatTx] = await trx
      .insert(fiatTransactions)
      .values({
        userId,
        walletId: data.walletId,
        transactionType: "PEMASUKAN",
        amount: data.totalAmount,
        description: `Jual aset`,
        transactionDate: data.transactionDate ?? new Date(),
      })
      .returning();

    // Step 2: INSERT asset transaction (linked ke fiat tx)
    const [assetTx] = await trx
      .insert(assetTransactions)
      .values({
        userId,
        portfolioId: data.portfolioId,
        transactionType: "JUAL",
        units: data.units,
        pricePerUnit: data.pricePerUnit,
        totalAmount: data.totalAmount,
        linkedFiatTransactionId: fiatTx.id, // NOT NULL untuk JUAL
        notes: data.notes,
        transactionDate: data.transactionDate ?? new Date(),
      })
      .returning();

    return { fiatTx, assetTx };
  });
}

/**
 * Buat SALDO_AWAL aset — onboarding kepemilikan historis
 * TIDAK membuat fiat transaction (linkedFiatTransactionId = NULL)
 * Digunakan saat user pertama kali setup portofolio
 */
export async function createInitialAssetBalance(
  userId: string,
  data: {
    portfolioId: string;
    units: string;
    pricePerUnit: string;
    notes?: string;
    transactionDate?: Date;
  }
): Promise<AssetTransaction> {
  const totalAmount = (
    parseFloat(data.units) * parseFloat(data.pricePerUnit)
  ).toFixed(2);

  const [assetTx] = await db
    .insert(assetTransactions)
    .values({
      userId,
      portfolioId: data.portfolioId,
      transactionType: "SALDO_AWAL",
      units: data.units,
      pricePerUnit: data.pricePerUnit,
      totalAmount,
      linkedFiatTransactionId: null, // SALDO_AWAL tidak trigger fiat
      notes: data.notes ?? "Saldo awal (onboarding)",
      transactionDate: data.transactionDate ?? new Date(),
    })
    .returning();
  return assetTx;
}

// ==========================================
// ASSET TRANSACTIONS — READ
// ==========================================

/**
 * Ambil semua transaksi aset untuk satu portfolio
 */
export async function getAssetTransactionsByPortfolio(
  portfolioId: string,
  userId: string,
  filters?: {
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<AssetTransaction[]> {
  const conditions = [
    eq(assetTransactions.portfolioId, portfolioId),
    eq(assetTransactions.userId, userId),
  ];

  if (filters?.from)
    conditions.push(gte(assetTransactions.transactionDate, filters.from));
  if (filters?.to)
    conditions.push(lte(assetTransactions.transactionDate, filters.to));

  return db
    .select()
    .from(assetTransactions)
    .where(and(...conditions))
    .orderBy(desc(assetTransactions.transactionDate))
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0);
}
