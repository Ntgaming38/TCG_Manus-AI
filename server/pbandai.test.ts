import { describe, expect, it } from "vitest";
import { isOfficialPBandaiPostUrl, isValidPBandaiUrl, parsePBandaiOfficialPost, parsePBandaiPage } from "./pbandai";

describe("P-Bandai Chyusen inspection", () => {
  it("accepts only HTTPS P-Bandai URLs", () => {
    expect(isValidPBandaiUrl("https://p-bandai.jp/item/item-1000255803/")).toBe(true);
    expect(isValidPBandaiUrl("https://shop.p-bandai.jp/item/123")).toBe(true);
    expect(isValidPBandaiUrl("https://x.com/p_bandai/status/2021860815645843873")).toBe(true);
    expect(isOfficialPBandaiPostUrl("https://x.com/p_bandai/status/2021860815645843873")).toBe(true);
    expect(isValidPBandaiUrl("https://x.com/not_official/status/2021860815645843873")).toBe(false);
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

  it("detects a lottery from a verified official P-Bandai X post", () => {
    const embed = `<blockquote><p>プレミアムバンダイ春祭り 魂ウェブ商店抽選販売について、現在は抽選応募可能です。</p></blockquote>`;
    const inspection = parsePBandaiOfficialPost(embed, "https://x.com/p_bandai/status/2021860815645843873", "プレミアムバンダイ 【公式】");
    expect(inspection.status).toBe("detected");
    expect(inspection.title).toContain("抽選販売");
  });

  it("rejects a post that does not identify P-Bandai as the author", () => {
    const inspection = parsePBandaiOfficialPost("<p>抽選販売</p>", "https://x.com/p_bandai/status/1", "Không rõ nguồn");
    expect(inspection.status).toBe("unavailable");
  });
});
