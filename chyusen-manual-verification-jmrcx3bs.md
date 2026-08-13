# Xác minh lưu Chyusen thủ công

Trang `/chyusen` được xác minh trực quan sau khi máy chủ khởi động lại và hiển thị ổn định với nút **Thêm 抽選** cùng khu vực quản lý hiện hữu. Hộp thoại nhập liệu được bảo vệ bằng kiểm thử đơn vị cho logic chuyển sang nhập thủ công khi đọc link thất bại, và kiểm thử router cho cả lưu không URL lẫn URL nguồn hợp lệ.

Kiểm tra kiểu và 81 kiểm thử Vitest đã hoàn tất thành công.
