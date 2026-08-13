export const MARKETPLACE_FILTERS = ["all", "synced", "pending", "unlinked"] as const;

export type MarketplaceFilter = typeof MARKETPLACE_FILTERS[number];
export type MarketplaceMetric = "total" | "synced" | "pending" | "unlinked";

export const marketplaceMetricFilter: Record<MarketplaceMetric, MarketplaceFilter> = {
  total: "all",
  synced: "synced",
  pending: "pending",
  unlinked: "unlinked",
};
