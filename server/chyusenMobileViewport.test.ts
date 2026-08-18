import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Chyusen trên màn hình nhỏ", () => {
  it("khóa thu phóng và giữ cảnh báo tên sản phẩm trong chiều rộng thẻ", () => {
    const html = readFileSync(join(process.cwd(), "client/index.html"), "utf8");
    const page = readFileSync(join(process.cwd(), "client/src/pages/Chyusen.tsx"), "utf8");
    const router = readFileSync(join(process.cwd(), "server/routers.ts"), "utf8");

    expect(html).toContain("user-scalable=no");
    expect(html).toContain("maximum-scale=1");
    expect(page).toContain("w-full min-w-0 max-w-full");
    expect(page).toContain("min-w-0 flex-1 truncate text-left");
    expect(router).toContain("sourceContentHash: z.string().trim().max(64).nullable().optional()");
  });
});
