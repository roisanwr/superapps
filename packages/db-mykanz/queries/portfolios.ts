import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { db } from "../client";
import {
  userPortfolios,
  assetTransactions,
  assets,
  assetValuations,
  type UserPortfolio,
  type Asset,
  type AssetTransaction,
} from "../schema/schema";

// ==========================================
// READ — PORTFOLIO SUMMARY
// ==========================================

/**
 * Ambil ringkasan total portfolio user dalam satu currency
 * - Total invested (dari rata-rata beli × total units)
 * - Total current value (dari harga terakhir × total units)
 * - Total unrealized PnL
 * Dipakai untuk widget summary di dashboard
 */
export async function getPortfolioSummary(
  userId: string,
  currency: string = "IDR"
): Promise<{
  totalInvested: string;
  totalCurrentValue: string;
  totalUnrealizedPnl: string;
  totalUnrealizedPnlPercent: string;
  assetCount: number;
}> {
  const result = await db.execute(
    sql`
      SELECT
        COALESCE(SUM(up.average_buy_price * up.total_units), 0)::text     AS total_invested,
        COALESCE(SUM(lap.latest_price * up.total_units), 0)::text          AS total_current_value,
        COALESCE(SUM((lap.latest_price - up.average_buy_price) * up.total_units), 0)::text AS total_unrealized_pnl,
        COUNT(up.id)::int                                                   AS asset_count
      FROM user_portfolios up
      JOIN assets a ON a.id = up.asset_id AND a.currency = ${currency}
      LEFT JOIN latest_asset_prices lap ON lap.asset_id = up.asset_id
      WHERE up.user_id = ${userId}
        AND up.closed_at IS NULL
        AND up.total_units > 0
    `
  );

  const row = result.rows[0] as any;
  const invested = parseFloat(row.total_invested ?? "0");
  const currentValue = parseFloat(row.total_current_value ?? "0");
  const pnl = parseFloat(row.total_unrealized_pnl ?? "0");
  const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

  return {
    totalInvested: invested.toFixed(2),
    totalCurrentValue: currentValue.toFixed(2),
    totalUnrealizedPnl: pnl.toFixed(2),
    totalUnrealizedPnlPercent: pnlPercent.toFixed(2),
    assetCount: row.asset_count ?? 0,
  };
}

/**
 * Ambil alokasi portfolio per asset_type (pie chart data)
 * Return persentase tiap tipe aset dari total portfolio
 */
export async function getPortfolioAllocation(userId: string): Promise<
  {
    assetType: string;
    totalValue: string;
    percentage: string;
  }[]
> {
  const result = await db.execute(
    sql`
      WITH portfolio_values AS (
        SELECT
          a.asset_type,
          SUM(lap.latest_price * up.total_units) AS type_value
        FROM user_portfolios up
        JOIN assets a ON a.id = up.asset_id
        LEFT JOIN latest_asset_prices lap ON lap.asset_id = up.asset_id
        WHERE up.user_id = ${userId}
          AND up.closed_at IS NULL
          AND up.total_units > 0
        GROUP BY a.asset_type
      ),
      total AS (
        SELECT SUM(type_value) AS grand_total FROM portfolio_values
      )
      SELECT
        pv.asset_type,
        pv.type_value::text           AS total_value,
        CASE
          WHEN t.grand_total > 0
          THEN ((pv.type_value / t.grand_total) * 100)::text
          ELSE '0'
        END                           AS percentage
      FROM portfolio_values pv, total t
      ORDER BY pv.type_value DESC
    `
  );

  return (result.rows as any[]).map((row) => ({
    assetType: row.asset_type,
    totalValue: row.total_value,
    percentage: row.percentage,
  }));
}

// ==========================================
// READ — PORTFOLIO PER ASET
// ==========================================

/**
 * Ambil detail satu portfolio lengkap:
 * - Info portfolio (units, avg buy price)
 * - Info aset
 * - Harga terakhir
 * - Histori transaksi
 */
export async function getPortfolioDetail(
  portfolioId: string,
  userId: string
): Promise<{
  portfolio: UserPortfolio;
  asset: Asset;
  latestPrice: string | null;
  currentValue: string | null;
  unrealizedPnl: string | null;
  unrealizedPnlPercent: string | null;
  transactions: AssetTransaction[];
} | null> {
  // Ambil portfolio + aset via join
  const result = await db.execute(
    sql`
      SELECT
        up.id             AS portfolio_id,
        up.total_units,
        up.average_buy_price,
        up.opened_at,
        up.closed_at,
        a.id              AS asset_id,
        a.name            AS asset_name,
        a.asset_type,
        a.ticker_symbol,
        a.currency,
        a.price_source,
        a.user_id         AS asset_user_id,
        lap.latest_price::text AS latest_price,
        (up.total_units * COALESCE(lap.latest_price, 0))::text AS current_value,
        ((COALESCE(lap.latest_price, 0) - up.average_buy_price) * up.total_units)::text AS unrealized_pnl,
        CASE
          WHEN up.average_buy_price > 0
          THEN (((COALESCE(lap.latest_price, 0) - up.average_buy_price) / up.average_buy_price) * 100)::text
          ELSE NULL
        END               AS unrealized_pnl_percent
      FROM user_portfolios up
      JOIN assets a ON a.id = up.asset_id
      LEFT JOIN latest_asset_prices lap ON lap.asset_id = up.asset_id
      WHERE up.id = ${portfolioId}
        AND up.user_id = ${userId}
      LIMIT 1
    `
  );

  if (!result.rows.length) return null;
  const row = result.rows[0] as any;

  // Ambil histori transaksi aset
  const transactions = await db
    .select()
    .from(assetTransactions)
    .where(
      and(
        eq(assetTransactions.portfolioId, portfolioId),
        eq(assetTransactions.userId, userId)
      )
    )
    .orderBy(desc(assetTransactions.transactionDate));

  return {
    portfolio: {
      id: row.portfolio_id,
      userId,
      assetId: row.asset_id,
      totalUnits: row.total_units,
      averageBuyPrice: row.average_buy_price,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      createdAt: row.opened_at,
      updatedAt: row.opened_at,
    } as UserPortfolio,
    asset: {
      id: row.asset_id,
      userId: row.asset_user_id,
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
    transactions,
  };
}

// ==========================================
// READ — REALIZED PnL (CLOSED POSITIONS)
// ==========================================

/**
 * Ambil realized PnL dari aset yang sudah dijual
 * Kalkulasi: total hasil jual - total modal beli
 */
export async function getRealizedPnl(userId: string): Promise<
  {
    portfolioId: string;
    assetName: string;
    totalBought: string;
    totalSold: string;
    realizedPnl: string;
    realizedPnlPercent: string;
  }[]
> {
  const result = await db.execute(
    sql`
      SELECT
        up.id                         AS portfolio_id,
        a.name                        AS asset_name,
        COALESCE(SUM(CASE WHEN at.transaction_type = 'BELI' THEN at.total_amount ELSE 0 END), 0)::text AS total_bought,
        COALESCE(SUM(CASE WHEN at.transaction_type = 'JUAL' THEN at.total_amount ELSE 0 END), 0)::text AS total_sold,
        (
          COALESCE(SUM(CASE WHEN at.transaction_type = 'JUAL' THEN at.total_amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN at.transaction_type = 'BELI' THEN at.total_amount ELSE 0 END), 0)
        )::text                       AS realized_pnl,
        CASE
          WHEN SUM(CASE WHEN at.transaction_type = 'BELI' THEN at.total_amount ELSE 0 END) > 0
          THEN (
            (
              COALESCE(SUM(CASE WHEN at.transaction_type = 'JUAL' THEN at.total_amount ELSE 0 END), 0) -
              COALESCE(SUM(CASE WHEN at.transaction_type = 'BELI' THEN at.total_amount ELSE 0 END), 0)
            ) /
            SUM(CASE WHEN at.transaction_type = 'BELI' THEN at.total_amount ELSE 0 END) * 100
          )::text
          ELSE '0'
        END                           AS realized_pnl_percent
      FROM user_portfolios up
      JOIN assets a ON a.id = up.asset_id
      JOIN asset_transactions at ON at.portfolio_id = up.id
      WHERE up.user_id = ${userId}
        AND at.transaction_type IN ('BELI', 'JUAL')
      GROUP BY up.id, a.name
      HAVING SUM(CASE WHEN at.transaction_type = 'JUAL' THEN at.total_amount ELSE 0 END) > 0
      ORDER BY realized_pnl DESC
    `
  );

  return (result.rows as any[]).map((row) => ({
    portfolioId: row.portfolio_id,
    assetName: row.asset_name,
    totalBought: row.total_bought,
    totalSold: row.total_sold,
    realizedPnl: row.realized_pnl,
    realizedPnlPercent: row.realized_pnl_percent,
  }));
}

// ==========================================
// UPDATE — CLOSE PORTFOLIO
// ==========================================

/**
 * Tutup portfolio ketika user jual semua units
 * Set closedAt = NOW()
 * Dipanggil dari aplikasi setelah JUAL transaksi menguras total_units ke 0
 */
export async function closePortfolio(
  portfolioId: string,
  userId: string
): Promise<UserPortfolio | null> {
  const [closed] = await db
    .update(userPortfolios)
    .set({ closedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(userPortfolios.id, portfolioId),
        eq(userPortfolios.userId, userId),
        isNull(userPortfolios.closedAt)
      )
    )
    .returning();
  return closed ?? null;
}
