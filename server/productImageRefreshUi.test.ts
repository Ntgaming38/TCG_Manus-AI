import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("Làm mới ảnh sản phẩm từ SNKRDUNK", () => {
  const dbSource = readFileSync(join(root, "server/db.ts"), "utf8");
  const routerSource = readFileSync(join(root, "server/routers.ts"), "utf8");
  const productsPage = readFileSync(join(root, "client/src/pages/Products.tsx"), "utf8");

  it("xác thực quyền, link nguồn và bảo toàn ảnh storage nền trắng", () => {
    expect(dbSource).toContain("export async function refreshProductImageFromSnkrdunk");
    expect(dbSource).toContain('product.userId !== userId');
    expect(dbSource).toContain("product.snkrdunkUrl");
    expect(dbSource).toContain('product.image?.startsWith("/manus-storage/")');
    expect(dbSource).toContain('action: "snkrdunk_image_refreshed"');
  });

  it("đăng ký procedure riêng, không gọi đồng bộ giá", () => {
    expect(routerSource).toContain("refreshImageFromSnkrdunk: protectedProcedure");
    expect(routerSource).toContain("db.refreshProductImageFromSnkrdunk(input.id, ctx.user.id)");
  });

  it("hiển thị loading, vùng thông báo live và trạng thái thành công/lỗi", () => {
    expect(productsPage).toContain("Đang kiểm tra SNKRDUNK và làm mới ảnh sản phẩm");
    expect(productsPage).toContain('role="status"');
    expect(productsPage).toContain("aria-busy");
    expect(productsPage).toContain("Làm mới ảnh từ SNKR");
    expect(productsPage).toContain("Đang làm mới ảnh…");
    expect(productsPage).toContain("Làm mới ảnh thất bại:");
    expect(productsPage).toContain("CheckCircle2");
    expect(productsPage).toContain("CircleAlert");
  });
});
