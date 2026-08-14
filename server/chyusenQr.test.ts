import { describe, expect, it } from "vitest";
import { detectChyusenShopFromQrUrl, normalizeChyusenQrUrl } from "../shared/chyusenQr";

describe("Chyusen QR URL", () => {
  it("chỉ nhận liên kết http/https để người dùng xác nhận", () => {
    expect(normalizeChyusenQrUrl(" https://t.livepocket.jp/e/abc ")).toBe("https://t.livepocket.jp/e/abc");
    expect(normalizeChyusenQrUrl("http://example.jp/lottery")).toBe("http://example.jp/lottery");
    expect(normalizeChyusenQrUrl("line://lottery")).toBeNull();
    expect(normalizeChyusenQrUrl("không phải link")).toBeNull();
  });

  it("nhận diện cửa hàng khi URL QR thuộc miền đáng tin cậy", () => {
    expect(detectChyusenShopFromQrUrl("https://www.joshinweb.jp/game/lottery")).toBe("Joshin");
    expect(detectChyusenShopFromQrUrl("https://p-bandai.jp/item/123")).toBe("Bandai Premium");
    expect(detectChyusenShopFromQrUrl("https://t.livepocket.jp/e/abc")).toBeNull();
  });
});
