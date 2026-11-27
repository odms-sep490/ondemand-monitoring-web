# 04 — Kiểm toán Hệ thống Thiết kế (Design System Audit)

## 1. Thực trạng Design System hiện tại
Dự án đang vận hành **3 lớp token song song không hoàn toàn đồng bộ**:
1. **Ant Design Theme** ([appTheme.ts](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/shared/theme/appTheme.ts)):
   - Primary: `#1565E8`, Secondary: `#0958d9`, Success: `#16A34A`, Warning: `#F59E0B`, Danger: `#DC2626`, Thirdly: `#8B5CF6`.
   - Font: `'Be Vietnam Pro', 'Inter', system-ui, ...` (tốt cho dấu tiếng Việt).
   - Dark surface: `layout: #0B1226`, `card: #111B36`, `border: #1F2C4D`, `elevated: #16213F`.
2. **Global CSS Tokens** ([global.css](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/styles/global.css#L8-L67)):
   - Light surface: `--color-background: #f8fafc` (lệch nhẹ so với `#F4F7FC` của `appTheme.ts`), `--color-border: #e2e8f0` (lệch so với `#E6ECF5`).
   - Dark surface (`:root[data-theme='dark']`): `#0b1220` / `#111c2e` / `#2b3b54` — **lệch trực tiếp với `appTheme.ts` (`#0B1226` / `#111B36` / `#1F2C4D`)**, tạo đường viền và nền card bị chênh màu khi đặt component Antd cạnh HTML thuần.
3. **Feature-local CSS Variables & Hardcoded Hex**:
   - Landing Page dùng palette riêng (`#0D1B26`, `#132733`, `#64DFC4` mint) — hợp lý cho trang marketing aerospace nhưng thiếu cầu nối thị giác với màu `#1565E8` khi bấm vào Portal.
   - Manager (`--mgr-*`), Operator (`--opr-*`), Finance, Admin tự định nghĩa biến riêng và kèm **1,295 màu hex cứng**.

## 2. Đánh giá các trụ cột Design System
| Trụ cột | Hiện trạng | Vấn đề |
| --- | --- | --- |
| **Màu sắc & Dark Mode** | Có token gốc tốt (`#1565E8` + `Be Vietnam Pro`) | Lệch nền/viền giữa `appTheme.ts` và `global.css`; 1,295 hex cứng khiến dark mode dễ bị chói trắng ở các card cục bộ |
| **Typography** | `Be Vietnam Pro` + `JetBrains Mono` | Kích thước chữ chưa chuẩn hóa theo scale cố định (`11.5px`, `12.5px`, `13.5px`, `14.5px`, `15.5px` xuất hiện tự do) |
| **Spacing & Radius** | `--space-1..8` (`4..32px`), `--radius-sm/md/lg` (`8/10/16px`) | Nhiều CSS tự viết `11px`, `13px`, `14px`, `18px` bỏ qua token |
| **Elevation / Z-index** | Chưa có `--z-*` scale | Tự đặt từ `20` đến `12000` gây xung đột lớp phủ |
| **Icons** | Trộn `@ant-design/icons` + custom `<Icon />` SVG | Độ dày nét (`stroke-width`) không đồng nhất giữa các màn hình |
| **Motion** | 4 thư viện (`framer-motion`, `motion`, `gsap`, `lottie-react`) | Tốn bundle và chỉ `global.css` + vài component tôn trọng `prefers-reduced-motion` |

## 3. Đề xuất Hệ thống Thiết kế Thống nhất (giữ nguyên nhận diện thương hiệu)
- **Single Source of Truth**: Đồng bộ 100% token giữa `global.css` và `appTheme.ts` (Light: `#F4F7FC` / `#FFFFFF` / `#E6ECF5`; Dark: `#0B1226` / `#111B36` / `#1F2C4D`).
- **Z-Index Scale chuẩn**: `--z-base: 1`, `--z-sticky: 100`, `--z-drawer: 400`, `--z-header: 500`, `--z-modal: 1000`, `--z-popover: 1050`, `--z-toast: 1100` (cấm vượt `1200`).
- **Hợp nhất Shared UI**: Chọn `shared/components/antd` + `odm/StateView` làm chuẩn duy nhất cho Portal; loại bỏ dần các bản sao ở `shared/components/ui` và `shared/components/Button.tsx`.
