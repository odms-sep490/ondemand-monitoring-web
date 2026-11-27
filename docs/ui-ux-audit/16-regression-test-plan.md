# 16 — Kế hoạch Kiểm thử Hồi quy (Regression Test Plan)

Sau khi triển khai từng đợt trong Giai đoạn 15, bắt buộc chạy bộ kiểm thử hồi quy sau:

## 1. Kiểm thử Tĩnh & Build
- `npx tsc -b` / `npx tsc --noEmit` — 0 lỗi mới ở các tệp chỉnh sửa.
- `npx vite build` — build thành công, kiểm tra giảm kích thước `dist/assets/*.css` và `DroneOperatorHomePage-*.js`.
- `npx vitest run` — toàn bộ unit test của `router`, `LandingPage`, `AuthPage`, `OrderDetail`, `Dashboard`, `CustomerFinancePanel`, `MaintenanceWorkflowDrawer`, `ResourceLifecyclePage` đều PASS.

## 2. Kiểm thử Playwright Responsive & Visual (`after/`)
- Chạy lại kịch bản Playwright trên đủ 9 viewport (`320`, `375`, `390`, `430`, `768`, `1024`, `1280`, `1440`, `1920`) và chụp ảnh vào `docs/ui-ux-audit/screenshots/after/`.
- **Assertion bắt buộc**:
  - `FND-001`: Tại `320px` và `375px`, mọi nút/link trong `<header>` có `boundingBox.x + width <= viewport.width`.
  - `FND-002`: Tại `1280px` và `1440px`, bounding box của AI Mascot tooltip không giao cắt (`intersection === 0`) với `.lp3-hero-scenes`.
  - `FND-003`: Khi mock API `/auth/me` lỗi mạng, `#help` vẫn render tiêu đề Trung tâm trợ giúp và `#auth/login` vẫn render form đăng nhập.
  - `FND-004`: `#portal/admin/accounts?page=2` resolve về `screen: 'accounts'`; `#auth/forgot-password` mở đúng màn quên mật khẩu.
  - `FND-005`: Quét tĩnh xác nhận `0` quy tắc `outline: none/0` không có `:focus-visible`.
  - `FND-008`: Số touch target `< 36px` trên mobile giảm về `0`.
