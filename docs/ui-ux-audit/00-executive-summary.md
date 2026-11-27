# 00 — Tóm tắt điều hành (Executive Summary)

**Dự án**: `ondemand-monitoring-web` (OnDemand Monitor — Hệ thống giám sát bằng drone theo yêu cầu)  
**Phạm vi**: Kiểm toán chỉ đọc (Read-only Audit) toàn bộ mã nguồn frontend (`2,202` tệp trong `src/`, `70` trang, `150` tệp CSS/SCSS) kết hợp chạy thực tế bằng Playwright trên `9` kích thước màn hình (`320px`–`1920px`).  
**Ngày thực hiện**: 27/11/2026  

## 1. Skills đã tải và sử dụng thực tế
| Skill | Nguồn | Vai trò trong đợt kiểm toán |
| --- | --- | --- |
| `web-design-guidelines` | `.agents/skills/web-design-guidelines/SKILL.md` (Vercel) | Kiểm toán mã nguồn UI theo chuẩn Web Interface Guidelines (`file:line`) |
| `accessibility` | `.agents/skills/accessibility/SKILL.md` (web-quality-skills) | Kiểm toán WCAG 2.2 AA (focus, landmarks, contrast, touch targets) |
| `ui-ux-pro-max` | `.agents/skills/ui-ux-pro-max/SKILL.md` | Đánh giá Design System, typography, phân cấp thị giác |
| `webapp-testing` | `.agents/skills/webapp-testing/SKILL.md` | Chạy Playwright thực tế trên `vite preview`, chụp ảnh `before/` và đo DOM/FCP |
| `vercel-react-best-practices` | `.agents/skills/vercel-react-best-practices/SKILL.md` | Kiểm toán bundle size, code-splitting và render hygiene |

> **Ghi chú minh bạch**: Các repository bên ngoài chưa cài đặt trực tiếp (`impeccable`, `uxui-audit-skill`, `claude-ui-ux-audit-skill`, `ui-audit`, `ux-audit`) không được cài đè để tránh xung đột; các nguyên tắc tương đương đã được áp dụng bằng bộ skills đã kiểm duyệt trong workspace.

## 2. Chỉ số tổng quan đo được từ mã nguồn & runtime
| Hạng mục | Giá trị đo thực tế | Đánh giá |
| --- | ---: | --- |
| Tổng số tệp nguồn (`src/`) | **2,202 tệp** (`1,044 .tsx`, `956 .ts`, `150 .css/.scss`) | Quy mô enterprise lớn |
| Tổng số trang (`*Page.tsx`) | **70 trang** qua 6 vai trò | Độ phủ nghiệp vụ rộng |
| Tổng dung lượng CSS/SCSS | **85,173 dòng** / `1,494.6 KB` build | **Nặng & phân mảnh cao** |
| Số màu hex cứng trong CSS | **1,295 màu hex duy nhất** | **Mất kiểm soát token màu** |
| Số lượng `!important` | **277 lần** (cao nhất: `66` trong 1 tệp) | **Xung đột specificity** |
| Số lượng `style={{...}}` nội tuyến | **1,649 khối** trong 797 `.tsx` | **Khó bảo trì & khó dark-mode** |
| Quy tắc `outline: none/0` thiếu `:focus-visible` | **37 vị trí** | **Rủi ro WCAG 2.4.7 (P1)** |
| Xung đột `z-index >= 1000` | **13 vị trí** (cao nhất `12000`) | **Chồng lớp Modal/Drawer** |
| Tổng bundle JS / CSS (`dist/assets`) | **7,373.5 KB JS** / **1,494.6 KB CSS** | Cần tách chunk & cắt CSS trùng |
| Thư viện UI dùng chung trùng lặp | **3 bộ song song** (`shared/components/ui`, `antd`, `odm`) | **Phân mảnh Design System** |

## 3. Các vấn đề nghiêm trọng nhất (P0 / P1) đã xác nhận
1. **[P0] Cắt mất nút CTA chính trên Header Mobile (`375px`–`430px`)** — `landing-375px.png`: Nút `Tạo yêu cầu giám sát` bị cắt chữ ở mép phải do header dùng `overflow: hidden` mà không rút gọn trên mobile.
2. **[P1] Bong bóng AI Mascot che khuất nút chuyển cảnh `CAM 3` & `CAM 4` trên Hero Desktop (`1440px`)** — `landing-1440px.png`: Tooltip `Bấm bất kỳ đâu để nghe AI giới thiệu` đè trực tiếp lên thanh chọn cảnh.
3. **[P1] Trang công khai `#help` và `#auth/login` bị khóa cứng khi mất kết nối backend** — `auth-login-1440px.png`, `help-center-1440px.png`: `SessionFeedback` chặn toàn bộ giao diện thay vì cho xem Help Center hoặc hiển thị form đăng nhập kèm cảnh báo kết nối.
4. **[P1] Route chết / xung đột điều hướng**: `customer/routes.ts:34-35` trả `notFound` cho `mission-history` dù `customerHref` vẫn sinh link; `admin/routes.ts:46` không tách `?query` nên URL có query bị `notFound`; `#auth/forgot-password` rơi về Landing Page.
5. **[P1] `37` vị trí xóa `outline` bàn phím + `27` vùng chạm nhỏ (`< 36px`) trên mobile Landing Page**.
6. **[P1] Phân mảnh hệ thống thiết kế**: 3 bộ component dùng chung trùng lặp, 2 bộ thư viện animation (`framer-motion` + `motion` + `gsap`), 1,295 màu hex cứng và dark mode lệch tông giữa `appTheme.ts` (`#0B1226`) và `global.css` (`#0b1220`).

## 4. Khuyến nghị bước tiếp theo
Chờ phê duyệt của chủ dự án để triển khai **Giai đoạn 15 (Redesign & Implementation)** theo lộ trình 4 đợt trong [15-implementation-plan.md](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/docs/ui-ux-audit/15-implementation-plan.md): ưu tiên vá P0/P1 trước, chuẩn hóa Design Tokens và hợp nhất Shared UI trước khi tinh chỉnh từng trang.
