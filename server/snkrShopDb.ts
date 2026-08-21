import { and, asc, desc, eq, gte } from "drizzle-orm";
import { activityLogs, snkrShopItems, snkrShopPriceHistory } from "../drizzle/schema";
import { normalizeCardRank } from "../shared/cardRank";
import { getDb } from "./db";
import { fetchSnkrdunkPrice, fetchSnkrdunkProductMetadata, isValidSnkrdunkUrl } from "./snkrdunk";
import { processMarketplaceManualSyncBatch } from "./marketplaceManualSyncBatch";

export type SnkrShopProductType = "card" | "box" | "pack";

type CreateSnkrShopItemInput = {
  name?: string;
  productType: SnkrShopProductType;
  cardRank?: string;
  sourceUrl: string;
};

type UpdateSnkrShopItemInput = Partial<CreateSnkrShopItemInput>;

async function getOwnedItem(itemId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [item] = await db.select().from(snkrShopItems)
    .where(and(eq(snkrShopItems.id, itemId), eq(snkrShopItems.userId, userId)))
    .limit(1);
  if (!item) throw new Error("Sản phẩm Shop SNKR không tồn tại hoặc không thuộc quyền truy cập của bạn.");
  return { db, item };
}

function validateSourceUrl(sourceUrl: string) {
  if (!isValidSnkrdunkUrl(sourceUrl)) {
    throw new Error("Link phải là trang sản phẩm https://snkrdunk.com, không phải link danh mục.");
  }
  return sourceUrl;
}

function getCardRank(productType: SnkrShopProductType, cardRank?: string | null) {
  return productType === "card" ? normalizeCardRank(cardRank) : null;
}

/** Returns watchlist data only. This never reads or mutates inventory transaction tables. */
export async function listSnkrShopItems(userId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(snkrShopItems)
    .where(eq(snkrShopItems.userId, userId))
    .orderBy(desc(snkrShopItems.lastSyncedAt), desc(snkrShopItems.updatedAt), desc(snkrShopItems.id));
  const keyword = search?.trim().toLocaleLowerCase();
  return keyword ? items.filter((item) => item.name.toLocaleLowerCase().includes(keyword)) : items;
}

export async function createSnkrShopItem(userId: number, input: CreateSnkrShopItemInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const sourceUrl = validateSourceUrl(input.sourceUrl.trim());
  const [existing] = await db.select({ id: snkrShopItems.id }).from(snkrShopItems)
    .where(and(eq(snkrShopItems.userId, userId), eq(snkrShopItems.sourceUrl, sourceUrl)))
    .limit(1);
  if (existing) throw new Error("URL SNKRDUNK này đã có trong Shop SNKR của bạn.");
  const cardRank = getCardRank(input.productType, input.cardRank);
  let metadata: { title: string | null; imageUrl: string | null } = { title: null, imageUrl: null };
  try {
    metadata = await fetchSnkrdunkProductMetadata(sourceUrl);
  } catch {
    // Metadata is a convenience only; a public price sync can still be attempted after creation.
  }
  const name = input.name?.trim() || metadata.title || "Sản phẩm SNKRDUNK";
  await db.insert(snkrShopItems).values({ userId, name, productType: input.productType, cardRank, sourceUrl, sourceTitle: metadata.title, imageUrl: metadata.imageUrl });
  const [item] = await db.select().from(snkrShopItems)
    .where(and(eq(snkrShopItems.userId, userId), eq(snkrShopItems.sourceUrl, sourceUrl)))
    .limit(1);
  if (!item) throw new Error("Không thể tạo sản phẩm theo dõi Shop SNKR.");
  await db.insert(activityLogs).values({ userId, action: "snkr_shop_item_created", description: `Thêm theo dõi Shop SNKR: ${name}`, entityType: "snkr_shop_item", entityId: item.id });
  return item;
}

export async function updateSnkrShopItem(itemId: number, userId: number, input: UpdateSnkrShopItemInput) {
  const { db, item } = await getOwnedItem(itemId, userId);
  const productType = input.productType ?? (item.productType as SnkrShopProductType);
  const nextUrl = input.sourceUrl === undefined ? item.sourceUrl : validateSourceUrl(input.sourceUrl.trim());
  const sourceChanged = nextUrl !== item.sourceUrl;
  if (sourceChanged) {
    const [duplicate] = await db.select({ id: snkrShopItems.id }).from(snkrShopItems)
      .where(and(eq(snkrShopItems.userId, userId), eq(snkrShopItems.sourceUrl, nextUrl)))
      .limit(1);
    if (duplicate) throw new Error("URL SNKRDUNK này đã có trong Shop SNKR của bạn.");
  }
  let metadata: { title: string | null; imageUrl: string | null } = { title: item.sourceTitle, imageUrl: item.imageUrl };
  if (sourceChanged) {
    try { metadata = await fetchSnkrdunkProductMetadata(nextUrl); } catch { /* URL vẫn được cập nhật để người dùng thử đồng bộ giá sau. */ }
  }
  const name = input.name === undefined ? (sourceChanged ? metadata.title || item.name : item.name) : input.name.trim() || metadata.title || item.name;
  const cardRank = getCardRank(productType, input.cardRank ?? item.cardRank);
  await db.update(snkrShopItems).set({
    name,
    productType,
    cardRank,
    sourceUrl: nextUrl,
    sourceTitle: sourceChanged ? metadata.title : item.sourceTitle,
    imageUrl: sourceChanged ? metadata.imageUrl : item.imageUrl,
    currentPrice: sourceChanged ? "0" : item.currentPrice,
    lastSyncedAt: sourceChanged ? null : item.lastSyncedAt,
    lastSyncError: sourceChanged ? null : item.lastSyncError,
  })
    .where(and(eq(snkrShopItems.id, itemId), eq(snkrShopItems.userId, userId)));
  if (sourceChanged) await db.delete(snkrShopPriceHistory).where(eq(snkrShopPriceHistory.itemId, itemId));
  const [updated] = await db.select().from(snkrShopItems).where(eq(snkrShopItems.id, itemId)).limit(1);
  return updated;
}

export async function deleteSnkrShopItem(itemId: number, userId: number) {
  const { db, item } = await getOwnedItem(itemId, userId);
  await db.delete(snkrShopPriceHistory).where(eq(snkrShopPriceHistory.itemId, itemId));
  await db.delete(snkrShopItems).where(and(eq(snkrShopItems.id, itemId), eq(snkrShopItems.userId, userId)));
  await db.insert(activityLogs).values({ userId, action: "snkr_shop_item_deleted", description: `Xóa theo dõi Shop SNKR: ${item.name}`, entityType: "snkr_shop_item", entityId: itemId });
  return { success: true } as const;
}

export async function syncSnkrShopItem(itemId: number, userId: number) {
  const { db, item } = await getOwnedItem(itemId, userId);
  const productType = item.productType as SnkrShopProductType;
  const cardRank = getCardRank(productType, item.cardRank);
  try {
    const result = await fetchSnkrdunkPrice(item.sourceUrl, productType, cardRank ?? "A");
    const syncedAt = new Date();
    let metadata: { title: string | null; imageUrl: string | null } = { title: item.sourceTitle, imageUrl: item.imageUrl };
    if (!metadata.title || !metadata.imageUrl) {
      try { metadata = await fetchSnkrdunkProductMetadata(item.sourceUrl); } catch { /* Keep saved display metadata when the page is temporarily unavailable. */ }
    }
    await db.update(snkrShopItems).set({ currentPrice: String(result.price), lastSyncedAt: syncedAt, lastSyncError: null, sourceTitle: metadata.title, imageUrl: metadata.imageUrl })
      .where(and(eq(snkrShopItems.id, itemId), eq(snkrShopItems.userId, userId)));
    if (Number(item.currentPrice || 0) !== result.price) {
      await db.insert(snkrShopPriceHistory).values({ itemId, price: String(result.price), source: "snkrdunk" });
    }
    await db.insert(activityLogs).values({ userId, action: "snkr_shop_price_synced", description: `Cập nhật Shop SNKR: ${item.name} - ¥${result.price.toLocaleString("ja-JP")}`, entityType: "snkr_shop_item", entityId: itemId });
    return { itemId, name: metadata.title || item.name, currentPrice: result.price, lastSyncedAt: syncedAt, sourceUrl: item.sourceUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể đồng bộ URL SNKRDUNK này.";
    await db.update(snkrShopItems).set({ lastSyncError: message }).where(and(eq(snkrShopItems.id, itemId), eq(snkrShopItems.userId, userId)));
    throw error;
  }
}

/** Updates every private Shop SNKR watch item with bounded concurrency and isolated failures. */
export async function syncAllSnkrShopItems(userId: number) {
  const items = await listSnkrShopItems(userId);
  const outcomes = await processMarketplaceManualSyncBatch(items, async (item) => {
    await syncSnkrShopItem(item.id, userId);
  }, 3);
  const failures = outcomes.flatMap((outcome) => outcome.status === "rejected" ? [{ id: outcome.item.id, name: outcome.item.name, error: outcome.error instanceof Error ? outcome.error.message : "Không thể đồng bộ." }] : []);
  return { totalCount: items.length, syncedCount: outcomes.length - failures.length, failedCount: failures.length, failures };
}

export async function getSnkrShopPriceHistory(itemId: number, userId: number, days = 30) {
  const { db } = await getOwnedItem(itemId, userId);
  const safeDays = [7, 30, 90].includes(days) ? days : 30;
  const cutoff = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);
  return db.select({ id: snkrShopPriceHistory.id, price: snkrShopPriceHistory.price, source: snkrShopPriceHistory.source, createdAt: snkrShopPriceHistory.createdAt })
    .from(snkrShopPriceHistory)
    .where(and(eq(snkrShopPriceHistory.itemId, itemId), gte(snkrShopPriceHistory.createdAt, cutoff)))
    .orderBy(asc(snkrShopPriceHistory.createdAt), asc(snkrShopPriceHistory.id))
    .limit(180);
}
