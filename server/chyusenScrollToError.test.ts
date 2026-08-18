import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const chyusenPage = readFileSync(new URL("../client/src/pages/Chyusen.tsx", import.meta.url), "utf8");

describe("tự cuộn đến trường lỗi Chyusen", () => {
  it("tìm trường lỗi đầu tiên, cuộn mượt và focus vào trường này", () => {
    expect(chyusenPage).toContain('["productName", "applicationEnd", "resultDate", "customShopName", "title"]');
    expect(chyusenPage).toContain("scrollIntoView({ behavior: \"smooth\", block: \"center\" })");
    expect(chyusenPage).toContain("target?.focus({ preventScroll: true })");
    expect(chyusenPage).toContain('data-chyusen-field={fieldKey}');
  });
});
