import { eq, and, or, isNull } from "drizzle-orm";
import { db } from "../client";
import { categories, type NewCategory, type Category } from "../schema/schema";

// ==========================================
// SEED DATA — Kategori Global Bawaan Sistem
// Dijalankan sekali saat setup DB pertama kali
// user_id = NULL menandakan kategori global
// ==========================================

export const SEED_CATEGORIES: Omit<NewCategory, "id" | "createdAt" | "updatedAt" | "deletedAt">[] = [
  // --- EXPENSE ---
  { userId: null, name: "Makan & Minum",          type: "PENGELUARAN" },
  { userId: null, name: "Transport",               type: "PENGELUARAN" },
  { userId: null, name: "Belanja",                 type: "PENGELUARAN" },
  { userId: null, name: "Tagihan & Utilitas",      type: "PENGELUARAN" },
  { userId: null, name: "Kesehatan",               type: "PENGELUARAN" },
  { userId: null, name: "Hiburan",                 type: "PENGELUARAN" },
  { userId: null, name: "Pendidikan",              type: "PENGELUARAN" },
  { userId: null, name: "Tempat Tinggal",          type: "PENGELUARAN" },
  { userId: null, name: "Pakaian",                 type: "PENGELUARAN" },
  { userId: null, name: "Lainnya",                 type: "PENGELUARAN" },

  // --- INCOME ---
  { userId: null, name: "Gaji",                    type: "PEMASUKAN" },
  { userId: null, name: "Freelance",               type: "PEMASUKAN" },
  { userId: null, name: "Bisnis",                  type: "PEMASUKAN" },
  { userId: null, name: "Investasi",               type: "PEMASUKAN" },
  { userId: null, name: "Hadiah",                  type: "PEMASUKAN" },
  { userId: null, name: "Lainnya",                 type: "PEMASUKAN" },

  // --- TRANSFER ---
  { userId: null, name: "Transfer Antar Wallet",   type: "TRANSFER" },
];

/**
 * Seed kategori global ke DB — jalankan sekali saat setup awal
 * Menggunakan onConflictDoNothing agar aman dijalankan ulang
 */
export async function seedCategories(): Promise<void> {
  await db
    .insert(categories)
    .values(SEED_CATEGORIES)
    .onConflictDoNothing();
}

// ==========================================
// CREATE
// ==========================================

/**
 * Buat kategori custom milik user
 * STRICT: type harus ditentukan — satu kategori hanya untuk satu tipe transaksi
 */
export async function createCategory(
  userId: string,
  data: Pick<NewCategory, "name" | "type">
): Promise<Category> {
  const [category] = await db
    .insert(categories)
    .values({ ...data, userId })
    .returning();
  return category;
}

// ==========================================
// READ
// ==========================================

/**
 * Ambil semua kategori yang bisa dipakai user:
 * - Kategori global (userId IS NULL)
 * - Kategori custom milik user tersebut
 */
export async function getCategoriesByUserId(
  userId: string
): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(
      and(
        or(
          isNull(categories.userId),
          eq(categories.userId, userId)
        ),
        isNull(categories.deletedAt)
      )
    );
}

/**
 * Ambil kategori berdasarkan tipe transaksi (PEMASUKAN / PENGELUARAN / TRANSFER)
 * Dipakai saat user memilih kategori ketika input transaksi
 */
export async function getCategoriesByType(
  userId: string,
  type: "PEMASUKAN" | "PENGELUARAN" | "TRANSFER"
): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(
      and(
        or(
          isNull(categories.userId),
          eq(categories.userId, userId)
        ),
        eq(categories.type, type),
        isNull(categories.deletedAt)
      )
    );
}

/**
 * Ambil satu kategori by ID
 * Cek bahwa kategori adalah global ATAU milik user yang benar
 */
export async function getCategoryById(
  categoryId: string,
  userId: string
): Promise<Category | null> {
  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, categoryId),
        or(
          isNull(categories.userId),
          eq(categories.userId, userId)
        ),
        isNull(categories.deletedAt)
      )
    );
  return category ?? null;
}

// ==========================================
// UPDATE
// ==========================================

/**
 * Update kategori custom milik user
 * Kategori global TIDAK bisa diedit — dijaga via filter userId NOT NULL
 */
export async function updateCategory(
  categoryId: string,
  userId: string,
  data: Partial<Pick<NewCategory, "name" | "type">>
): Promise<Category | null> {
  const [updated] = await db
    .update(categories)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(categories.id, categoryId),
        eq(categories.userId, userId), // hanya kategori custom user, bukan global
        isNull(categories.deletedAt)
      )
    )
    .returning();
  return updated ?? null;
}

// ==========================================
// DELETE (SOFT DELETE)
// ==========================================

/**
 * Soft delete kategori custom milik user
 * Kategori global TIDAK bisa dihapus — dijaga via filter userId NOT NULL
 */
export async function deleteCategory(
  categoryId: string,
  userId: string
): Promise<boolean> {
  const [deleted] = await db
    .update(categories)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(categories.id, categoryId),
        eq(categories.userId, userId), // hanya kategori custom user, bukan global
        isNull(categories.deletedAt)
      )
    )
    .returning({ id: categories.id });
  return !!deleted;
}

// ==========================================
// UTILITIES
// ==========================================

/**
 * Validasi bahwa kategori ada dan bisa dipakai user
 * Dipakai sebelum insert transaksi
 */
export async function validateCategoryAccess(
  categoryId: string,
  userId: string
): Promise<boolean> {
  const category = await getCategoryById(categoryId, userId);
  return category !== null;
}

/**
 * Validasi kategori sesuai dengan tipe transaksi yang sedang dibuat
 * STRICT: PENGELUARAN category tidak boleh dipakai untuk PEMASUKAN transaction, dst
 */
export async function validateCategoryType(
  categoryId: string,
  userId: string,
  expectedType: "PEMASUKAN" | "PENGELUARAN" | "TRANSFER"
): Promise<{ valid: boolean; reason?: string }> {
  const category = await getCategoryById(categoryId, userId);
  if (!category) return { valid: false, reason: "Kategori tidak ditemukan" };
  if (category.type !== expectedType) {
    return {
      valid: false,
      reason: `Kategori bertipe ${category.type}, bukan ${expectedType}`,
    };
  }
  return { valid: true };
}
