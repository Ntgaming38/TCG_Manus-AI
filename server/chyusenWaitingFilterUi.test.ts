import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("bộ lọc Chyusen chờ kết quả", () => {
  it("hiển thị một lựa chọn Chờ kết quả và dùng cùng quy tắc với chỉ số Tổng quan", () => {
    const source = readFileSync(join(process.cwd(), "client/src/pages/Chyusen.tsx"), "utf8");

    expect(source).toContain('<SelectItem value="waiting_result">Chờ kết quả</SelectItem>');
    expect(source).toContain('filter === "waiting_result" ? matchesDashboardChyusenFilter(entry, "dashboard_waiting")');
    expect(source).not.toContain('<SelectItem value="dashboard_waiting">Chờ kết quả (Dashboard)</SelectItem>');
  });
});
