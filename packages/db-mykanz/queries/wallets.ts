import { eq, and, lte, sql, isNull } from "drizzle-orm";
import { db } from "../client";
import { wallets, type NewWallet, type Wallet } from "../schema/schema";

// ==========================================
// CREATE
// ==========================================

/**
 * Buat wallet baru untuk user
 */
export async function createWallet(
  data: Omit<NewWallet, "id" | "createdAt" | "updatedAt" | "deletedAt">
): Promise<Wallet> {
  const [wallet] = await db.insert(wallets).values(data).returning();
  return wallet;
}

// ==========================================
// READ
// ==========================================

/**
 * Ambil semua wallet aktif milik user
 */
export async function getWalletsByUserId(userId: string): Promise<Wallet[]> {
  return db
    .select()
    .from(wallets)
    .where(
      and(
        eq(wallets.userId, userId),
        isNull(wallets.deletedAt)
      )
    );
}

/**
 * Ambil satu wallet by ID — pastikan milik user yang benar (authorization check)
 */
export async function getWalletById(
  walletId: string,
  userId: string
): Promise<Wallet | null> {
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(
      and(
        eq(wallets.id, walletId),
        eq(wallets.userId, userId),
        isNull(wallets.deletedAt)
      )
    );
  return wallet ?? null;
}

/**
 * Ambil wallet beserta saldo kalkulasi dari view wallet_balances
 * View ini kalkulasi saldo net dari semua fiat_transactions
 */
export async function getWalletsWithBalance(
  userId: string
): Promise<{ id: string; name: string; type: string; currency: string; balance: string }[]> {
  // wallet_balances adalah SQL View — query via raw sql
  const result = await db.execute(
    sql`
      SELECT wb.wallet_id AS id, wb.name, w.type, w.currency, wb.balance::text
      FROM wallet_balances wb
      JOIN wallets w ON w.id = wb.wallet_id
      WHERE wb.user_id = ${userId}
    `
  );
  return result as any[];
}

// ==========================================
// UPDATE
// ==========================================

/**
 * Update nama atau tipe wallet
 */
export async function updateWallet(
  walletId: string,
  userId: string,
  data: Partial<Pick<NewWallet, "name" | "type" | "currency">>
): Promise<Wallet | null> {
  const [updated] = await db
    .update(wallets)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(wallets.id, walletId),
        eq(wallets.userId, userId),
        isNull(wallets.deletedAt)
      )
    )
    .returning();
  return updated ?? null;
}

// ==========================================
// DELETE (SOFT DELETE)
// ==========================================

/**
 * Soft delete wallet — set deletedAt ke NOW()
 * Data transaksi historis tetap terjaga
 */
export async function deleteWallet(
  walletId: string,
  userId: string
): Promise<boolean> {
  const [deleted] = await db
    .update(wallets)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(wallets.id, walletId),
        eq(wallets.userId, userId),
        isNull(wallets.deletedAt)
      )
    )
    .returning({ id: wallets.id });
  return !!deleted;
}

// ==========================================
// UTILITIES
// ==========================================

/**
 * Validasi bahwa wallet milik user — digunakan sebelum operasi transaksi
 */
export async function validateWalletOwnership(
  walletId: string,
  userId: string
): Promise<boolean> {
  const wallet = await getWalletById(walletId, userId);
  return wallet !== null;
}

/**
 * Validasi multiple wallets sekaligus — digunakan saat TRANSFER
 * Memastikan kedua wallet (from & to) milik user yang sama
 */
export async function validateTransferWallets(
  fromWalletId: string,
  toWalletId: string,
  userId: string
): Promise<{ valid: boolean; reason?: string }> {
  if (fromWalletId === toWalletId) {
    return { valid: false, reason: "FROM dan TO wallet tidak boleh sama" };
  }

  const [from, to] = await Promise.all([
    getWalletById(fromWalletId, userId),
    getWalletById(toWalletId, userId),
  ]);

  if (!from) return { valid: false, reason: "FROM wallet tidak ditemukan" };
  if (!to) return { valid: false, reason: "TO wallet tidak ditemukan" };

  return { valid: true };
}
