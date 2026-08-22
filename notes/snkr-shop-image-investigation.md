# Xác minh ảnh sản phẩm Shop SNKR

- URL `https://snkrdunk.com/apparels/864495?slide=right` trả về ảnh Open Graph chung `https://cdn.snkrdunk.com/images/ogp/og-image.png`; đây là ảnh bìa marketplace, không phải ảnh sản phẩm.
- Endpoint công khai `https://snkrdunk.com/en/v1/products/SW---864495` trả `product.thumbnailUrl` trỏ đến ảnh box thật: `https://cdn.snkrdunk.com/upload_bg_removed/067ebb9d-ffc2-49c7-9abc-3eb7eb863388.webp?size=s`.
- Ảnh thumbnail đã được kiểm tra trực quan: hiển thị box One Piece màu vàng, không phải banner SNKRDUNK.
- Dữ liệu theo dõi hiện có đã được làm mới sang URL ảnh box thật; adapter hiện bỏ qua banner OGP và ưu tiên thumbnail của endpoint chi tiết.
