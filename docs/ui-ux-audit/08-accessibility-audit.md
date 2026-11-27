# 08 — Kiểm toán Khả năng tiếp cận (Accessibility Audit — WCAG 2.2 AA)

Kết hợp quét tĩnh mã nguồn trên toàn bộ `947` tệp UI (`797 .tsx` + `150 .css/.scss`) và kiểm tra cây DOM/landmark thực tế bằng Playwright.

> **Lưu ý tuân thủ**: Kiểm tra tự động chỉ phát hiện một phần rào cản WCAG; chưa thực hiện kiểm thử screen reader thủ công (NVDA/VoiceOver) trên các portal cần đăng nhập, do đó không tuyên bố đạt WCAG 2.2 AA toàn phần.

## 1. Bảng đối chiếu WCAG 2.2 AA
| Tiêu chí WCAG | Mức | Trạng thái | Bằng chứng thực tế |
| --- | :---: | :---: | --- |
| **1.1.1 Non-text Content (`alt`)** | A | **PASS** | `0` thẻ `<img>` thiếu `alt` trong quét tĩnh; `0` ảnh vỡ (`naturalWidth === 0`) trên Playwright |
| **1.3.1 Landmarks & Headings** | A | **Cần cải thiện** | `LandingPage` có đủ `<header>`, `<main>`, `<footer>`, `<h1>` và `.skip-link` (`global.css:111`). Tuy nhiên cần chuẩn hóa thứ tự heading ở một số tab con Portal tránh nhảy cấp `h2 -> h4` |
| **1.4.3 Contrast (Minimum)** | AA | **Cần kiểm tra thêm** | Landing text trắng trên nền tối đạt tương phản cao; tuy nhiên các nhãn phụ `--mgr-muted` / `--slate-400` (`#94a3b8`) trên nền trắng `#ffffff` chỉ đạt ~`2.56:1` (**không đạt AA 4.5:1**) |
| **2.1.1 Keyboard & 2.4.7 Focus Visible** | AA | **FAIL (P1)** | Phát hiện **37 quy tắc `outline: none` / `outline: 0`** không đi kèm `:focus-visible` thay thế: `auth.css:325,938,1026`, `Checklist.css:155,218`, `refund-management.css:77,1251`, `pricingDraftEditor.css:71,378`, `baseChecklistPricing.css:156` |
| **2.3.3 / Reduced Motion** | AAA/Best | **Một phần** | `global.css:77`, `CinematicDroneHero.tsx` và `Interactive3DDroneStage.tsx` có kiểm tra `prefers-reduced-motion`; nhiều animation trong `dashboard.scss` và `landing.css` chưa tắt hết khi bật reduced motion |
| **2.5.8 Target Size (Minimum)** | AA | **FAIL (P2)** | Playwright đo được **27 nút/link `< 36×36px`** trên Landing Mobile và **5** trên Register Mobile |
| **4.1.2 Name, Role, Value** | A | **Tốt** | `0` nút/link hiển thị bị thiếu accessible name trên các route public đã chạy Playwright; `0` `div/span onClick` thiếu keyboard/role trong quét tĩnh |

## 2. Hành động ưu tiên Accessibility
1. Thay toàn bộ 37 chỗ `outline: none/0` bằng `:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }`.
2. Nâng màu chữ phụ trên nền sáng từ `#94a3b8` (`2.56:1`) lên tối thiểu `#64748b` (`4.76:1`) để đạt WCAG AA.
3. Tăng `min-height: 44px; min-width: 44px` cho các nút/link tương tác trên mobile (`< 768px`).
