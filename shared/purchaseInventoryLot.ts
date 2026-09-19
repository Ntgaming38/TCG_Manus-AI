/**
 * Product records persist their buy price as a whole-JPY per-item amount.
 * Forms accept the purchase total for a single inventory lot, so this helper
 * derives the stored per-item price without ever merging lots together.
 */
export function getPurchaseUnitPrice(totalPrice: number, quantity: number): number {
  if (!Number.isFinite(totalPrice) || !Number.isFinite(quantity) || quantity <= 0) return 0;
  return Math.round(totalPrice / quantity);
}
