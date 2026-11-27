# 05 — Đánh giá Thiết kế Thị giác (Visual Design Critique)

Đánh giá dựa trên ảnh chụp Playwright thực tế (`before/`) và các màn hình nghiệp vụ đã kiểm duyệt gần đây.

## 1. Điểm mạnh cần giữ nguyên
- **Landing Page Desktop (`landing-1440px.png`)**: Hình ảnh hero điện ảnh, phân cấp chữ mạnh mẽ (`Giám sát bằng drone, bàn giao đúng chuẩn.`), khoảng thở tốt, CTA màu mint (`#64DFC4`) nổi bật trên nền tối aerospace.
- **3D Digital Twin Đại học FPT TP.HCM (`Interactive3DDroneStage`)**: Khối kiến trúc giật cấp cam–trắng + sân xanh + drone mô phỏng tạo khác biệt rõ rệt cho sản phẩm.
- **Font `Be Vietnam Pro`**: Hiển thị dấu tiếng Việt rất sạch, không bị dính dấu khi in đậm tiêu đề lớn.

## 2. Các lỗi thị giác & bố cục xác nhận
1. **Header Mobile bị cắt CTA (`landing-375px.png`) [P0]**: Trên màn hình `375px`, thanh điều hướng nhồi cùng lúc logo + nút `VI/EN` + `Đăng nhập` + nút trắng `Tạo yêu cầu giám sát`, khiến nút CTA chính bị cắt cụt chữ `Tạo yêu cầu gián` ở mép phải.
2. **Xung đột lớp phủ góc dưới phải Hero (`landing-1440px.png`) [P1]**: Bong bóng giới thiệu AI Mascot (`Bấm bất kỳ đâu để nghe AI giới thiệu`) nằm đè trực tiếp lên hai nút chọn cảnh `CAM 3 · Điện mặt trời` và `CAM 4 · Lâm nghiệp`, phá vỡ bố cục và gây nhiễu thị giác ngay màn hình đầu tiên.
3. **Trang thái lỗi phiên quá trống & thiếu ngữ cảnh (`auth-login-1440px.png`, `help-center-1440px.png`) [P1]**: Khi chưa kết nối được backend, toàn trang trắng với icon nhỏ ở giữa và 2 nút `Thử lại` / `Về trang chủ`, không giải thích rõ tại sao trang công khai (`#help`, `#auth/login`) lại bị khóa.
4. **Hội chứng "thẻ lồng thẻ" và mật độ không đều trong Portal**:
   - Nhiều trang quản trị (`Dashboard`, `OrderReview`, `CreateOrder`) có nhiều lớp viền + bóng đổ chồng nhau (`box-shadow` trên card + viền trên từng row bên trong).
   - Một số card trong `Manager Dashboard` trước đây bị kéo giãn tạo khoảng trắng chết lớn khi đặt cạnh danh sách dài.
5. **Lệch nhịp thị giác giữa Landing (Dark Mint Aerospace) và Portal (Light Cobalt Blue)**: Sự chuyển đổi đột ngột từ `#0D1B26/#64DFC4` sang `#F4F7FC/#1565E8` chấp nhận được về mặt công năng (marketing tối vs workspace sáng), nhưng nên thống nhất kiểu nút, bo góc (`10px`) và icon để tạo cảm giác cùng một sản phẩm.
