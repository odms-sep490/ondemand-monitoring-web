# 07 — Kiểm toán Responsive (Responsive Audit: 320px – 1920px)

Đã chạy kiểm thử Playwright tự động trên **9 mức chiều rộng**: `320px`, `375px`, `390px`, `430px`, `768px`, `1024px`, `1280px`, `1440px`, `1920px`.

## 1. Bảng kết quả đo thực tế trên Playwright
| Route | 320px | 375px | 390px | 430px | 768px | 1024px | 1280px | 1440px | 1920px | Ghi chú lỗi xác nhận |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | --- |
| `/` (`LandingPage`) | Cắt CTA | **Cắt CTA** | Cắt CTA | Cắt CTA | OK | OK | OK | Mascot đè CAM | OK | `scrollWidth = innerWidth` nhưng header `overflow: hidden` cắt nút CTA trên `< 480px`; `27` touch target `< 36px` |
| `#auth/login` | OK* | OK* | OK* | OK* | OK* | OK* | OK* | OK* | OK* | *Hiển thị màn `SessionFeedback` khi offline; không tràn ngang |
| `#auth/register` | 5 nút nhỏ | 5 nút nhỏ | 5 nút nhỏ | 5 nút nhỏ | OK | OK | OK | OK | OK | `5` control `< 36px` trên mobile |
| `#help` | OK* | OK* | OK* | OK* | OK* | OK* | OK* | OK* | OK* | *Bị `SessionFeedback` chặn khi offline |

## 2. Chi tiết lỗi Responsive xác nhận kèm bằng chứng
1. **[P0] Cắt cụt nút `Tạo yêu cầu giám sát` trên Header Mobile (`320px`–`430px`)**
   - **Bằng chứng**: `docs/ui-ux-audit/screenshots/before/landing-375px.png`
   - **Nguyên nhân**: `.lpx-header-tools` (`src/features/landing/pages/LandingPage.tsx:161-169` + `src/features/landing/landing.css`) không ẩn bớt chữ dài hoặc gom vào menu mobile dưới `480px`, trong khi header có `overflow: hidden` che giấu lỗi tràn ngang khỏi `scrollWidth`.
   - **Khắc phục**: Dưới `640px`, rút gọn nhãn CTA header thành `Tạo yêu cầu` hoặc ẩn CTA header (vì Hero đã có CTA lớn ngay phía dưới) + gom `VI/EN` và `Đăng nhập` gọn gàng.
2. **[P1] AI Mascot che phủ cụm `CAM 3` / `CAM 4` trên Desktop (`1280px`–`1440px`)**
   - **Bằng chứng**: `docs/ui-ux-audit/screenshots/before/landing-1440px.png`
   - **Nguyên nhân**: `.lp3-hero-scenes` neo ở `bottom: 32px; right: max(48px, ...)` trùng vùng neo góc dưới-phải của widget AI Mascot (`position: fixed; right: 20px; bottom: 20px`).
   - **Khắc phục**: Đẩy `.lp3-hero-scenes` sang trái (`right: 112px` hoặc căn giữa đáy) hoặc dịch bong bóng AI Mascot lên trên icon mascot thay vì bung sang trái đè vào nút chọn cảnh.
3. **[P2] 27 vùng chạm nhỏ (`< 36×36px`) trên Mobile Landing Page & 5 trên Register**
   - **Nguyên nhân**: Các nút phụ, dot/chip điều hướng, toggle ngôn ngữ và link footer có chiều cao `< 36px` (chưa đạt chuẩn chạm tối thiểu `44×44px` theo WCAG 2.5.8 / Apple HIG).
4. **[P2] Responsive Portal (kiểm toán mã nguồn)**
   - `dashboard.scss` sử dụng `@container manager-dashboard` tốt, nhưng một số bảng nghiệp vụ trong `manager.css` và `admin.css` phụ thuộc cuộn ngang trong card mà thiếu gợi ý cuộn trên `< 768px`.
   - `Interactive3DDroneStage.tsx` đã có auto-detect `LOW` quality dưới `768px` (`DPR = 1`, tắt shadow, nạp `fpt-campus-low.glb`) — điểm cộng tốt.
