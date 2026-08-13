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

## Vùng chạm nút sidebar trên mobile

Ngày xác minh: 13/08/2026

- Nút mở sidebar ở góc trên bên trái được tăng lên 48×48 px, biểu tượng lớn hơn và có nền nhấn nhẹ để dễ nhận diện trên điện thoại.
- Đã xác minh ở viewport 375×812; nút không che tiêu đề trang hay chuông thông báo. Typecheck và 73 Vitest tests đều đạt.

## Vuốt mở và chuyển động sidebar

Ngày xác minh: 13/08/2026

- Sidebar mobile có thể mở bằng thao tác vuốt ngang từ trong dải 28 px ở mép trái, với khoảng vuốt tối thiểu 64 px; các thao tác cuộn dọc hoặc vuốt từ ngoài mép không kích hoạt sidebar.
- Hiệu ứng Sheet mở/đóng dùng thời lượng 250/200 ms, và tắt hiệu ứng khi thiết bị bật giảm chuyển động.
- Logic cử chỉ có 2 kiểm thử hồi quy; toàn bộ 75 Vitest tests, typecheck và production build đều thành công. Bố cục mobile 375×812 đã được xác minh.

## Nền xám than theo ảnh tham chiếu

Ngày xác minh: 13/08/2026

- Nền ứng dụng, thẻ, popover, input và viền đã chuyển sang bảng màu xám than đồng nhất theo ảnh tham chiếu; chữ chính/chữ phụ được đổi sang trắng-xám để giữ khả năng đọc.
- Đã xác minh desktop 1280×720 và mobile 375×812: logo, số liệu, nhãn đỏ/xanh và đường viền vẫn đủ tương phản trên nền mới.
- Typecheck và 76 Vitest tests đều đạt.

## Tinh gọn chú giải Lịch sử

Ngày xác minh: 13/08/2026

- Đã loại bỏ hoàn toàn dòng **Màu chi tiết: Xóa / Sửa / Mua / Bán** phía trên bộ lọc Lịch sử.
- Nhãn màu nằm ngay cạnh từng hoạt động được giữ nguyên, nên loại thao tác vẫn nhận biết trực tiếp mà không cần chú giải lặp lại.
- Đã xác minh desktop/mobile; typecheck và 76 Vitest tests đều đạt.
