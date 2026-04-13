import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { db } from "../client";
import {
  assets,
  userPortfolios,
  assetValuations,
  type NewAsset,
  type Asset,
  type NewUserPortfolio,
  type UserPortfolio,
  type NewAssetValuation,
  type AssetValuation,
} from "../schema/schema";

// ==========================================
// ASSETS — READ
// ==========================================

/**
 * Ambil semua aset global (seed data) — tersedia untuk semua user
 * Contoh: BTC, ETH, BBCA, TLKM, dst
 */
export async function getGlobalAssets(filters?: {
  assetType?: "KRIPTO" | "SAHAM" | "LOGAM_MULIA" | "PROPERTI" | "BISNIS" | "LAINNYA";
}): Promise<Asset[]> {
  const conditions = [isNull(assets.userId)];
  if (filters?.assetType) conditions.push(eq(assets.assetType, filters.assetType));

  return db
    .select()
    .from(assets)
    .where(and(...conditions))
    .orderBy(assets.name);
}

/**
 * Ambil aset custom milik user tertentu
 */
export async function getUserAssets(
  userId: string,
  filters?: {
    assetType?: "KRIPTO" | "SAHAM" | "LOGAM_MULIA" | "PROPERTI" | "BISNIS" | "LAINNYA";
  }
): Promise<Asset[]> {
  const conditions = [eq(assets.userId, userId)];
  if (filters?.assetType) conditions.push(eq(assets.assetType, filters.assetType));

  return db
    .select()
    .from(assets)
    .where(and(...conditions))
    .orderBy(assets.name);
}

/**
 * Ambil semua aset yang bisa dipilih user:
 * - Global (seed) + Custom milik user
 * Dipakai saat user mau tambah aset ke portfolio
 */
export async function getAvailableAssets(
  userId: string,
  filters?: {
    assetType?: "KRIPTO" | "SAHAM" | "LOGAM_MULIA" | "PROPERTI" | "BISNIS" | "LAINNYA";
  }
): Promise<Asset[]> {
  const conditions = [
    sql`(${assets.userId} IS NULL OR ${assets.userId} = ${userId})`,
  ];
  if (filters?.assetType) conditions.push(eq(assets.assetType, filters.assetType));

  return db
    .select()
    .from(assets)
    .where(and(...conditions))
    .orderBy(assets.name);
}

/**
 * Ambil satu aset by ID
 * Cek bahwa aset global ATAU milik user yang benar
 */
export async function getAssetById(
  assetId: string,
  userId: string
): Promise<Asset | null> {
  const [asset] = await db
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.id, assetId),
        sql`(${assets.userId} IS NULL OR ${assets.userId} = ${userId})`
      )
    );
  return asset ?? null;
}

// ==========================================
// ASSETS — CREATE (Custom Asset)
// ==========================================

/**
 * Buat aset custom milik user
 * Dipakai untuk aset yang tidak ada di daftar global:
 * contoh: properti, bisnis, emas batangan custom
 */
export async function createCustomAsset(
  userId: string,
  data: Omit<NewAsset, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Asset> {
  const [asset] = await db
    .insert(assets)
    .values({ ...data, userId })
    .returning();
  return asset;
}

// ==========================================
// ASSETS — UPDATE
// ==========================================

/**
 * Update aset custom milik user
 * Aset global TIDAK bisa diedit — dijaga via filter userId NOT NULL
 */
export async function updateCustomAsset(
  assetId: string,
  userId: string,
  data: Partial<Pick<NewAsset, "name" | "tickerSymbol" | "unitName" | "currency" | "priceSource">>
): Promise<Asset | null> {
  const [updated] = await db
    .update(assets)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(assets.id, assetId),
        eq(assets.userId, userId) // hanya aset custom user, bukan global
      )
    )
    .returning();
  return updated ?? null;
}

// ==========================================
// USER PORTFOLIOS — CREATE
// ==========================================

/**
 * Buat atau ambil portfolio entry untuk user + aset
 * Idempotent: kalau sudah ada return yang existing
 * Dipakai sebelum insert asset_transactions
 */
export async function getOrCreatePortfolio(
  userId: string,
  assetId: string
): Promise<UserPortfolio> {
  // Cek apakah sudah ada
  const [existing] = await db
    .select()
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.userId, userId),
        eq(userPortfolios.assetId, assetId),
        isNull(userPortfolios.closedAt)
      )
    );

  if (existing) return existing;

  // Buat baru kalau belum ada
  const [portfolio] = await db
    .insert(userPortfolios)
    .values({ userId, assetId })
    .returning();
  return portfolio;
}

// ==========================================
// USER PORTFOLIOS — READ
// ==========================================

/**
 * Ambil semua portfolio aktif milik user (closedAt IS NULL)
 */
export async function getActivePortfolios(userId: string): Promise<UserPortfolio[]> {
  return db
    .select()
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.userId, userId),
        isNull(userPortfolios.closedAt)
      )
    );
}

/**
 * Ambil portfolio lengkap dengan detail aset dan harga terakhir
 * Dipakai untuk halaman Dashboard Portfolio
 */
export async function getPortfolioWithDetails(userId: string): Promise<
  {
    portfolio: UserPortfolio;
    asset: Asset;
    latestPrice: string | null;
    currentValue: string | null;
    unrealizedPnl: string | null;
    unrealizedPnlPercent: string | null;
  }[]
> {
  // Ambil via raw SQL — join dengan view latest_asset_prices
  const result = await db.execute(
    sql`
      SELECT
        up.id                           AS portfolio_id,
        up.total_units,
        up.average_buy_price,
        up.opened_at,
        a.id                            AS asset_id,
        a.name                          AS asset_name,
        a.asset_type,
        a.ticker_symbol,
        a.currency,
        a.price_source,
        lap.latest_price::text          AS latest_price,
        (up.total_units * lap.latest_price)::text   AS current_value,
        ((lap.latest_price - up.average_buy_price) * up.total_units)::text AS unrealized_pnl,
        CASE
          WHEN up.average_buy_price > 0
          THEN (((lap.latest_price - up.average_buy_price) / up.average_buy_price) * 100)::text
          ELSE NULL
        END                             AS unrealized_pnl_percent
      FROM user_portfolios up
      JOIN assets a ON a.id = up.asset_id
      LEFT JOIN latest_asset_prices lap ON lap.asset_id = up.asset_id
      WHERE up.user_id = ${userId}
        AND up.closed_at IS NULL
      ORDER BY current_value DESC NULLS LAST
    `
  );

  return (result as any[]).map((row) => ({
    portfolio: {
      id: row.portfolio_id,
      userId,
      assetId: row.asset_id,
      totalUnits: row.total_units,
      averageBuyPrice: row.average_buy_price,
      openedAt: row.opened_at,
      closedAt: null,
      createdAt: row.opened_at,
      updatedAt: row.opened_at,
    } as UserPortfolio,
    asset: {
      id: row.asset_id,
      name: row.asset_name,
      assetType: row.asset_type,
      tickerSymbol: row.ticker_symbol,
      currency: row.currency,
      priceSource: row.price_source,
    } as Asset,
    latestPrice: row.latest_price ?? null,
    currentValue: row.current_value ?? null,
    unrealizedPnl: row.unrealized_pnl ?? null,
    unrealizedPnlPercent: row.unrealized_pnl_percent ?? null,
  }));
}

/**
 * Ambil satu portfolio by ID — authorization check
 */
export async function getPortfolioById(
  portfolioId: string,
  userId: string
): Promise<UserPortfolio | null> {
  const [portfolio] = await db
    .select()
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.id, portfolioId),
        eq(userPortfolios.userId, userId)
      )
    );
  return portfolio ?? null;
}

// ==========================================
// ASSET VALUATIONS
// ==========================================

/**
 * Insert harga terbaru untuk satu aset
 * Dipanggil oleh cron job (yFinance / CoinGecko) atau manual input
 */
export async function upsertAssetValuation(
  assetId: string,
  pricePerUnit: string,
  source: "MANUAL" | "API"
): Promise<AssetValuation> {
  const [valuation] = await db
    .insert(assetValuations)
    .values({
      assetId,
      pricePerUnit,
      source,
      recordedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [assetValuations.assetId, assetValuations.recordedAt],
      set: { pricePerUnit },
    })
    .returning();
  return valuation;
}

/**
 * Ambil harga terakhir satu aset
 */
export async function getLatestAssetPrice(
  assetId: string
): Promise<AssetValuation | null> {
  const [valuation] = await db
    .select()
    .from(assetValuations)
    .where(eq(assetValuations.assetId, assetId))
    .orderBy(desc(assetValuations.recordedAt))
    .limit(1);
  return valuation ?? null;
}

/**
 * Ambil histori harga aset untuk charting
 */
export async function getAssetPriceHistory(
  assetId: string,
  filters?: {
    from?: Date;
    to?: Date;
    limit?: number;
  }
): Promise<AssetValuation[]> {
  const conditions = [eq(assetValuations.assetId, assetId)];

  if (filters?.from)
    conditions.push(sql`${assetValuations.recordedAt} >= ${filters.from}`);
  if (filters?.to)
    conditions.push(sql`${assetValuations.recordedAt} <= ${filters.to}`);

  return db
    .select()
    .from(assetValuations)
    .where(and(...conditions))
    .orderBy(desc(assetValuations.recordedAt))
    .limit(filters?.limit ?? 100);
}

/**
 * Batch upsert harga — dipakai cron job untuk update banyak aset sekaligus
 * source: 'API' untuk yFinance / CoinGecko
 */
export async function batchUpsertAssetValuations(
  valuations: { assetId: string; pricePerUnit: string }[],
  source: "MANUAL" | "API" = "API"
): Promise<void> {
  if (!valuations.length) return;
  const now = new Date();
  await db
    .insert(assetValuations)
    .values(
      valuations.map((v) => ({
        assetId: v.assetId,
        pricePerUnit: v.pricePerUnit,
        source,
        recordedAt: now,
      }))
    )
    .onConflictDoNothing();
}
