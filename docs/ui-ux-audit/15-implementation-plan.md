# 15 — Kế hoạch Triển khai Theo Đợt (Implementation Plan)

> **Trạng thái**: Chờ phê duyệt trước khi chỉnh sửa mã nguồn ứng dụng (theo quy tắc Phase 15).

## Đợt 1 — Vá khẩn cấp P0 & P1 (Ảnh hưởng trực tiếp người dùng, rủi ro thấp)
1. **Sửa `FND-001`**: Responsive Header Mobile trên `LandingPage` (`landing.css`).
2. **Sửa `FND-002`**: Tách vị trí tooltip AI Mascot và cụm `CAM 1–4` trên Hero Desktop.
3. **Sửa `FND-003`**: Cho phép `#help` và `#auth/*` render không bị chặn bởi `SessionFeedback` khi backend ngoại tuyến (`router.tsx`).
4. **Sửa `FND-004`**: Sửa `admin/routes.ts` tách `?query`, dọn dead route `mission-history` ở `customer/routes.ts`, và nối chuẩn `#auth/forgot-password`.

## Đợt 2 — Accessibility & Design Token Hygiene
5. **Sửa `FND-005`**: Thay thế 37 vị trí `outline: none/0` bằng `:focus-visible` chuẩn WCAG 2.4.7.
6. **Sửa `FND-006`**: Đưa 13 `z-index >= 1000` (đặc biệt `12000` ở `MissionGridDroneAssignment.css`) về thang `--z-*` chuẩn.
7. **Sửa `FND-007`**: Đồng bộ token Dark Mode giữa `appTheme.ts` và `global.css`, nâng tương phản chữ phụ lên `#64748b`.
8. **Sửa `FND-008`**: Nâng vùng chạm mobile lên `>= 44px` trên Landing & Auth.

## Đợt 3 — Hiệu năng & Nén Tài nguyên
9. Chuyển `preflight-success-banner.png` (`472.4 KB`) sang WebP.
10. Bật nén Draco/Meshopt cho `fpt-campus.glb` & `fpt-campus-low.glb` + cấu hình `DRACOLoader` cục bộ.
11. Loại bỏ dependency trùng `framer-motion` hoặc `motion`, tách lazy-load các route con trong `DroneOperatorHomePage`.

## Đợt 4 — Hợp nhất Shared UI & Dọn CSS Monolith
12. Hợp nhất dần `shared/components/ui/` vào `shared/components/antd/` + `odm/StateView`.
13. Giảm 277 `!important` (bắt đầu từ `ChecklistEvidencePanel.css` — 66 lần) và chuyển dần inline style ở `omss/screens/*` sang CSS token.
