export const MARKETPLACE_FILTERS = ["all", "synced", "pending", "unlinked"] as const;

export type MarketplaceFilter = typeof MARKETPLACE_FILTERS[number];
export type MarketplaceMetric = "total" | "synced" | "pending" | "unlinked";

export const marketplaceMetricFilter: Record<MarketplaceMetric, MarketplaceFilter> = {
  total: "all",
  synced: "synced",
  pending: "pending",
  unlinked: "unlinked",
};

export const MARKETPLACE_FILTER_STORAGE_KEY = "tcg-marketplace-filter";

export function parseMarketplaceFilter(value: string | null | undefined): MarketplaceFilter {
  return MARKETPLACE_FILTERS.some((filter) => filter === value) ? value as MarketplaceFilter : "all";
}
