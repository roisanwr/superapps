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
  { userId: null, name: "Makan & Minum",          type: "EXPENSE" },
  { userId: null, name: "Transport",               type: "EXPENSE" },
  { userId: null, name: "Belanja",                 type: "EXPENSE" },
  { userId: null, name: "Tagihan & Utilitas",      type: "EXPENSE" },
  { userId: null, name: "Kesehatan",               type: "EXPENSE" },
  { userId: null, name: "Hiburan",                 type: "EXPENSE" },
  { userId: null, name: "Pendidikan",              type: "EXPENSE" },
  { userId: null, name: "Tempat Tinggal",          type: "EXPENSE" },
  { userId: null, name: "Pakaian",                 type: "EXPENSE" },
  { userId: null, name: "Lainnya",                 type: "EXPENSE" },

  // --- INCOME ---
  { userId: null, name: "Gaji",                    type: "INCOME" },
  { userId: null, name: "Freelance",               type: "INCOME" },
  { userId: null, name: "Bisnis",                  type: "INCOME" },
  { userId: null, name: "Investasi",               type: "INCOME" },
  { userId: null, name: "Hadiah",                  type: "INCOME" },
  { userId: null, name: "Lainnya",                 type: "INCOME" },

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
 * Ambil kategori berdasarkan tipe transaksi (INCOME / EXPENSE / TRANSFER)
 * Dipakai saat user memilih kategori ketika input transaksi
 */
export async function getCategoriesByType(
  userId: string,
  type: "INCOME" | "EXPENSE" | "TRANSFER"
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
 * STRICT: EXPENSE category tidak boleh dipakai untuk INCOME transaction, dst
 */
export async function validateCategoryType(
  categoryId: string,
  userId: string,
  expectedType: "INCOME" | "EXPENSE" | "TRANSFER"
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
