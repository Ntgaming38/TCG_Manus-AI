import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("theo dõi kiểm tra kết quả Chyusen", () => {
  it("hiển thị đếm ngày công bố và thao tác đã kiểm tra kết quả", () => {
    const source = readFileSync(join(process.cwd(), "client/src/pages/Chyusen.tsx"), "utf8");

    expect(source).toContain("formatChyusenResultCountdown(entry.resultDate)");
    expect(source).toContain("Đã kiểm tra kết quả");
    expect(source).toContain("markResultChecked.mutate({ id: entry.id })");
  });
});
