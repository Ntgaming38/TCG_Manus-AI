import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getDb: vi.fn(),
  serializeActivityChange: vi.fn(() => ({})),
}));

import { getDb } from "./db";
import { listChyusenShopSuggestions, saveChyusenShopSuggestion } from "./chyusenDb";

describe("gợi ý cửa hàng Chyusen theo tài khoản", () => {
  beforeEach(() => vi.clearAllMocks());

  it("chỉ trả về cửa hàng của tài khoản hiện tại theo thứ tự tên", async () => {
    vi.mocked(getDb).mockResolvedValue({
      select: () => ({ from: () => ({ where: vi.fn().mockResolvedValue([{ id: 2, name: "Z Shop" }, { id: 1, name: "Bandai Hobby" }]) }) }),
    } as any);

    await expect(listChyusenShopSuggestions(7)).resolves.toEqual(["Bandai Hobby", "Z Shop"]);
  });

  it("chuẩn hóa tên mới trước khi lưu và ghi hoạt động", async () => {
    const firstValues = vi.fn().mockResolvedValue([{ insertId: 19 }]);
    const activityValues = vi.fn().mockResolvedValue([]);
    const insert = vi.fn()
      .mockReturnValueOnce({ values: firstValues })
      .mockReturnValueOnce({ values: activityValues });
    vi.mocked(getDb).mockResolvedValue({
      select: () => ({ from: () => ({ where: vi.fn().mockResolvedValue([]) }) }),
      insert,
    } as any);

    await expect(saveChyusenShopSuggestion(7, "  TCG   Tokyo  ")).resolves.toMatchObject({ id: 19, name: "TCG Tokyo", created: true });
    expect(firstValues).toHaveBeenCalledWith({ userId: 7, name: "TCG Tokyo" });
    expect(activityValues).toHaveBeenCalledTimes(1);
  });
});
