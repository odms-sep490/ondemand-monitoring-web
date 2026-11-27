# 09 — Kiểm toán Hiệu năng Web & Three.js 3D (Performance Audit)

Mọi số liệu dưới đây đều được đo trực tiếp từ production build `dist/assets/`, `assets/previews/model-stats.json` và Playwright runtime.

## 1. Chỉ số Production Bundle (`vite build` — `dist/assets/`)
- **Tổng JS sinh ra**: `7,373.5 KB` (đã chia lazy chunks theo route/feature)
- **Tổng CSS sinh ra**: `1,494.6 KB` (**quá nặng**, chủ yếu do 150 tệp CSS và trùng lặp rule)
- **Top chunks lớn nhất cần tối ưu**:
  | Tệp chunk | Kích thước | Nhận xét |
  | --- | ---: | --- |
  | `GLTFLoader-*.js` | **664.6 KB** | Lazy-loaded cùng `Interactive3DDroneStage`, không chặn FCP |
  | `DroneOperatorHomePage-*.js` | **530.5 KB** | Quá nặng cho 1 chunk portal staff (gộp cả `omss/screens/*` cũ) |
  | `FlightDrone-*.js` | **489.9 KB** | Bản đồ + cockpit bay |
  | `ReportStudio-*.js` | **476.0 KB** | TipTap editor + PDF export |
  | `preflight-success-banner.png` | **472.4 KB** | Ảnh PNG chưa chuyển sang WebP/AVIF (có thể giảm ~80% xuống < 90 KB) |
  | `popups-*.js` | **389.3 KB** | Gom chung nhiều modal/drawer |
  | `CartesianChart-*.js` | **268.5 KB** | Recharts |
  | `antd-*.js` | **264.4 KB** | Ant Design core |
  | `index-*.js` | **258.9 KB** | Entry chunk chính (chấp nhận được) |
  | `DroneOperatorHomePage-*.css` | **175.3 KB** | CSS riêng cho 1 portal quá lớn |

## 2. Chỉ số Runtime đo bằng Playwright (Desktop 1440px)
| Route | FCP (ms) | DOM Nodes | Ảnh vỡ | Ghi chú |
| --- | ---: | ---: | ---: | --- |
| `/` (`LandingPage`) | **180 ms** | 885 | 0 | Rất nhanh; DOM gọn dưới ngưỡng khuyến nghị 1,500 nodes |
| `#auth/login` | **132 ms** | 61 | 0 | Nhẹ |
| `#auth/register` | **192 ms** | 142 | 0 | Nhẹ |

> *Ghi chú*: Chưa chạy Lighthouse CLI đầy đủ trên môi trường mạng mô phỏng 4G chậm; LCP/INP/TBT được đánh dấu `N/A` thay vì ước đoán.

## 3. Kiểm toán chuyên sâu Three.js & Mô hình 3D Đại học FPT TP.HCM
Nguồn: `Interactive3DDroneStage.tsx` + `assets/previews/model-stats.json`:
- **GLB HIGH**: `9.92 MB` (`159,150` tam giác, `37` draw calls) — đạt ngưỡng `< 10 MB`, nhưng có thể nén **Draco/Meshopt** xuống ~`1.5–2.5 MB` để tăng tốc tải 4×!
- **GLB LOW (Mobile)**: `6.47 MB` (`95,054` tam giác, `37` draw calls) — vẫn hơi nặng cho mạng di động 4G, nên bật Draco compression + giảm tiếp xuống `< 2 MB`.
- **Quản lý GPU & Vòng lặp render**:
  - Đã giới hạn `devicePixelRatio` (`HIGH <= 2`, `MEDIUM <= 1.5`, `LOW <= 1`).
  - Đã dùng `IntersectionObserver` + `document.hidden` để tạm dừng `requestAnimationFrame` khi cuộn ra khỏi khung nhìn.
  - Đã dọn tài nguyên GPU (`geometry.dispose()`, `material.dispose()`, `renderer.dispose()`, `controls.dispose()`) khi unmount.
  - Đã có thanh tiến độ tải `%`, xử lý lỗi tải kèm nút `Tải lại mô hình`, và fallback ảnh tĩnh khi `prefers-reduced-motion` hoặc mất WebGL context.
- **Lãng phí dependency**: `package.json` cài cả `framer-motion` lẫn `motion` (trùng hoàn toàn về chức năng) + `gsap` + `lottie-react` (có cảnh báo `eval` từ `lottie-web` khi `vite build`).
