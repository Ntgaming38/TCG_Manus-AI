import { bigint, boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  language: varchar("language", { length: 10 }).default("vi"),
  currency: varchar("currency", { length: 10 }).default("JPY"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products - central table for all items (Card, Box, Pack)
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  series: varchar("series", { length: 100 }).default("Pokemon"),
  setName: varchar("setName", { length: 255 }),
  type: mysqlEnum("type", ["card", "box", "pack"]).notNull(),
  image: text("image"),
  description: text("description"),
  // Card-specific fields
  cardNumber: varchar("cardNumber", { length: 50 }),
  language: varchar("language", { length: 20 }).default("Japanese"),
  rarity: varchar("rarity", { length: 50 }),
  condition: varchar("condition", { length: 50 }).default("New"),
  psaGrade: varchar("psaGrade", { length: 20 }),
  // Box-specific fields
  releaseDate: varchar("releaseDate", { length: 20 }),
  // Common fields
  quantity: int("quantity").default(0).notNull(),
  damagedQuantity: int("damagedQuantity").default(0).notNull(),
  damageNote: text("damageNote"),
  buyPrice: decimal("buyPrice", { precision: 12, scale: 2 }).default("0"),
  marketPrice: decimal("marketPrice", { precision: 12, scale: 2 }).default("0"),
  snkrdunkUrl: text("snkrdunkUrl"),
  snkrdunkLastSyncedAt: timestamp("snkrdunkLastSyncedAt"),
  sellPrice: decimal("sellPrice", { precision: 12, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["in_stock", "sold", "reserved", "traded", "damaged"]).default("in_stock").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Purchases - buy transaction history
 */
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  shop: varchar("shop", { length: 255 }),
  purchaseType: mysqlEnum("purchaseType", ["mua_le", "coc_5", "coc_10", "coc_30"]).default("mua_le"),
  quantity: int("quantity").notNull().default(1),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  image: text("image"),
  status: mysqlEnum("status", ["paid", "received", "pending", "cancelled"]).default("received"),
  purchaseDate: timestamp("purchaseDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/**
 * Sales - sell transaction history
 */
export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull().default(1),
  salePrice: decimal("salePrice", { precision: 12, scale: 2 }).notNull(),
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).notNull(),
  platform: mysqlEnum("platform", ["snkrdunk", "mercari", "yahoo", "shop", "offline", "other"]).default("snkrdunk"),
  fee: decimal("fee", { precision: 12, scale: 2 }).default("0"),
  shippingFee: decimal("shippingFee", { precision: 12, scale: 2 }).default("0"),
  otherCost: decimal("otherCost", { precision: 12, scale: 2 }).default("0"),
  profit: decimal("profit", { precision: 12, scale: 2 }).default("0"),
  note: text("note"),
  image: text("image"),
  saleDate: timestamp("saleDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

/**
 * Price History - track price changes over time
 */
export const priceHistory = mysqlTable("price_history", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  oldPrice: decimal("oldPrice", { precision: 12, scale: 2 }),
  newPrice: decimal("newPrice", { precision: 12, scale: 2 }).notNull(),
  source: varchar("source", { length: 100 }).default("manual"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PriceHistory = typeof priceHistory.$inferSelect;

/**
 * Shops - store/shop list for purchases
 */
export const shops = mysqlTable("shops", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Shop = typeof shops.$inferSelect;
export type InsertShop = typeof shops.$inferInsert;

/**
 * Activity Logs - track all user actions
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description"),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;

/**
 * Chyusen - lottery/draw opportunity tracker
 */
export const chyusenEntries = mysqlTable("chyusen_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  productName: varchar("productName", { length: 255 }),
  sourceName: varchar("sourceName", { length: 255 }),
  sourceUrl: text("sourceUrl"),
  registrationStartAt: timestamp("registrationStartAt"),
  registrationDeadline: timestamp("registrationDeadline"),
  drawAt: timestamp("drawAt"),
  resultStatus: mysqlEnum("resultStatus", ["pending", "won", "lost", "not_entered", "cancelled"]).default("pending").notNull(),
  isRegistered: boolean("isRegistered").default(false).notNull(),
  notes: text("notes"),
  sourceId: int("sourceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChyusenEntry = typeof chyusenEntries.$inferSelect;
export type InsertChyusenEntry = typeof chyusenEntries.$inferInsert;

/** Public Chyusen links monitored on behalf of one user. */
export const chyusenSources = mysqlTable("chyusen_sources", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  sourceLabel: varchar("sourceLabel", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastStatus: mysqlEnum("lastStatus", ["monitoring", "detected", "unavailable", "error"]).default("monitoring").notNull(),
  lastError: text("lastError"),
  lastContentHash: varchar("lastContentHash", { length: 128 }),
  lastDetectedAt: timestamp("lastDetectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChyusenSource = typeof chyusenSources.$inferSelect;
export type InsertChyusenSource = typeof chyusenSources.$inferInsert;

/** In-app notices created when an active public link gains a Chyusen program. */
export const chyusenNotifications = mysqlTable("chyusen_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sourceId: int("sourceId"),
  chyusenEntryId: int("chyusenEntryId"),
  kind: mysqlEnum("kind", ["new_chyusen", "source_error"]).default("new_chyusen").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChyusenNotification = typeof chyusenNotifications.$inferSelect;
