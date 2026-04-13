import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  decimal,
  timestamptz,
  uniqueIndex,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ==========================================
// ENUMS
// ==========================================

export const walletTypeEnum = pgEnum("wallet_type", [
  "TUNAI",
  "BANK",
  "DOMPET_DIGITAL",
]);

export const fiatTxTypeEnum = pgEnum("fiat_tx_type", [
  "PEMASUKAN",
  "PENGELUARAN",
  "TRANSFER",
]);

// STRICT: satu kategori hanya untuk satu tipe transaksi
export const categoryTypeEnum = pgEnum("category_type", [
  "INCOME",
  "EXPENSE",
  "TRANSFER",
]);

export const assetTypeEnum = pgEnum("asset_type", [
  "KRIPTO",   // price source: CoinGecko API
  "SAHAM",    // price source: yFinance API
  "LOGAM_MULIA", // price source: MANUAL
  "PROPERTI",    // price source: MANUAL
  "BISNIS",      // price source: MANUAL
  "LAINNYA",     // price source: MANUAL
]);

export const assetTxTypeEnum = pgEnum("asset_tx_type", [
  "BELI",
  "JUAL",
  "SALDO_AWAL", // onboarding awal — tidak trigger fiat transaction
]);

export const valuationSourceEnum = pgEnum("valuation_source", [
  "MANUAL",
  "API",
]);

// ==========================================
// 1. WALLETS
// ==========================================

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Cross-DB reference ke DB Auth — plain UUID, tidak ada FK constraint
    userId: uuid("user_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: walletTypeEnum("type").notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("IDR"),
    deletedAt: timestamptz("deleted_at"),
    createdAt: timestamptz("created_at").defaultNow(),
    updatedAt: timestamptz("updated_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_wallets_user").on(table.userId).where(
      sql`${table.deletedAt} IS NULL`
    ),
  })
);

// ==========================================
// 2. CATEGORIES
// ==========================================

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // NULL = kategori global (seed data), NOT NULL = kategori custom user
    userId: uuid("user_id"),
    name: varchar("name", { length: 100 }).notNull(),
    // STRICT: kategori hanya untuk satu tipe transaksi
    type: categoryTypeEnum("type").notNull(),
    deletedAt: timestamptz("deleted_at"),
    createdAt: timestamptz("created_at").defaultNow(),
    updatedAt: timestamptz("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueUserCategory: unique().on(table.userId, table.name, table.type),
    userIdx: index("idx_categories_user").on(table.userId).where(
      sql`${table.deletedAt} IS NULL`
    ),
  })
);

// ==========================================
// 3. FIAT TRANSACTIONS
// ==========================================

export const fiatTransactions = pgTable(
  "fiat_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    walletId: uuid("wallet_id").notNull().references(() => wallets.id, {
      onDelete: "cascade",
    }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    // Hanya diisi kalau tipe TRANSFER
    toWalletId: uuid("to_wallet_id").references(() => wallets.id, {
      onDelete: "cascade",
    }),
    transactionType: fiatTxTypeEnum("transaction_type").notNull(),
    amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
    exchangeRate: decimal("exchange_rate", { precision: 18, scale: 6 }).default(
      "1.0"
    ),
    description: text("description"),
    transactionDate: timestamptz("transaction_date").defaultNow(),
    createdAt: timestamptz("created_at").defaultNow(),
    updatedAt: timestamptz("updated_at").defaultNow(),
  },
  (table) => ({
    // Tidak boleh transfer ke wallet yang sama
    checkNotSameWallet: check(
      "check_not_same_wallet",
      sql`${table.transactionType} <> 'TRANSFER' OR (${table.walletId} IS DISTINCT FROM ${table.toWalletId})`
    ),
    checkAmountPositive: check(
      "check_amount_positive",
      sql`${table.amount} > 0`
    ),
    userDateIdx: index("idx_fiat_tx_user_date").on(
      table.userId,
      table.transactionDate
    ),
    walletIdx: index("idx_fiat_tx_wallet").on(table.walletId),
  })
);

// ==========================================
// 4. BUDGETS
// ==========================================

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  startDate: timestamptz("start_date").notNull(),
  endDate: timestamptz("end_date").notNull(),
  createdAt: timestamptz("created_at").defaultNow(),
  updatedAt: timestamptz("updated_at").defaultNow(),
});

// Junction table: satu budget bisa link ke beberapa kategori (Hybrid)
export const budgetCategories = pgTable(
  "budget_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueBudgetCategory: unique().on(table.budgetId, table.categoryId),
  })
);

// Junction table: satu budget bisa link ke beberapa wallet (Hybrid scope)
// Kalau kosong = berlaku untuk semua wallet user
export const budgetWallets = pgTable(
  "budget_wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueBudgetWallet: unique().on(table.budgetId, table.walletId),
  })
);

// ==========================================
// 5. ASSETS (HYBRID MODE)
// ==========================================

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // NULL = aset global (BTC, BBCA, dst) — di-seed & di-share ke semua user
    // NOT NULL = aset custom milik user tertentu
    userId: uuid("user_id"),
    name: varchar("name", { length: 255 }).notNull(),
    assetType: assetTypeEnum("asset_type").notNull(),
    // Diisi untuk SAHAM (yFinance) dan KRIPTO (CoinGecko)
    tickerSymbol: varchar("ticker_symbol", { length: 50 }),
    unitName: varchar("unit_name", { length: 50 }).default("unit"),
    currency: varchar("currency", { length: 10 }).notNull().default("IDR"),
    priceSource: valuationSourceEnum("price_source").default("MANUAL"),
    createdAt: timestamptz("created_at").defaultNow(),
    updatedAt: timestamptz("updated_at").defaultNow(),
  },
  (table) => ({
    // Aset global: unique per tipe + ticker
    uniqueGlobalAssets: uniqueIndex("idx_unique_global_assets")
      .on(table.assetType, table.tickerSymbol)
      .where(sql`${table.userId} IS NULL`),
    // Aset user: unique per user + tipe + ticker
    uniqueUserAssets: uniqueIndex("idx_unique_user_assets")
      .on(table.userId, table.assetType, table.tickerSymbol)
      .where(sql`${table.userId} IS NOT NULL`),
  })
);

// ==========================================
// 6. GOALS
// ==========================================

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    targetAmount: decimal("target_amount", { precision: 18, scale: 2 }).notNull(),
    // Manual update dari aplikasi — bukan trigger atau view
    currentAmount: decimal("current_amount", { precision: 18, scale: 2 }).default("0"),
    deadline: timestamptz("deadline"),
    // Opsional: goal bisa berupa target kepemilikan aset (saham, kripto, dst)
    assetId: uuid("asset_id").references(() => assets.id, {
      onDelete: "cascade",
    }),
    targetAssetUnits: decimal("target_asset_units", { precision: 18, scale: 8 }),
    currentAssetUnits: decimal("current_asset_units", {
      precision: 18,
      scale: 8,
    }).default("0"),
    createdAt: timestamptz("created_at").defaultNow(),
    updatedAt: timestamptz("updated_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_goals_user").on(table.userId),
    checkTargetPositive: check(
      "check_target_positive",
      sql`${table.targetAmount} > 0`
    ),
    checkCurrentNonNegative: check(
      "check_current_non_negative",
      sql`${table.currentAmount} >= 0`
    ),
  })
);

// ==========================================
// 7. USER PORTFOLIOS
// ==========================================

export const userPortfolios = pgTable(
  "user_portfolios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    // Di-update otomatis via trigger update_portfolio_stats (DCA)
    totalUnits: decimal("total_units", { precision: 18, scale: 8 }).default("0"),
    averageBuyPrice: decimal("average_buy_price", {
      precision: 18,
      scale: 2,
    }).default("0"),
    openedAt: timestamptz("opened_at").defaultNow(),
    closedAt: timestamptz("closed_at"),
    createdAt: timestamptz("created_at").defaultNow(),
    updatedAt: timestamptz("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueUserAsset: unique().on(table.userId, table.assetId),
    userIdx: index("idx_portfolios_user").on(table.userId),
  })
);

// ==========================================
// 8. ASSET TRANSACTIONS
// ==========================================

export const assetTransactions = pgTable(
  "asset_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => userPortfolios.id, { onDelete: "cascade" }),
    transactionType: assetTxTypeEnum("transaction_type").notNull(),
    units: decimal("units", { precision: 18, scale: 8 }).notNull(),
    pricePerUnit: decimal("price_per_unit", { precision: 18, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).notNull(),
    // NOT NULL untuk BELI dan JUAL (atomic dengan fiat_transactions)
    // NULL untuk SALDO_AWAL (onboarding — tidak trigger fiat)
    linkedFiatTransactionId: uuid("linked_fiat_transaction_id").references(
      () => fiatTransactions.id,
      { onDelete: "set null" }
    ),
    notes: text("notes"),
    transactionDate: timestamptz("transaction_date").defaultNow(),
    createdAt: timestamptz("created_at").defaultNow(),
    updatedAt: timestamptz("updated_at").defaultNow(),
  },
  (table) => ({
    portfolioIdx: index("idx_asset_tx_portfolio").on(table.portfolioId),
    userDateIdx: index("idx_asset_tx_user_date").on(
      table.userId,
      table.transactionDate
    ),
    // SALDO_AWAL boleh null, BELI dan JUAL wajib ada linkedFiatTransactionId
    checkFiatLink: check(
      "check_fiat_link",
      sql`${table.transactionType} = 'SALDO_AWAL' OR ${table.linkedFiatTransactionId} IS NOT NULL`
    ),
    checkUnitsPositive: check(
      "check_units_positive",
      sql`${table.units} > 0`
    ),
    checkPriceNonNegative: check(
      "check_price_non_negative",
      sql`${table.pricePerUnit} >= 0`
    ),
  })
);

// ==========================================
// 9. ASSET VALUATIONS
// ==========================================

export const assetValuations = pgTable(
  "asset_valuations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    pricePerUnit: decimal("price_per_unit", { precision: 18, scale: 8 }).notNull(),
    source: valuationSourceEnum("source").notNull(),
    recordedAt: timestamptz("recorded_at").defaultNow(),
    createdAt: timestamptz("created_at").defaultNow(),
  },
  (table) => ({
    uniqueAssetRecorded: unique().on(table.assetId, table.recordedAt),
    assetRecordedIdx: index("idx_asset_valuations_recorded").on(
      table.assetId,
      table.recordedAt
    ),
  })
);

// ==========================================
// TYPE INFERENCE
// ==========================================

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type FiatTransaction = typeof fiatTransactions.$inferSelect;
export type NewFiatTransaction = typeof fiatTransactions.$inferInsert;

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type BudgetWallet = typeof budgetWallets.$inferSelect;

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export type UserPortfolio = typeof userPortfolios.$inferSelect;
export type NewUserPortfolio = typeof userPortfolios.$inferInsert;

export type AssetTransaction = typeof assetTransactions.$inferSelect;
export type NewAssetTransaction = typeof assetTransactions.$inferInsert;

export type AssetValuation = typeof assetValuations.$inferSelect;
export type NewAssetValuation = typeof assetValuations.$inferInsert;
