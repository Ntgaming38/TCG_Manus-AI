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

## Nhãn giá Card Marketplace
- [x] Hiển thị nhãn “Hạng A” cạnh giá thị trường ở bảng Marketplace và card responsive cho sản phẩm Card
- [x] Giữ nguyên giá và logic đồng bộ của Box/Pack
- [x] Chạy typecheck, test, build và lưu checkpoint mới

## Tooltip nhãn Hạng A Marketplace
- [x] Thêm tooltip giải thích nhãn “Hạng A” là giá được đồng bộ từ SNKRDUNK ở desktop và mobile
- [x] Kiểm tra accessibility bằng hover/focus, typecheck, test, build và lưu checkpoint mới

## Làm nổi bật nhãn Hạng A
- [x] Đổi nhãn Hạng A sang màu tương phản mạnh hơn trên bảng desktop và card mobile
- [x] Giữ nguyên tooltip, logic giá và đồng bộ SNKRDUNK; chạy typecheck, test, build và lưu checkpoint

## Chyusen (抽選)
- [x] Thêm mục Chyusen ngay dưới Bán Hàng trong sidebar và route /chyusen
- [x] Tạo dữ liệu chương trình: tên, sản phẩm, website/app, link, ngày mở đăng ký, hạn đăng ký, ngày quay số, trạng thái và ghi chú
- [x] Thêm backend CRUD theo từng user, không tự động tham gia hoặc truy cập tài khoản app bên ngoài
- [x] Xây giao diện danh sách, bộ lọc trạng thái, thêm/sửa/xóa và mở link chương trình
- [x] Hiển thị trạng thái tự động: Sắp mở, Đang mở, Sắp hết hạn, Đã hết hạn, Đã có kết quả
- [x] Viết test, migration an toàn, typecheck, build và lưu checkpoint
- [x] Hiển thị badge “Sắp hết hạn” tự động cho chương trình còn hạn đăng ký trong 3 ngày
- [x] Bổ sung test cho logic phân loại trạng thái thời gian và kết quả Chyusen
- [x] Lưu checkpoint mới sau khi hoàn tất các bổ sung Chyusen

## Nhắc nhở Chyusen sắp hết hạn
- [x] Thêm khu vực thông báo cho chương trình còn hạn đăng ký trong 3 ngày
- [x] Hiển thị tên chương trình, thời hạn còn lại và nút mở link chương trình
- [x] Đảm bảo cảnh báo responsive, có trạng thái không có thông báo và kiểm tra typecheck/test/build
- [x] Lưu checkpoint sau khi hoàn tất

## Nhắc nhở Chyusen trên Dashboard
- [x] Đưa danh sách chương trình Chyusen sắp hết hạn lên Dashboard chính
- [x] Hiển thị số lượng cảnh báo, thời hạn còn lại và nút mở chương trình
- [x] Giữ đồng bộ với dữ liệu Chyusen theo từng user và có trạng thái rỗng/loading
- [x] Kiểm tra responsive, typecheck, test, build và lưu checkpoint mới

## Đăng ký Chyusen và mức cảnh báo
- [x] Lưu trạng thái Đã đăng ký theo từng chương trình, có migration an toàn và API cập nhật
- [x] Thêm nút Đã đăng ký/Chưa đăng ký và ẩn chương trình đã đăng ký khỏi các khu vực nhắc nhở
- [x] Hiển thị badge số lượng Chyusen sắp hết hạn chưa đăng ký trên menu sidebar
- [x] Dùng màu cảnh báo khác nhau cho mốc còn 72 giờ, 24 giờ và 6 giờ trên Dashboard và Chyusen
- [x] Viết test, kiểm tra responsive, typecheck, build và lưu checkpoint mới
- [x] Kiểm tra riêng giao diện mobile cho Chyusen và Dashboard sau khi thêm Đã đăng ký và các mức cảnh báo
- [x] Lưu checkpoint mới sau khi hoàn tất Đã đăng ký Chyusen, badge sidebar và màu cảnh báo 72/24/6 giờ

## Đánh giá nhập Chyusen từ link P-Bandai
- [x] Kiểm tra trang P-Bandai công khai có hiển thị đủ tên, lịch đăng ký, hạn chót và trạng thái hay không
- [x] Đề xuất phương án nhập từ link và cập nhật tự động an toàn, không tự đăng ký thay người dùng

## Nhập link và theo dõi Chyusen tự động
- [x] Xác minh cách phát hiện cập nhật công khai của P-Bandai và tần suất kiểm tra phù hợp
- [x] Chốt kiểm tra P-Bandai mỗi 6 giờ để giảm truy cập lặp lại nhưng vẫn phát hiện chương trình mới trong ngày
- [x] Thêm luồng dán link, đọc dữ liệu công khai, tạo bản nháp Chyusen và yêu cầu người dùng xác nhận trước khi lưu
- [x] Lưu nguồn link, trạng thái theo dõi, thời điểm kiểm tra và dấu vết phát hiện mới theo từng user
- [x] Thêm kiểm tra định kỳ an toàn, idempotent và chỉ tạo thông báo khi phát hiện chương trình Chyusen mới
- [x] Hiển thị thông báo phát hiện mới trong Dashboard/Chyusen, không tự đăng ký hoặc thao tác P-Bandai
- [x] Viết test, kiểm tra, build và lưu checkpoint cho tính năng theo dõi link
- [x] Lưu checkpoint mới sau khi hoàn tất tính năng nhập link và theo dõi Chyusen P-Bandai
- [x] Kích hoạt lịch Heartbeat 6 giờ sau khi phiên bản mới được publish
- [x] Xác nhận Heartbeat pbandai-chyusen-monitor đang bật, trỏ đến /api/scheduled/chyusen-monitor và có lịch chạy tiếp theo lúc 06:00 UTC

## Fix chuyển vùng P-Bandai
- [x] Kiểm tra các đường dẫn Nhật và dữ liệu công khai thay thế cho trang P-Bandai bị chuyển vùng
- [x] Cập nhật bộ đọc P-Bandai để thử fallback công khai an toàn trước khi báo không đọc được
- [x] Bổ sung test hồi quy, typecheck, build và chuẩn bị deploy cho nguồn fallback

## Theo dõi thông báo P-Bandai công khai
- [x] Xác minh landing page/thông báo P-Bandai công khai và bài đăng chính thức có thể đọc định kỳ
- [x] Mở rộng bộ đọc để hỗ trợ nguồn landing page/thông báo công khai, không dùng cách vượt chặn vùng
- [x] Cập nhật giao diện để phân biệt link sản phẩm và link thông báo chính thức
- [x] Thêm test, kiểm tra, build và lưu checkpoint cho nguồn thông báo công khai
- [x] Xác minh Heartbeat đang bật sau khi publish bản fallback mới và callback chạy thành công (HTTP 200)

## AI trích xuất lịch Chyusen từ X.com
- [x] Tạo schema JSON AI cho tên chương trình, thời gian bắt đầu, hạn đăng ký, thời gian quay số, độ tin cậy và lý do thiếu dữ liệu
- [x] Gọi LLM server-side để trích xuất từ nội dung bài đăng chính thức, kiểm tra dữ liệu và không suy đoán khi thiếu năm/giờ
- [x] Điền sẵn bản nháp Chyusen trên giao diện, hiển thị độ tin cậy và luôn yêu cầu người dùng xác nhận trước khi lưu
- [x] Viết test dữ liệu AI, typecheck, build và kiểm tra luồng trích xuất với bài đăng tiếng Nhật có ngày rõ ràng
- [x] Lưu checkpoint và deploy tính năng AI trích xuất lịch Chyusen

## Kỹ năng tái sử dụng Chyusen
- [x] Đóng gói workflow theo dõi link công khai, AI trích xuất lịch và nhắc hạn thành skill tái sử dụng
- [x] Kiểm tra cấu trúc skill và giao SKILL.md để thêm vào kho kỹ năng

## Trợ lý AI sidebar
- [x] Đánh giá và tái sử dụng thành phần chat có sẵn cho Trợ lý AI
- [x] Tạo tRPC server-side để trả lời câu hỏi theo ngữ cảnh dữ liệu của đúng người dùng
- [x] Thêm Trợ lý AI phía trên thông tin người dùng trong sidebar, có trạng thái mở/đóng và lịch sử phiên
- [x] Viết test, kiểm tra responsive, typecheck, build và lưu checkpoint

## Trợ lý AI: lịch sử và loading
- [x] Thêm nút xóa lịch sử chat theo phiên, có xác nhận và trạng thái trống rõ ràng
- [x] Hiển thị trạng thái “đang suy nghĩ” trực quan khi AI xử lý câu trả lời
- [x] Kiểm tra responsive, typecheck, test, build và lưu checkpoint
