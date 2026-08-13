export const PRODUCT_LIST_COLUMN_OPTIONS = [
  { key: "quantity", label: "Số lượng" },
  { key: "buyPrice", label: "Giá mua" },
  { key: "marketPrice", label: "Giá thị trường" },
  { key: "profit", label: "Lợi nhuận" },
  { key: "series", label: "Series / Set" },
  { key: "rarity", label: "Độ hiếm" },
  { key: "status", label: "Trạng thái" },
] as const;

export type ProductListColumnKey = typeof PRODUCT_LIST_COLUMN_OPTIONS[number]["key"];
export const DEFAULT_PRODUCT_LIST_COLUMNS: ProductListColumnKey[] = ["quantity", "buyPrice", "marketPrice", "profit"];

function escapeCsvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function statusLabel(status: unknown) {
  return status === "in_stock" ? "Trong kho" : status === "sold" ? "Đã bán" : String(status ?? "");
}

export function buildProductsCsv(products: Array<Record<string, unknown>>, columns: ProductListColumnKey[]) {
  const selected = PRODUCT_LIST_COLUMN_OPTIONS.filter((column) => columns.includes(column.key));
  const headers = ["Tên", "Loại", ...selected.map((column) => column.label)];
  const rows = products.map((product) => {
    const buyPrice = Number(product.buyPrice || 0);
    const marketPrice = Number(product.marketPrice || 0);
    const values: Record<ProductListColumnKey, unknown> = {
      quantity: product.quantity,
      buyPrice,
      marketPrice,
      profit: marketPrice - buyPrice,
      series: [product.series, product.setName].filter(Boolean).join(" · "),
      rarity: product.rarity,
      status: statusLabel(product.status),
    };
    return [product.name, product.type, ...selected.map((column) => values[column.key])].map(escapeCsvCell).join(",");
  });
  return `\uFEFF${headers.map(escapeCsvCell).join(",")}\n${rows.join("\n")}`;
}
