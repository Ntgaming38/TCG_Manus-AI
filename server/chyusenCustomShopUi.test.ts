import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("cửa hàng tùy chỉnh trong Chyusen", () => {
  it("có luồng thêm cửa hàng và lưu lại trong gợi ý theo tài khoản", () => {
    const source = readFileSync(join(process.cwd(), "client/src/pages/Chyusen.tsx"), "utf8");

    expect(source).toContain("ADD_CUSTOM_CHYUSEN_SHOP_VALUE");
    expect(source).toContain("Cửa hàng bạn đã lưu");
    expect(source).toContain("trpc.chyusen.shopSuggestions.useQuery()");
    expect(source).toContain("saveShopSuggestion.mutate({ name: draft.customShopName })");
    expect(source).toContain("shopSuggestionDetails");
    expect(source).toContain("updateShopSuggestion.mutate");
    expect(source).toContain("deleteShopSuggestion.mutate");
    expect(source).toContain("Đã nhận diện từ URL");
    expect(source).toContain("Ghim cửa hàng yêu thích");
    expect(source).toContain("setShopSuggestionPinned.mutate");
    expect(source).toContain("<Pin className");
    expect(source).toContain("recentShops = []");
    expect(source).toContain("Cửa hàng dùng gần đây");
    expect(source).toContain("reorderPinnedShopSuggestions.mutate");
    expect(source).toContain("GripVertical");
  });
});
