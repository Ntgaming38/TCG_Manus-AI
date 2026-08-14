import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");

describe("Login branding", () => {
  it("dùng ảnh nền người dùng cung cấp cho màn hình đăng nhập", () => {
    expect(home).toContain('/manus-storage/tcg-manager-login-background_ab4c32e6.png');
  });

  it("hiển thị TCG Manager với lớp hiệu ứng RGB dùng chung", () => {
    expect(home).toContain('className="tcg-logo-text');
    expect(home).toMatch(/>\s+TCG Manager\s+<\/h1>/);
  });

  it("đặt logo gần ô phiên bản và dùng chuyển cảnh RGB khi bắt đầu", () => {
    expect(home).toContain('login-rgb-transition-overlay');
    expect(home).toContain('text-4xl sm:text-5xl md:text-6xl');
    expect(home).toContain('setTimeout(() => {');
    expect(home).toContain('}, 520);');
  });
});
