import { describe, expect, it } from "vitest";
import { isValidPBandaiUrl, parsePBandaiPage } from "./pbandai";

describe("P-Bandai Chyusen inspection", () => {
  it("accepts only HTTPS P-Bandai URLs", () => {
    expect(isValidPBandaiUrl("https://p-bandai.jp/item/item-1000255803/")).toBe(true);
    expect(isValidPBandaiUrl("https://shop.p-bandai.jp/item/123")).toBe(true);
    expect(isValidPBandaiUrl("https://evil-p-bandai.jp/item/123")).toBe(false);
    expect(isValidPBandaiUrl("http://p-bandai.jp/item/123")).toBe(false);
  });

  it("detects a public lottery page and preserves the public title", () => {
    const page = `<!doctype html><html><head><title>【抽選販売】ONE PIECEカードゲーム テスト</title></head><body><h1>抽選販売</h1><p>受付期間：2026年8月7日17:00〜2026年8月18日23:00</p></body></html>`;
    const inspection = parsePBandaiPage(page, "https://p-bandai.jp/item/item-test/");
    expect(inspection.status).toBe("detected");
    expect(inspection.title).toContain("ONE PIECEカードゲーム");
    expect(inspection.registrationStartAt?.toISOString()).toBe("2026-08-07T08:00:00.000Z");
    expect(inspection.registrationDeadline?.toISOString()).toBe("2026-08-18T14:00:00.000Z");
  });

  it("returns unavailable instead of inventing data after a regional redirect", () => {
    const page = "<title>Premium Bandai is International!</title><p>Premium Bandai is International!</p>";
    const inspection = parsePBandaiPage(page, "https://p-bandai.jp/item/item-test/");
    expect(inspection.status).toBe("unavailable");
    expect(inspection.error).toContain("trang quốc tế");
  });
});
