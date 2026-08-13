export type MarketplacePriceHistoryPoint = {
  id: number;
  oldPrice: string | number | null;
  newPrice: string | number;
  source: string | null;
  createdAt: Date | string;
};

export type MarketplacePriceTrend = "up" | "down" | "flat";

export function getMarketplacePriceTrend(history: MarketplacePriceHistoryPoint[]): MarketplacePriceTrend {
  if (history.length < 2) return "flat";
  const first = Number(history[0].newPrice) || 0;
  const latest = Number(history[history.length - 1].newPrice) || 0;
  if (latest > first) return "up";
  if (latest < first) return "down";
  return "flat";
}

export function getMarketplacePriceChange(history: MarketplacePriceHistoryPoint[]) {
  if (history.length < 2) return { amount: 0, percent: 0 };
  const first = Number(history[0].newPrice) || 0;
  const latest = Number(history[history.length - 1].newPrice) || 0;
  const amount = latest - first;
  return { amount, percent: first > 0 ? (amount / first) * 100 : 0 };
}

export function marketplacePriceSourceLabel(source: string | null) {
  if (source === "snkrdunk_auto") return "SNKRDUNK";
  if (source === "manual") return "Thủ công";
  return "Cập nhật giá";
}
