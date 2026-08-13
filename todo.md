# Pokémon Trading Manager - TODO

## Setup & Infrastructure
- [x] Database schema (products, cards, boxes, packs, inventory, purchases, sales, price_history, shops, images, activity_logs)
- [x] Global dark theme styling with Pokémon colors (yellow + dark blue)
- [x] Google Font setup for Pokémon-style text

## Authentication & Login
- [x] Custom login page with Pokémon artwork background
- [x] "POKÉMON" text in yellow Pokémon Go style
- [x] Login/Register flow with Manus OAuth

## Layout & Navigation
- [x] Custom DashboardLayout with dark sidebar
- [x] Sidebar menu items: Thống kê chi tiết, Card, Box, Pack, Kho Hàng, Mua Hàng, Bán Hàng, Marketplace, Báo Cáo
- [x] User avatar and dropdown logout in sidebar footer
- [x] Responsive mobile menu

## Thống kê chi tiết (Dashboard)
- [x] Summary cards: Tổng vốn, Giá trị hiện tại, Lợi nhuận, Tổng sản phẩm
- [x] Profit chart by month (BarChart)
- [x] Revenue chart by month (AreaChart)
- [x] Recent activities list

## Product Management (Card/Box/Pack)
- [x] Products listing page with search and filters
- [x] Add product form with type, series, set, quantity, prices
- [x] Card-specific fields (rarity, PSA grade, card number, condition, language)
- [x] Image upload for products (S3 upload via /api/upload-image)
- [x] Edit/Delete product inline (dropdown menu with edit dialog and delete confirm)

## Inventory (Kho Hàng)
- [x] Inventory listing with filters (type, status)
- [x] Auto-update on purchase/sale
- [x] Stock value calculation
- [x] Search and filter functionality

## Purchases (Mua Hàng)
- [x] Purchase list view
- [x] Add purchase form with autocomplete product name
- [x] Shop dropdown selection
- [x] Auto-fill price from previous purchases
- [x] Auto-update inventory on purchase

## Sales (Bán Hàng)
- [x] Sales list view
- [x] Create sale from inventory (select in-stock product)
- [x] Auto-calculate profit (sale price - buy price - fees)
- [x] Platform selection (SNKRDUNK, Mercari, Yahoo, etc.)
- [x] Fee calculation (platform fee, shipping, other)
- [x] Auto-update inventory on sale

## Marketplace (SNKRDUNK)
- [x] Product price tracking
- [x] Price comparison (buy vs market)
- [x] Manual price update with history

## Reports (Báo Cáo)
- [x] Overview report (total bought, sold, profit, ROI)
- [x] Monthly profit chart
- [x] Top profitable products
- [x] Export to CSV (client-side CSV export with BOM for Excel)

## Additional Features
- [x] Responsive design for mobile
- [x] Vitest tests (9 tests passing)
- [x] Product image display on cards
- [x] User profile in sidebar footer with logout
- [x] Hiệu ứng phát sáng cho chữ POKÉMON trên trang login
- [x] Hiệu ứng nhấp nháy nhẹ cho nút Bắt đầu
- [x] Hiệu ứng chuyển cảnh mượt mà khi bấm Bắt đầu
- [x] Điều chỉnh kích thước chữ POKÉMON to hơn và căn giữa hoàn hảo
- [x] Tạo skill tái sử dụng cho quy trình Pokemon login page
- [x] Thêm danh sách cửa hàng cố định: Geo, Joshin, Fruichi, Toysrus, Lawson, Seven Eleven, Family Mart, Khác
- [x] Fix lỗi Date object render trực tiếp trong Dashboard recentActivities
- [x] Thêm tính năng sắp xếp danh sách mua hàng theo ngày, giá, tên sản phẩm
- [x] Thêm tính năng sắp xếp danh sách bán hàng theo ngày, giá, tên sản phẩm
- [x] Đổi "Tổng sản phẩm" thành "Tổng sản phẩm trong kho" (chỉ đếm in_stock)
- [x] Thêm mục "Tổng sản phẩm đã bán" trên Dashboard
- [x] Sau khi bán, trừ số lượng tồn kho đúng
- [x] Thêm tổng kết cuối danh sách Mua Hàng (tổng tiền mua)
- [x] Thêm tổng kết cuối danh sách Bán Hàng (tổng tiền bán, tổng lợi nhuận)
- [x] Thêm trạng thái "damaged" (hỏng/rác) cho sản phẩm trong kho
- [x] Thêm tính năng chuyển số lượng từ bình thường sang hỏng/rác (tách sản phẩm)
- [x] Ghi chú lý do hỏng khi chuyển trạng thái
- [x] Cho phép bán sản phẩm hỏng riêng với giá thấp hơn
- [x] Hiển thị rõ ràng sản phẩm hỏng trong kho (badge/label khác biệt)
- [x] Fix bug: giá mua là tổng giá cho cả lô (2000 yên cho 10 pack = 200 yên/pack), không nhân thêm quantity
- [x] Cập nhật createSale để hỗ trợ bán từ damagedQuantity riêng (trừ damagedQuantity khi bán hàng hỏng)
- [x] Thêm UI trang Bán Hàng cho phép chọn bán hàng tốt hoặc hàng hỏng/rác

## Sửa/Xóa lịch sử mua hàng & bán hàng
- [x] Backend: updatePurchase (sửa giá, SL, shop, chi phí, ghi chú - hoàn trả kho cũ rồi trừ mới)
- [x] Backend: deletePurchase (chỉ xóa khi chưa có giao dịch bán, xóa product + cập nhật kho)
- [x] Backend: updateSale (hoàn trả SL cũ → trừ SL mới, tính lại profit)
- [x] Backend: deleteSale (hoàn trả SL về kho, xóa record)
- [x] UI Purchases: nút Sửa/Xóa cho mỗi giao dịch mua, dialog sửa, confirm xóa
- [x] UI Sales: nút Sửa/Xóa cho mỗi giao dịch bán, dialog sửa, confirm xóa
- [x] Đồng bộ toàn bộ: invalidate tRPC queries sau mỗi thao tác (Dashboard, Inventory, Reports)
- [x] FIX: Form bán hàng phải nhập TỔNG GIÁ BÁN (không phải giá/sp), giống logic mua hàng
- [x] FIX: Form bán hàng phải nhập TỔNG GIÁ BÁN (không phải giá/sp), giống logic mua hàng

## Sửa quy tắc tính giá (giá/SP thay vì tổng giá lô)
- [x] Backend createPurchase: price = giá mua/SP, tổng vốn = price × quantity
- [x] Backend createSale: salePrice = giá bán/SP, doanh thu = salePrice × quantity, lợi nhuận = doanh thu - (buyPrice × quantity) - phí
- [x] Backend updatePurchase: price = giá mua/SP
- [x] Backend updateSale: salePrice = giá bán/SP
- [x] Frontend Purchases form: label "Giá mua (¥/SP)", hiển thị tổng vốn = giá × SL
- [x] Frontend Sales form: label "Giá bán (¥/SP)", hiển thị doanh thu = giá × SL, vốn = buyPrice × SL, lợi nhuận
- [x] Dashboard/Reports: đảm bảo tính đúng theo quy tắc mới

## Sửa lại quy tắc tính giá (TỔNG GIÁ LÔ, không phải giá/SP)
- [x] Backend createPurchase: price = TỔNG GIÁ CẢ LÔ, unitPrice = price / quantity
- [x] Backend createSale: salePrice = TỔNG GIÁ BÁN CẢ LÔ, profit = salePrice - buyPrice*qty - fees
- [x] Backend updatePurchase: price = TỔNG GIÁ CẢ LÔ
- [x] Backend updateSale: salePrice = TỔNG GIÁ BÁN CẢ LÔ
- [x] Frontend Purchases form: label "Tổng giá mua (¥)" + hiển thị giá/SP tự tính
- [x] Frontend Sales form: label "Tổng giá bán (¥)" + hiển thị lợi nhuận = tổng bán - tổng mua - phí

## Sửa thống kê + Sửa/Xoá trong Kho Hàng
- [x] Thống kê Dashboard trừ đúng tổng SP khi bán hàng hoặc xoá sản phẩm
- [x] Thêm chức năng SỬA sản phẩm trong Kho Hàng (tên, SL, giá, series...)
- [x] Thêm chức năng XOÁ sản phẩm trong Kho Hàng (confirm dialog)
- [x] Tự động cập nhật thống kê Dashboard sau mỗi lần sửa/xoá trong Kho

## Fix hiển thị giá vốn trong Kho Hàng
- [x] Kho Hàng card: "Giá vốn" hiển thị = buyPrice × quantity (tổng giá vốn cả lô)
- [x] Form sửa: "Tổng giá vốn (¥)" nhập tổng giá lô, hệ thống tự chia ra giá/SP khi lưu

## Đổi giao diện Pokémon GO
- [x] Thay hình nền login bằng hình Red + Pikachu
- [x] Đổi theme bên trong: nửa xanh trời đậm + nửa đỏ (Pokémon GO style)
- [x] Thay nền content bằng hình Zoroark đen, chữ trắng, nút đỏ

## Giao diện Gaming Neon (giống genpkm.com/shop)
- [x] CSS theme: nền đen/xanh đậm, viền neon xanh lá, card phát sáng
- [x] Sidebar: neon style với viền phát sáng
- [x] Login page: phù hợp phong cách gaming neon

## Đổi tên TCG Trading Manager + nền trắng
- [x] Đổi "Thống kê chi tiết" heading → "TCG Trading Manager"
- [x] Đổi logo sidebar POKÉMON → "TCG Manager" màu vàng
- [x] Đổi login page text → "TCG Trading Manager" màu vàng
- [x] Đổi nền giao diện từ đen sang trắng

## Đồng bộ giá SNKRDUNK
- [x] Thêm snkrdunkUrl và snkrdunkLastSyncedAt vào products, tạo và áp dụng migration
- [x] Tạo adapter SNKRDUNK: validate URL sản phẩm, fetch HTML, parse giá công khai không giả lập
- [x] Thêm backend lưu URL, đồng bộ marketPrice, price_history và activity_logs
- [x] Thêm tRPC updateSnkrdunkUrl, syncSnkrdunkPrice và syncAllSnkrdunk
- [x] Cập nhật Marketplace UI: gắn URL, đồng bộ riêng/tất cả, mở link, trạng thái và lỗi rõ ràng
- [x] Viết test parser, URL danh mục/không hợp lệ và trường hợp không có giá
- [x] Chạy typecheck, test, build và xác minh luồng đồng bộ trước khi lưu checkpoint
- [x] Kiểm thử adapter với URL SNKRDUNK công khai: trang chỉ có USD bị từ chối, không ghi giá giả lập
- [x] Xác nhận bulk sync không có URL trả về skippedCount và không làm thay đổi dữ liệu hiện có

## Quy tắc lấy giá lựa chọn đầu tiên SNKRDUNK
- [x] Parser phải lấy đúng giá lựa chọn đầu tiên, ví dụ 1個 (99+) ¥13.300, không lấy giá lựa chọn 2, 3 hoặc giá thấp nhất khác
- [x] Thêm test HTML/JSON có nhiều lựa chọn để xác nhận luôn trả về lựa chọn đầu tiên
- [x] Chạy typecheck, test, build và lưu checkpoint sau khi sửa
- [x] Lưu checkpoint mới sau khi sửa quy tắc lấy giá lựa chọn đầu tiên SNKRDUNK

## Fix lỗi Marketplace không tìm thấy giá SNKRDUNK
- [x] Kiểm tra HTML/API công khai và xác định vì sao giá lựa chọn đầu tiên không được parser đọc
- [x] Sửa adapter để đọc đúng nguồn giá công khai, không dùng giá giả lập hoặc đổi USD thành JPY
- [x] Thêm test hồi quy cho cấu trúc HTML/API gây lỗi và chạy lại typecheck, test, build

## Nâng cấp giao diện Marketplace
- [x] Thêm khu vực tổng quan chỉ số: tổng sản phẩm, đã đồng bộ, chưa gắn link và cảnh báo lỗi
- [x] Thêm bộ lọc trạng thái và tìm kiếm sản phẩm
- [x] Chuyển danh sách sang bảng sản phẩm rõ hơn với giá mua, giá thị trường, chênh lệch và ROI
- [x] Hiển thị trạng thái đồng bộ, thời điểm cập nhật và lỗi theo sản phẩm
- [x] Thêm modal tiến trình đồng bộ hàng loạt nhưng giữ nguyên logic sync SNKRDUNK hiện tại
- [x] Kiểm tra responsive, test, build và lưu checkpoint
- [x] Hiển thị lỗi đồng bộ inline theo từng sản phẩm, không chỉ qua toast hoặc modal bulk
- [x] Kiểm tra Marketplace ở mobile/tablet và lưu checkpoint mới sau redesign
- [x] Thay bảng ngang bằng card Marketplace gọn trên mobile để không cắt cột và vẫn giữ đủ thao tác
- [x] Lưu checkpoint mới sau bản redesign Marketplace (inline error, card mobile/tablet, test và build)

## Đồng bộ giá Card theo hạng A SNKRDUNK
- [x] Giữ nguyên luồng đồng bộ hiện tại cho Marketplace và Box/Pack
- [x] Với sản phẩm Card, ưu tiên lấy giá hạng A (Aあり) của lựa chọn đầu tiên
- [x] Bổ sung test Card có nhiều hạng và xác nhận không lấy giá B/PSA hoặc hạng khác
- [x] Chạy typecheck, test, build và lưu checkpoint mới

## Khắc phục phản hồi mặc định của Trợ lý AI
- [x] Sửa luồng trích xuất nội dung invokeLLM để AI suy luận theo câu hỏi thay vì trả về câu mặc định
- [x] Bổ sung kiểm thử hồi quy cho phản hồi AI và xác minh build trước khi lưu checkpoint
