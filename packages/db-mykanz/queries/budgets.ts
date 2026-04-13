import { eq, and, lte, gte, sql, isNull } from "drizzle-orm";
import { db } from "../client";
import {
  budgets,
  budgetCategories,
  budgetWallets,
  type NewBudget,
  type Budget,
  type BudgetCategory,
  type BudgetWallet,
} from "../schema/schema";
import { validateCategoryAccess } from "./categories";
import { validateWalletOwnership } from "./wallets";

// ==========================================
// CREATE
// ==========================================

/**
 * Buat budget baru dengan kategori dan wallet yang di-assign
 * Hybrid scope:
 * - walletIds kosong = budget berlaku untuk semua wallet user
 * - walletIds diisi = budget hanya berlaku untuk wallet yang dipilih
 * Atomic: insert budget + budget_categories + budget_wallets sekaligus
 */
export async function createBudget(
  userId: string,
  data: {
    amount: string;
    period: string;
    startDate: Date;
    endDate: Date;
    categoryIds: string[];        // wajib minimal 1 kategori
    walletIds?: string[];         // opsional — kosong = semua wallet
  }
): Promise<{
  budget: Budget;
  categories: BudgetCategory[];
  wallets: BudgetWallet[];
}> {
  // Validasi semua kategori bisa diakses user
  for (const catId of data.categoryIds) {
    const valid = await validateCategoryAccess(catId, userId);
    if (!valid) throw new Error(`Kategori ${catId} tidak ditemukan`);
  }

  // Validasi semua wallet milik user (jika diisi)
  if (data.walletIds?.length) {
    for (const walletId of data.walletIds) {
      const valid = await validateWalletOwnership(walletId, userId);
      if (!valid) throw new Error(`Wallet ${walletId} tidak ditemukan`);
    }
  }

  return await db.transaction(async (trx) => {
    // Step 1: INSERT budget
    const [budget] = await trx
      .insert(budgets)
      .values({
        userId,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
      })
      .returning();

    // Step 2: INSERT budget_categories (junction)
    const budgetCats = await trx
      .insert(budgetCategories)
      .values(
        data.categoryIds.map((categoryId) => ({
          budgetId: budget.id,
          categoryId,
        }))
      )
      .returning();

    // Step 3: INSERT budget_wallets (junction) — hanya jika ada walletIds
    // Kalau kosong, tidak ada row = berlaku semua wallet
    let budgetWalletRows: BudgetWallet[] = [];
    if (data.walletIds?.length) {
      budgetWalletRows = await trx
        .insert(budgetWallets)
        .values(
          data.walletIds.map((walletId) => ({
            budgetId: budget.id,
            walletId,
          }))
        )
        .returning();
    }

    return { budget, categories: budgetCats, wallets: budgetWalletRows };
  });
}

// ==========================================
// READ
// ==========================================

/**
 * Ambil semua budget milik user beserta kategori dan wallet yang di-assign
 */
export async function getBudgetsByUserId(userId: string): Promise<
  {
    budget: Budget;
    categoryIds: string[];
    walletIds: string[];        // kosong = berlaku semua wallet
  }[]
> {
  const userBudgets = await db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId))
    .orderBy(budgets.startDate);

  if (!userBudgets.length) return [];

  const budgetIds = userBudgets.map((b) => b.id);

  // Ambil semua kategori untuk budget-budget ini
  const cats = await db
    .select()
    .from(budgetCategories)
    .where(
      sql`${budgetCategories.budgetId} = ANY(${sql.raw(
        `ARRAY[${budgetIds.map((id) => `'${id}'`).join(",")}]::uuid[]`
      )})`
    );

  // Ambil semua wallet untuk budget-budget ini
  const wallets = await db
    .select()
    .from(budgetWallets)
    .where(
      sql`${budgetWallets.budgetId} = ANY(${sql.raw(
        `ARRAY[${budgetIds.map((id) => `'${id}'`).join(",")}]::uuid[]`
      )})`
    );

  return userBudgets.map((budget) => ({
    budget,
    categoryIds: cats
      .filter((c) => c.budgetId === budget.id)
      .map((c) => c.categoryId),
    walletIds: wallets
      .filter((w) => w.budgetId === budget.id)
      .map((w) => w.walletId),
  }));
}

/**
 * Ambil budget aktif user pada tanggal tertentu (default: sekarang)
 */
export async function getActiveBudgets(
  userId: string,
  atDate: Date = new Date()
): Promise<Budget[]> {
  return db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, userId),
        lte(budgets.startDate, atDate),
        gte(budgets.endDate, atDate)
      )
    );
}

/**
 * Ambil satu budget by ID + detail kategori dan wallet
 */
export async function getBudgetById(
  budgetId: string,
  userId: string
): Promise<{
  budget: Budget;
  categoryIds: string[];
  walletIds: string[];
} | null> {
  const [budget] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)));

  if (!budget) return null;

  const [cats, walls] = await Promise.all([
    db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.budgetId, budgetId)),
    db
      .select()
      .from(budgetWallets)
      .where(eq(budgetWallets.budgetId, budgetId)),
  ]);

  return {
    budget,
    categoryIds: cats.map((c) => c.categoryId),
    walletIds: walls.map((w) => w.walletId),
  };
}

/**
 * Ambil progress budget — kalkulasi spending vs limit via raw SQL
 * Menghitung total pengeluaran dari fiat_transactions yang sesuai
 * kategori budget dan dalam range tanggal budget
 */
export async function getBudgetProgress(
  budgetId: string,
  userId: string
): Promise<{
  budgetAmount: string;
  spentAmount: string;
  remainingAmount: string;
  percentage: number;
} | null> {
  const budgetData = await getBudgetById(budgetId, userId);
  if (!budgetData) return null;

  const { budget, categoryIds, walletIds } = budgetData;

  // Build dynamic WHERE untuk wallet scope
  const walletFilter =
    walletIds.length > 0
      ? sql`AND ft.wallet_id = ANY(ARRAY[${sql.raw(
          walletIds.map((id) => `'${id}'`).join(",")
        )}]::uuid[])`
      : sql``;

  const result = await db.execute(
    sql`
      SELECT COALESCE(SUM(ft.amount), 0)::text AS spent
      FROM fiat_transactions ft
      WHERE ft.user_id = ${userId}
        AND ft.transaction_type = 'PENGELUARAN'
        AND ft.category_id = ANY(ARRAY[${sql.raw(
          categoryIds.map((id) => `'${id}'`).join(",")
        )}]::uuid[])
        AND ft.transaction_date BETWEEN ${budget.startDate} AND ${budget.endDate}
        ${walletFilter}
    `
  );

  const spent = parseFloat((result[0] as any)?.spent ?? "0");
  const limit = parseFloat(budget.amount);
  const remaining = Math.max(0, limit - spent);
  const percentage = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

  return {
    budgetAmount: budget.amount,
    spentAmount: spent.toFixed(2),
    remainingAmount: remaining.toFixed(2),
    percentage: parseFloat(percentage.toFixed(2)),
  };
}

// ==========================================
// UPDATE
// ==========================================

/**
 * Update budget amount dan periode
 */
export async function updateBudget(
  budgetId: string,
  userId: string,
  data: Partial<Pick<NewBudget, "amount" | "period" | "startDate" | "endDate">>
): Promise<Budget | null> {
  const [updated] = await db
    .update(budgets)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)))
    .returning();
  return updated ?? null;
}

/**
 * Update kategori yang di-assign ke budget
 * Replace semua — delete lama, insert baru
 */
export async function updateBudgetCategories(
  budgetId: string,
  userId: string,
  categoryIds: string[]
): Promise<BudgetCategory[]> {
  // Pastikan budget milik user
  const [budget] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)));
  if (!budget) throw new Error("Budget tidak ditemukan");

  return await db.transaction(async (trx) => {
    await trx
      .delete(budgetCategories)
      .where(eq(budgetCategories.budgetId, budgetId));
    return trx
      .insert(budgetCategories)
      .values(categoryIds.map((categoryId) => ({ budgetId, categoryId })))
      .returning();
  });
}

/**
 * Update wallet scope budget
 * walletIds kosong = reset ke semua wallet (global)
 */
export async function updateBudgetWallets(
  budgetId: string,
  userId: string,
  walletIds: string[]
): Promise<BudgetWallet[]> {
  const [budget] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)));
  if (!budget) throw new Error("Budget tidak ditemukan");

  return await db.transaction(async (trx) => {
    await trx
      .delete(budgetWallets)
      .where(eq(budgetWallets.budgetId, budgetId));

    if (!walletIds.length) return []; // reset ke semua wallet

    return trx
      .insert(budgetWallets)
      .values(walletIds.map((walletId) => ({ budgetId, walletId })))
      .returning();
  });
}

// ==========================================
// DELETE
// ==========================================

/**
 * Hapus budget (hard delete)
 * Cascade otomatis hapus budget_categories dan budget_wallets
 */
export async function deleteBudget(
  budgetId: string,
  userId: string
): Promise<boolean> {
  const [deleted] = await db
    .delete(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)))
    .returning({ id: budgets.id });
  return !!deleted;
}
