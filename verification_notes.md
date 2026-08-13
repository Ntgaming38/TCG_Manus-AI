# Xác minh cài đặt Chyusen và Marketplace

Ngày xác minh: 13/08/2026

- `pnpm check`, `pnpm test` và `pnpm build` hoàn tất thành công; bộ kiểm thử có 56 ca, bao gồm hai ca cho thao tác kiểm tra nguồn tức thì ở trạng thái thành công và lỗi truy cập.
- Trang `/cai-dat` được xác minh ở desktop 1280×720: từng nguồn hiển thị trạng thái, thời điểm kiểm tra gần nhất, lỗi gần nhất nếu có, cùng các nút **Kiểm tra ngay**, **Lưu** và **Xóa**. Thẻ Marketplace hiển thị công tắc auto-sync, batch size và trạng thái lần chạy gần nhất.
- Trang `/cai-dat` được xác minh ở mobile 375×812: các trường, badge trạng thái và nút hành động xếp theo chiều dọc, vẫn giữ được khả năng thao tác.

## Ưu tiên Đồng bộ giá Marketplace

Ngày xác minh: 13/08/2026

- Thẻ **Đồng bộ giá Marketplace** hiện nằm ngay dưới tiêu đề Cài đặt, trước Nhắc hạn và danh sách Nguồn theo dõi, nên không bị đẩy xuống khi danh sách nguồn dài.
- Đã xác minh thứ tự mới ở desktop 1280×720 và mobile 375×812; các nút, công tắc và trường cấu hình vẫn hiển thị đầy đủ.
- `pnpm check` thành công và toàn bộ 62 Vitest tests đều đạt.

## Quản lý nguồn thu gọn, lọc lỗi và đồng bộ theo yêu cầu

Ngày xác minh: 13/08/2026

- Trang Cài đặt hiện có nút **Thu gọn/Mở rộng** danh sách nguồn theo dõi và bộ lọc **Nguồn lỗi**, kèm số lượng nguồn không truy cập được.
- Nút **Đồng bộ ngay** trên thẻ Marketplace sử dụng luồng đồng bộ thủ công hiện hữu, hiển thị trạng thái đang chạy và thông báo tổng hợp sau khi hoàn tất.
- Đã xác minh desktop 1280×720 và mobile 375×812; tất cả điều khiển mới hiển thị đầy đủ. Typecheck, 62 Vitest tests và production build thành công.
