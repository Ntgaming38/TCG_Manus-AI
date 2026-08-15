export const PRODUCT_TYPES = ["card", "box", "pack"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export function getAutoCreateProductType(activeType: string): ProductType | null {
  return PRODUCT_TYPES.includes(activeType as ProductType) ? activeType as ProductType : null;
}
