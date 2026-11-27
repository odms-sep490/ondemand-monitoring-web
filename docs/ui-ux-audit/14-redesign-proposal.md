# 14 — Đề xuất Tái thiết kế Hệ thống (Redesign Proposal)

**Nguyên tắc cốt lõi**: Giữ nguyên nhận diện thương hiệu (`#1565E8` Cobalt Blue cho Portal, `#0D1B26/#64DFC4` Aerospace cho Landing, font `Be Vietnam Pro`), không viết lại nghiệp vụ, không đổi framework — tập trung xử lý lỗi P0/P1, chuẩn hóa Design System và tăng tốc độ tải.

## 1. Hợp nhất Design Tokens (Single Source of Truth)
- Đồng bộ `global.css` và `appTheme.ts` về cùng 1 bảng màu Light/Dark và thêm hệ thống `--z-*` (`100`, `400`, `500`, `1000`, `1050`, `1100`).
- Nâng màu chữ phụ trên nền sáng từ `#94a3b8` lên `#64748b` để đạt WCAG 2.2 AA (`>= 4.5:1`).
- Thêm quy tắc focus toàn cục `:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }` và gỡ bỏ 37 chỗ `outline: none/0`.

## 2. Hợp nhất Shared Component Library
- Chuẩn hóa **1 bộ duy nhất** cho Portal dựa trên `shared/components/antd` + `odm/StateView` (giữ `Button`, `StatusTag`, `PageHeader`, `CardComponent`, `TableComponent`, `EmptyState`).
- Gắn nhãn `@deprecated` và gom dần các component trùng trong `shared/components/ui/` và `shared/components/Button.tsx` mà không làm gãy import cũ.

## 3. Tinh gọn Landing Page & 3D Digital Twin
- **Header Mobile (`< 640px`)**: Ẩn nút CTA dài trên header (hoặc rút gọn), chỉ giữ logo gọn + `VI/EN` + `Đăng nhập` — chấm dứt hoàn toàn lỗi cắt chữ `FND-001`.
- **AI Mascot vs Hero Scene Switcher**: Đặt tooltip mascot bung lên trên (`bottom: calc(100% + 10px)`) và đẩy `.lp3-hero-scenes` tránh góc mascot — chấm dứt đè chữ `FND-002`.
- **Nén Draco/Meshopt cho `fpt-campus.glb` & `fpt-campus-low.glb`**: Giảm dung lượng từ `9.92 MB / 6.47 MB` xuống `< 2.5 MB / < 1.2 MB` (kèm `public/draco/` local).

## 4. Tối ưu Bundle & Kiến trúc CSS
- Gỡ 1 trong 2 thư viện trùng (`framer-motion` vs `motion`), chuyển `preflight-success-banner.png` (`472.4 KB`) sang WebP (`< 80 KB`).
- Tách lazy-load các màn hình con bên trong `DroneOperatorHomePage` để giảm chunk chính `530.5 KB` xuống `< 200 KB`.
- Gộp dần `CreateOrder.refinement.css` vào `CreateOrder.css` và loại bỏ `277` `!important`.
