# EPOCH Blocks

Game xếp khối 8×8, hỗ trợ chuột và màn hình cảm ứng.

## Chạy game
Mở index.html bằng trình duyệt hoặc dùng máy chủ tĩnh:

    python -m http.server 8080

Sau đó mở http://localhost:8080. Không cần cài thư viện hoặc build.

## Cấu trúc
- index.html: giao diện
- style.css: bố cục và giao diện mobile
- game.js: xếp khối, tính điểm, lưu ván, cửa hàng, nhiệm vụ
- worldfx.js: hiệu ứng xóa khối
- mobile.js, sw.js, manifest.webmanifest: hỗ trợ cài lên màn hình chính
- assets/: hình ảnh và texture

Tiến trình được lưu trên từng trình duyệt bằng localStorage, chưa đồng bộ giữa thiết bị. Cài ứng dụng và service worker cần HTTPS. Hình ảnh được cung cấp cho dự án; kho này không tự cấp quyền sử dụng lại hình ảnh.
