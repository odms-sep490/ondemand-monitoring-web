# 17 — Báo cáo So sánh Trước / Sau (Before & After Report)

> **Trạng thái hiện tại**: **ĐÃ HOÀN TẤT BASELINE (`BEFORE`) — CHƯA CHỈNH SỬA MÃ NGUỒN (Giai đoạn 15 chờ phê duyệt)**.

## 1. Ảnh chụp Baseline (`screenshots/before/`)
Các ảnh chụp thực tế từ Playwright đã lưu tại `docs/ui-ux-audit/screenshots/before/`:
- `landing-375px.png` (xác nhận lỗi `FND-001` cắt nút CTA trên header mobile)
- `landing-768px.png`
- `landing-1440px.png` (xác nhận lỗi `FND-002` AI Mascot đè `CAM 3`/`CAM 4`)
- `auth-login-375px.png`, `auth-login-1440px.png` (xác nhận lỗi `FND-003` khóa offline)
- `auth-register-375px.png`, `auth-register-1440px.png`
- `auth-forgot-1440px.png` (xác nhận lỗi `FND-004` rơi về Landing Page)
- `help-center-375px.png`, `help-center-1440px.png` (xác nhận lỗi `FND-003` khóa `#help` khi offline)

## 2. Bảng chỉ số Baseline (sẽ điền cột `After` sau Giai đoạn 15–16)
| Chỉ số đo thực tế | Before (27/11/2026) | After (Sau khi sửa) | Thay đổi |
| --- | ---: | :---: | :---: |
| Lỗi P0 (Header Mobile cắt CTA) | **1** | *Chờ triển khai* | — |
| Lỗi P1 đã xác nhận | **6** (`FND-002..007`) | *Chờ triển khai* | — |
| `outline: none/0` thiếu `:focus-visible` | **37** | *Chờ triển khai* | — |
| Xung đột `z-index >= 1000` | **13** (max `12000`) | *Chờ triển khai* | — |
| `!important` trong CSS | **277** | *Chờ triển khai* | — |
| Touch targets `< 36px` (Landing Mobile) | **27** | *Chờ triển khai* | — |
| Tổng CSS build (`dist/assets`) | **1,494.6 KB** | *Chờ triển khai* | — |
| GLB HIGH / LOW (`fpt-campus`) | **9.92 MB / 6.47 MB** | *Chờ triển khai* | — |
