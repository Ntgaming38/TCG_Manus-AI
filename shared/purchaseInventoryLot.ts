export type PurchaseInventoryLotCandidate = {
  id: number;
  type: string;
  buyPrice?: number | string | null;
};

/**
 * All product prices are persisted as whole-JPY unit prices. Rounding here keeps
 * the inventory grouping key identical to the product and purchase records.
 */
export function getPurchaseUnitPrice(totalPrice: number, quantity: number): number {
  if (!Number.isFinite(totalPrice) || !Number.isFinite(quantity) || quantity <= 0) return 0;
  return Math.round(totalPrice / quantity);
}

/** A product lot can be merged only when its type and per-item buy price match. */
export function findMatchingPurchaseInventoryLot<T extends PurchaseInventoryLotCandidate>(
  lots: T[],
  productType: string,
  unitPrice: number,
): T | undefined {
  return lots.find((lot) => lot.type === productType && Number(lot.buyPrice || 0) === unitPrice);
}
