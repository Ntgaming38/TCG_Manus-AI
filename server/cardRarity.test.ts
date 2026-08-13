import { describe, expect, it } from "vitest";
import { CARD_RARITY_OPTIONS, normalizeCardRarity } from "../shared/cardRarity";

describe("CARD_RARITY_OPTIONS", () => {
  it("có MUR và không còn UR trong danh sách lựa chọn mới", () => {
    const values = CARD_RARITY_OPTIONS.map((option) => option.value);

    expect(values).toContain("MUR");
    expect(values).not.toContain("UR");
  });

  it("hiển thị Card UR cũ bằng nhãn MUR mới", () => {
    expect(normalizeCardRarity("UR")).toBe("MUR");
    expect(normalizeCardRarity("SAR")).toBe("SAR");
    expect(normalizeCardRarity(null)).toBe("");
  });
});
