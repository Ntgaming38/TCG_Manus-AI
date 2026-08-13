import { describe, expect, it } from "vitest";
import { CARD_RARITY_OPTIONS } from "../shared/cardRarity";

describe("CARD_RARITY_OPTIONS", () => {
  it("có MUR và không còn UR trong danh sách lựa chọn mới", () => {
    const values = CARD_RARITY_OPTIONS.map((option) => option.value);

    expect(values).toContain("MUR");
    expect(values).not.toContain("UR");
  });
});
