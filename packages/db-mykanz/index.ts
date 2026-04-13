/**
 * @woilaa/db-mykanz
 *
 * Package database untuk aplikasi Mykanz (Finance Tracker).
 * Berisi schema Drizzle, queries per domain, dan akses ke DB client.
 *
 * Usage:
 *   import { walletQueries, transactionQueries } from '@woilaa/db-mykanz'
 *   import { db } from '@woilaa/db-mykanz'
 *   import { wallets, fiatTransactions } from '@woilaa/db-mykanz/schema'
 */

// ==========================================
// SCHEMA EXPORTS
// ==========================================

export {
  // Enums
  walletTypeEnum,
  fiatTxTypeEnum,
  categoryTypeEnum,
  assetTypeEnum,
  assetTxTypeEnum,
  valuationSourceEnum,

  // Tables
  wallets,
  categories,
  fiatTransactions,
  budgets,
  budgetCategories,
  budgetWallets,
  goals,
  assets,
  userPortfolios,
  assetTransactions,
  assetValuations,

  // TypeScript Types — Select
  type Wallet,
  type Category,
  type FiatTransaction,
  type Budget,
  type BudgetCategory,
  type BudgetWallet,
  type Goal,
  type Asset,
  type UserPortfolio,
  type AssetTransaction,
  type AssetValuation,

  // TypeScript Types — Insert
  type NewWallet,
  type NewCategory,
  type NewFiatTransaction,
  type NewBudget,
  type NewGoal,
  type NewAsset,
  type NewUserPortfolio,
  type NewAssetTransaction,
  type NewAssetValuation,
} from "./schema/schema";

// ==========================================
// QUERY EXPORTS — WALLETS
// ==========================================

export {
  createWallet,
  getWalletsByUserId,
  getWalletById,
  getWalletsWithBalance,
  updateWallet,
  deleteWallet,
  validateWalletOwnership,
  validateTransferWallets,
} from "./queries/wallets";

// ==========================================
// QUERY EXPORTS — CATEGORIES
// ==========================================

export {
  SEED_CATEGORIES,
  seedCategories,
  createCategory,
  getCategoriesByUserId,
  getCategoriesByType,
  getCategoryById,
  updateCategory,
  deleteCategory,
  validateCategoryAccess,
  validateCategoryType,
} from "./queries/categories";

// ==========================================
// QUERY EXPORTS — TRANSACTIONS
// ==========================================

export {
  // Fiat Transactions
  createFiatTransaction,
  createTransferTransaction,
  getFiatTransactions,
  getFiatTransactionById,
  deleteFiatTransaction,

  // Asset Transactions
  createBuyAssetTransaction,
  createSellAssetTransaction,
  createInitialAssetBalance,
  getAssetTransactionsByPortfolio,
} from "./queries/transactions";

// ==========================================
// QUERY EXPORTS — BUDGETS
// ==========================================

export {
  createBudget,
  getBudgetsByUserId,
  getActiveBudgets,
  getBudgetById,
  getBudgetProgress,
  updateBudget,
  updateBudgetCategories,
  updateBudgetWallets,
  deleteBudget,
} from "./queries/budgets";

// ==========================================
// QUERY EXPORTS — ASSETS & VALUATIONS
// ==========================================

export {
  getGlobalAssets,
  getUserAssets,
  getAvailableAssets,
  getAssetById,
  createCustomAsset,
  updateCustomAsset,
  getOrCreatePortfolio,
  getActivePortfolios,
  getPortfolioWithDetails,
  getPortfolioById,
  upsertAssetValuation,
  getLatestAssetPrice,
  getAssetPriceHistory,
  batchUpsertAssetValuations,
} from "./queries/assets";

// ==========================================
// QUERY EXPORTS — GOALS
// ==========================================

export {
  createGoal,
  getGoalsByUserId,
  getGoalById,
  getGoalsWithProgress,
  getGoalsNearDeadline,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
} from "./queries/goals";

// ==========================================
// QUERY EXPORTS — PORTFOLIOS
// ==========================================

export {
  getPortfolioSummary,
  getPortfolioAllocation,
  getPortfolioDetail,
  getRealizedPnl,
  closePortfolio,
} from "./queries/portfolios";

// ==========================================
// DATABASE CLIENT
// ==========================================

export { db } from "./client";
