export const CARD_RARITY_OPTIONS = [
  { value: "Common", label: "Common" },
  { value: "Uncommon", label: "Uncommon" },
  { value: "Rare", label: "Rare" },
  { value: "AR", label: "AR" },
  { value: "SR", label: "SR" },
  { value: "SAR", label: "SAR" },
  { value: "MUR", label: "MUR" },
  { value: "Promo", label: "Promo" },
] as const;

/** Giữ các Card UR cũ hiển thị theo nhãn MUR mới mà không buộc thay đổi dữ liệu lịch sử. */
export function normalizeCardRarity(rarity?: string | null): string {
  return rarity === "UR" ? "MUR" : (rarity || "");
}
