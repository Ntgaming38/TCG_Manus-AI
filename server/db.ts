import { eq, and, like, sql, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, purchases, sales, priceHistory, shops, activityLogs } from "../drizzle/schema";
import type { InsertProduct, InsertPurchase, InsertSale, InsertShop } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ========== PRODUCTS ==========

export async function listProducts(userId: number, opts?: { type?: string; status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(products.userId, userId)];
  if (opts?.type) conditions.push(eq(products.type, opts.type as any));
  if (opts?.status) conditions.push(eq(products.status, opts.status as any));
  if (opts?.search) conditions.push(like(products.name, `%${opts.search}%`));
  return db.select().from(products).where(and(...conditions)).orderBy(desc(products.updatedAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  await db.insert(activityLogs).values({
    userId: data.userId,
    action: "product_created",
    description: `Thêm sản phẩm: ${data.name} (${data.type})`,
    entityType: "product",
    entityId: result[0].insertId,
  });
  return { id: result[0].insertId };
}

export async function updateProduct(id: number, userId: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(and(eq(products.id, id), eq(products.userId, userId)));
}

export async function deleteProduct(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(and(eq(products.id, id), eq(products.userId, userId)));
}

export async function getProductSuggestions(userId: number, search: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: products.id,
    name: products.name,
    type: products.type,
    series: products.series,
    buyPrice: products.buyPrice,
    quantity: products.quantity,
  }).from(products).where(and(eq(products.userId, userId), like(products.name, `%${search}%`))).limit(20);
}

export async function getInStockProducts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.userId, userId), eq(products.status, "in_stock"))).orderBy(desc(products.updatedAt));
}

export async function updateMarketPrice(id: number, userId: number, marketPrice: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Get old price
  const product = await getProductById(id);
  if (product && product.userId === userId) {
    await db.update(products).set({ marketPrice }).where(and(eq(products.id, id), eq(products.userId, userId)));
    // Save price history
    await db.insert(priceHistory).values({
      productId: id,
      oldPrice: product.marketPrice,
      newPrice: marketPrice,
      source: "manual",
    });
  }
}

// ========== PURCHASES ==========

export async function listPurchases(userId: number, opts?: { search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: purchases.id,
    productId: purchases.productId,
    shop: purchases.shop,
    purchaseType: purchases.purchaseType,
    quantity: purchases.quantity,
    price: purchases.price,
    totalPrice: purchases.totalPrice,
    note: purchases.note,
    status: purchases.status,
    purchaseDate: purchases.purchaseDate,
    createdAt: purchases.createdAt,
    productName: products.name,
    productType: products.type,
  }).from(purchases)
    .leftJoin(products, eq(purchases.productId, products.id))
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.purchaseDate));

  if (opts?.search) {
    return result.filter((r: any) => r.productName?.toLowerCase().includes(opts.search!.toLowerCase()));
  }
  return result;
}

export async function createPurchase(userId: number, data: {
  productName: string; productType: string; series?: string; shop?: string;
  purchaseType?: string; quantity: number; price: number; note?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if product exists or create new one
  let productId: number;
  const existingProducts = await db.select().from(products)
    .where(and(eq(products.userId, userId), eq(products.name, data.productName), eq(products.type, data.productType as any)))
    .limit(1);

  if (existingProducts.length > 0) {
    productId = existingProducts[0].id;
    // Update quantity and buy price
    const currentQty = existingProducts[0].quantity || 0;
    const newQty = currentQty + data.quantity;
    await db.update(products).set({
      quantity: newQty,
      buyPrice: String(data.price),
    }).where(eq(products.id, productId));
  } else {
    const result = await db.insert(products).values({
      userId,
      name: data.productName,
      type: data.productType as any,
      series: data.series || "Pokemon",
      quantity: data.quantity,
      buyPrice: String(data.price),
      status: "in_stock",
    });
    productId = result[0].insertId;
  }

  // Create purchase record
  const totalPrice = data.quantity * data.price;
  await db.insert(purchases).values({
    userId,
    productId,
    shop: data.shop || null,
    purchaseType: (data.purchaseType as any) || "mua_le",
    quantity: data.quantity,
    price: String(data.price),
    totalPrice: String(totalPrice),
    note: data.note || null,
    status: "received",
  });

  await db.insert(activityLogs).values({
    userId,
    action: "purchase_created",
    description: `Mua ${data.quantity}x ${data.productName} - ¥${totalPrice.toLocaleString()}`,
    entityType: "purchase",
    entityId: productId,
  });

  return { productId };
}

// ========== SALES ==========

export async function listSales(userId: number, opts?: { search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: sales.id,
    productId: sales.productId,
    quantity: sales.quantity,
    salePrice: sales.salePrice,
    totalRevenue: sales.totalRevenue,
    platform: sales.platform,
    fee: sales.fee,
    shippingFee: sales.shippingFee,
    otherCost: sales.otherCost,
    profit: sales.profit,
    note: sales.note,
    saleDate: sales.saleDate,
    createdAt: sales.createdAt,
    productName: products.name,
    productType: products.type,
  }).from(sales)
    .leftJoin(products, eq(sales.productId, products.id))
    .where(eq(sales.userId, userId))
    .orderBy(desc(sales.saleDate));

  if (opts?.search) {
    return result.filter((r: any) => r.productName?.toLowerCase().includes(opts.search!.toLowerCase()));
  }
  return result;
}

export async function createSale(userId: number, data: {
  productId: number; quantity: number; salePrice: number;
  platform?: string; fee?: number; shippingFee?: number; otherCost?: number; note?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get product info for profit calculation
  const product = await getProductById(data.productId);
  if (!product || product.userId !== userId) throw new Error("Product not found");
  if (product.quantity < data.quantity) throw new Error("Insufficient quantity");

  const totalRevenue = data.quantity * data.salePrice;
  const totalCost = (data.fee || 0) + (data.shippingFee || 0) + (data.otherCost || 0);
  const costBasis = Number(product.buyPrice) * data.quantity;
  const profit = totalRevenue - totalCost - costBasis;

  // Create sale record
  await db.insert(sales).values({
    userId,
    productId: data.productId,
    quantity: data.quantity,
    salePrice: String(data.salePrice),
    totalRevenue: String(totalRevenue),
    platform: (data.platform as any) || "snkrdunk",
    fee: String(data.fee || 0),
    shippingFee: String(data.shippingFee || 0),
    otherCost: String(data.otherCost || 0),
    profit: String(profit),
    note: data.note || null,
  });

  // Update product quantity
  const newQty = product.quantity - data.quantity;
  await db.update(products).set({
    quantity: newQty,
    status: newQty <= 0 ? "sold" : "in_stock",
  }).where(eq(products.id, data.productId));

  await db.insert(activityLogs).values({
    userId,
    action: "sale_created",
    description: `Bán ${data.quantity}x ${product.name} - Lợi nhuận: ¥${profit.toLocaleString()}`,
    entityType: "sale",
    entityId: data.productId,
  });

  return { profit };
}

// ========== DASHBOARD ==========

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return {
    totalCapital: 0, currentValue: 0, totalProfit: 0,
    totalInStock: 0, inStockCards: 0, inStockBoxes: 0, inStockPacks: 0,
    totalSold: 0, soldCards: 0, soldBoxes: 0, soldPacks: 0,
    chartData: [], recentActivities: [],
  };

  // Get all user products
  const userProducts = await db.select().from(products).where(eq(products.userId, userId));

  // In-stock products (quantity > 0 and status is in_stock)
  const inStockProducts = userProducts.filter(p => p.status === "in_stock" && (p.quantity || 0) > 0);
  const totalInStock = inStockProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const inStockCards = inStockProducts.filter(p => p.type === "card").reduce((sum, p) => sum + (p.quantity || 0), 0);
  const inStockBoxes = inStockProducts.filter(p => p.type === "box").reduce((sum, p) => sum + (p.quantity || 0), 0);
  const inStockPacks = inStockProducts.filter(p => p.type === "pack").reduce((sum, p) => sum + (p.quantity || 0), 0);

  // Sold products
  const soldProducts = userProducts.filter(p => p.status === "sold");
  const totalSold = soldProducts.length;
  const soldCards = soldProducts.filter(p => p.type === "card").length;
  const soldBoxes = soldProducts.filter(p => p.type === "box").length;
  const soldPacks = soldProducts.filter(p => p.type === "pack").length;

  // Calculate totals
  let totalCapital = 0;
  let currentValue = 0;
  inStockProducts.forEach(p => {
    totalCapital += Number(p.buyPrice || 0) * (p.quantity || 0);
    currentValue += Number(p.marketPrice || p.buyPrice || 0) * (p.quantity || 0);
  });

  // Get total profit from sales
  const userSales = await db.select().from(sales).where(eq(sales.userId, userId));
  const totalProfit = userSales.reduce((sum, s) => sum + Number(s.profit || 0), 0);

  // Chart data - last 6 months
  const chartData: { month: string; revenue: number; profit: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = `T${d.getMonth() + 1}/${d.getFullYear()}`;
    const monthSales = userSales.filter(s => {
      const sd = new Date(s.saleDate);
      return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth();
    });
    const revenue = monthSales.reduce((sum, s) => sum + Number(s.totalRevenue || 0), 0);
    const profit = monthSales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
    chartData.push({ month: monthLabel, revenue, profit });
  }

  // Recent activities
  const recentActivities = await db.select().from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(10);

  return {
    totalCapital, currentValue, totalProfit,
    totalInStock, inStockCards, inStockBoxes, inStockPacks,
    totalSold, soldCards, soldBoxes, soldPacks,
    chartData, recentActivities,
  };
}

// ========== REPORTS ==========

export async function getReportsOverview(userId: number) {
  const db = await getDb();
  if (!db) return { totalBought: 0, totalSold: 0, totalProfit: 0, roi: 0, monthlyData: [], topProducts: [] };

  const userPurchases = await db.select().from(purchases).where(eq(purchases.userId, userId));
  const userSales = await db.select().from(sales).where(eq(sales.userId, userId));

  const totalBought = userPurchases.reduce((sum, p) => sum + Number(p.totalPrice || 0), 0);
  const totalSold = userSales.reduce((sum, s) => sum + Number(s.totalRevenue || 0), 0);
  const totalProfit = userSales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
  const roi = totalBought > 0 ? (totalProfit / totalBought) * 100 : 0;

  // Monthly profit data - last 12 months
  const monthlyData: { month: string; profit: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = `T${d.getMonth() + 1}/${d.getFullYear()}`;
    const monthSales = userSales.filter(s => {
      const sd = new Date(s.saleDate);
      return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth();
    });
    const profit = monthSales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
    monthlyData.push({ month: monthLabel, profit });
  }

  // Top products by profit
  const productProfitMap = new Map<number, { name: string; type: string; profit: number }>();
  for (const s of userSales) {
    const existing = productProfitMap.get(s.productId);
    if (existing) {
      existing.profit += Number(s.profit || 0);
    } else {
      productProfitMap.set(s.productId, { name: '', type: '', profit: Number(s.profit || 0) });
    }
  }

  // Get product names
  const productIds = Array.from(productProfitMap.keys());
  if (productIds.length > 0) {
    const productList = await db.select({ id: products.id, name: products.name, type: products.type })
      .from(products).where(inArray(products.id, productIds));
    for (const p of productList) {
      const entry = productProfitMap.get(p.id);
      if (entry) { entry.name = p.name; entry.type = p.type; }
    }
  }

  const topProducts = Array.from(productProfitMap.values())
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  return { totalBought, totalSold, totalProfit, roi, monthlyData, topProducts };
}

// ========== SHOPS ==========

export async function listShops(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shops).where(eq(shops.userId, userId));
}

export async function createShop(data: InsertShop) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(shops).values(data);
}
