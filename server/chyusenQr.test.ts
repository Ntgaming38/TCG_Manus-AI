import { describe, expect, it } from "vitest";
import { normalizeChyusenQrUrl } from "../shared/chyusenQr";

describe("Chyusen QR URL", () => {
  it("chỉ nhận liên kết http/https để người dùng xác nhận", () => {
    expect(normalizeChyusenQrUrl(" https://t.livepocket.jp/e/abc ")).toBe("https://t.livepocket.jp/e/abc");
    expect(normalizeChyusenQrUrl("http://example.jp/lottery")).toBe("http://example.jp/lottery");
    expect(normalizeChyusenQrUrl("line://lottery")).toBeNull();
    expect(normalizeChyusenQrUrl("không phải link")).toBeNull();
  });
});
