import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum, unique } from "drizzle-orm/pg-core";

// ============================================================
// ENUM
// ============================================================

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const appNameEnum = pgEnum("app_name", ["mykanz", "bitmove"]);

// ============================================================
// TABLE: users
// Core identity — email, username, name disimpan di sini
// dan dibawa sebagai JWT payload ke semua aplikasi
// ============================================================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  image: text("image"),
  role: roleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// TABLE: sessions
// Menyimpan refresh token per device/session
// Access token tidak disimpan di DB (stateless, hidup di memory)
// ============================================================

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  refreshToken: text("refresh_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// TABLE: app_access
// Kontrol akses user ke masing-masing aplikasi (Mykanz, Bitmove)
//
// CURRENT BEHAVIOR: auto-insert saat register (akses langsung ke semua app)
// TODO: Ubah menjadi approval flow oleh admin untuk kontrol akses granular
// ============================================================

export const appAccess = pgTable("app_access", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  appName: appNameEnum("app_name").notNull(),
  isGranted: boolean("is_granted").notNull().default(true),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),

  // TODO: Aktifkan field ini ketika approval flow by admin diimplementasikan
  // grantedBy: uuid("granted_by").references(() => users.id),
}, (table) => ({
  // Unique constraint — satu user hanya boleh punya satu row per app
  // Mencegah duplicate grant untuk kombinasi user_id + app_name yang sama
  uniqueUserApp: unique().on(table.userId, table.appName),
}));

// ============================================================
// TYPES — infer dari schema untuk dipakai di queries & API
// ============================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type AppAccess = typeof appAccess.$inferSelect;
export type NewAppAccess = typeof appAccess.$inferInsert;
