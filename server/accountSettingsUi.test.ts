import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("account settings UI", () => {
  it("cho phép đổi nickname và ảnh đại diện từ khu vực tài khoản", () => {
    const source = readFileSync(join(root, "client/src/components/AccountSettingsDialog.tsx"), "utf8");
    const sidebar = readFileSync(join(root, "client/src/components/DashboardLayout.tsx"), "utf8");
    expect(source).toContain("Tên hiển thị / Nickname");
    expect(source).toContain("auth.uploadAvatar");
    expect(source).toContain("auth.updateProfile");
    expect(sidebar).toContain("Cài đặt tài khoản");
    expect(sidebar).toContain("user?.nickname || user?.name");
  });

  it("nêu rõ mật khẩu được quản lý bởi nhà cung cấp OAuth", () => {
    const source = readFileSync(join(root, "client/src/components/AccountSettingsDialog.tsx"), "utf8");
    expect(source).toContain("TCG Manager không lưu mật khẩu riêng");
    expect(source).toContain("Quản lý hoặc đổi mật khẩu");
  });
});
