import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("chyusen notification read button", () => {
  it("dùng nền đỏ và chữ RGB cho nút Đã xem", () => {
    const source = readFileSync(join(process.cwd(), "client/src/pages/Chyusen.tsx"), "utf8");
    expect(source).toContain("bg-red-600");
    expect(source).toContain("hover:bg-red-700");
    expect(source).toContain('<span className="rgb-action-label">Đã xem</span>');
  });
});
