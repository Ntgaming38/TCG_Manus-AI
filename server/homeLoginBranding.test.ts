import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");

describe("Login branding", () => {
  it("dùng ảnh nền người dùng cung cấp cho màn hình đăng nhập", () => {
    expect(home).toContain('/manus-storage/tcg-manager-login-background_ab4c32e6.png');
  });

  it("hiển thị TCG Manager với lớp hiệu ứng RGB dùng chung", () => {
    expect(home).toContain('className="tcg-logo-text');
    expect(home).toContain(">\n            TCG Manager\n          </h1>");
  });
});
