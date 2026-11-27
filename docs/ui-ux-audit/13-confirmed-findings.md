# 13 — Danh sách Phát hiện Đã Xác nhận (Confirmed Findings)

Chỉ liệt kê các lỗi đã xác nhận bằng ảnh chụp Playwright hoặc vị trí `file:line` trong mã nguồn.

---

### `FND-001` — [P0] Nút CTA chính trên Header Mobile bị cắt cụt chữ ở 320px–430px
- **Trang / Component**: `LandingPage` · `.lpx-header-tools`
- **Vai trò**: `GUEST` · **Nhóm**: Responsive / Usability
- **Thực tế**: Trên màn hình `375px`, nút trắng `Tạo yêu cầu giám sát` bị cắt mất chữ thành `Tạo yêu cầu gián` ở mép phải.
- **Kỳ vọng**: Toàn bộ nút trên header hiển thị đầy đủ, không cắt chữ trên `320px`–`430px`.
- **Bằng chứng**: `docs/ui-ux-audit/screenshots/before/landing-375px.png` · [LandingPage.tsx](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/landing/pages/LandingPage.tsx#L161-L169), [landing.css](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/landing/landing.css)
- **Nguyên nhân gốc**: Header flex không rút gọn/ẩn CTA phụ trên mobile và che tràn bằng `overflow: hidden`.
- **Giải pháp**: Dưới `640px`, ẩn `.lpx-header-cta` (đã có CTA lớn trong Hero) hoặc rút gọn nhãn ngắn gọn, giữ `VI/EN` + `Đăng nhập` thoáng đẹp.
- **Tiêu chí nghiệm thu & Test**: Playwright tại `320px` và `375px` xác nhận `right <= window.innerWidth` cho mọi phần tử con trong `<header>`.

### `FND-002` — [P1] Bong bóng AI Mascot che phủ nút `CAM 3` & `CAM 4` trên Hero Desktop
- **Trang / Component**: `LandingPage` · `CinematicDroneHero` vs `ChatbotWidget` / AI Mascot
- **Vai trò**: `GUEST` · **Nhóm**: Visual / Overlap
- **Thực tế**: Tại `1440px`, tooltip `Bấm bất kỳ đâu để nghe AI giới thiệu` đè trực tiếp lên `CAM 3 · Điện mặt trời` và `CAM 4 · Lâm nghiệp`.
- **Kỳ vọng**: Không có thành phần cố định nào che nút chuyển cảnh hero.
- **Bằng chứng**: `docs/ui-ux-audit/screenshots/before/landing-1440px.png` · [landing.css](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/landing/landing.css#L2136-L2144)
- **Giải pháp**: Neo tooltip AI Mascot bung lên phía trên (`bottom: 100%`) và tăng khoảng lề phải cho `.lp3-hero-scenes` (`right: max(112px, ...)`).

### `FND-003` — [P1] Trang công khai `#help` và `#auth/login` bị khóa khi mất kết nối backend
- **Trang / Component**: `AppRouter` · `SessionFeedback`
- **Vai trò**: `GUEST` · **Nhóm**: UI State (Offline) / Usability
- **Thực tế**: Khi không gọi được API kiểm tra phiên, `#help` và `#auth/login` bị thay hoàn toàn bằng màn `Chưa thể kiểm tra phiên đăng nhập`.
- **Kỳ vọng**: `#help` hiển thị nội dung trợ giúp công khai bình thường; `#auth/login` vẫn hiển thị form kèm banner báo trạng thái kết nối.
- **Bằng chứng**: `docs/ui-ux-audit/screenshots/before/auth-login-1440px.png`, `help-center-1440px.png` · [router.tsx](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/app/router.tsx#L113-L171)

### `FND-004` — [P1] Lỗi định tuyến trên Customer (`mission-history`), Admin (`?query`) và Auth (`forgot-password`)
- **Trang / Component**: `customer/routes.ts`, `admin/routes.ts`, `router.tsx`
- **Bằng chứng**:
  - [customer/routes.ts](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/customer/routes.ts#L34-L35) trả `notFound` dù dòng 66–69 vẫn sinh URL.
  - [admin/routes.ts](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/admin/routes.ts#L46) không tách `?query`.
  - `#auth/forgot-password` rơi về `LandingPage` (xác nhận bằng Playwright: `885` DOM nodes).

### `FND-005` — [P1] 37 quy tắc `outline: none / 0` làm mất chỉ báo focus bàn phím (WCAG 2.4.7)
- **Bằng chứng**: [auth.css](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/auth/auth.css#L325), [Checklist.css](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/customer/components/checklist/Checklist.css#L155), [refund-management.css](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/admin/pages/Refunds/refund-management.css#L77), [pricingDraftEditor.css](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/admin/pages/OperatingConfig/components/pricingDraftEditor.css#L71).
- **Giải pháp**: Đổi sang `:focus-visible` dùng `--focus-ring` chuẩn của `global.css:36`.

### `FND-006` — [P1] Xung đột `z-index` cực cao (lên tới `12000`) & 277 `!important`
- **Bằng chứng**: [MissionGridDroneAssignment.css](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/manager/components/common/MissionGridDroneAssignment.css#L286) (`12000`), `FlightCockpit.css:234` (`2000`), `OrderConversation.css:1038` (`1600`), `notifications.css:28` (`1600`), `ChecklistEvidencePanel.css` (`66` `!important`).

### `FND-007` — [P1] Lệch token Dark Mode & trùng lặp 3 bộ Shared UI Components
- **Bằng chứng**: [appTheme.ts](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/shared/theme/appTheme.ts#L31) (`#0B1226`) vs [global.css](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/styles/global.css#L54) (`#0b1220`); 3 bộ `StatusBadge`/`Button`/`PageHeader`/`EmptyState` trong `src/shared/components/`.

### `FND-008` — [P2] 27 vùng chạm nhỏ `< 36px` trên Mobile Landing + `preflight-success-banner.png` nặng `472.4 KB` + GLB chưa nén Draco
- **Bằng chứng**: Playwright mobile audit + `dist/assets/` + `assets/previews/model-stats.json` (`9.92 MB` HIGH / `6.47 MB` LOW).
