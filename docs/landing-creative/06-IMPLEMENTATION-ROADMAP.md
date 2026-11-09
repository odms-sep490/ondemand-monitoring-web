# Roadmap cải tiến landing page

> Chỉ là kế hoạch. Chưa task nào dưới đây được triển khai; source và nghiệp vụ giữ nguyên cho đến khi có yêu cầu coding.

## P0 — Foundation

| Task | Lý do | Files/components | Skill | Hướng triển khai / dependencies | Khó | Tác động UX | Rủi ro | Acceptance criteria |
|---|---|---|---|---|---|---|---|---|
| P0.1 — Đồng bộ focus chapter | CTA trong chapter ẩn còn nằm trong tab order | `FlightMissionExperience.tsx`, `landing.css` | accessibility, ui-check, ux-audit | Xác định semantics cho inactive article; loại CTA invisible khỏi tab sequence nhưng vẫn cho screen reader đọc nội dung tuần tự. Không cần package. | Vừa | Rất cao | Ẩn content quá mức với assistive tech | Tab/Shift+Tab không focus control vô hình; focus ring thấy rõ; screen reader đọc title/content tuần tự; CTA cuối dùng được ở scene 8. |
| P0.2 — Disclosure minh họa và map credit | Stock image/status có thể bị hiểu là chuyến bay thật; một ảnh yêu cầu attribution | `FlightMissionExperience.tsx`, `credits.json`, `landing.css` | ux-audit, frontend-design-review | Xác minh nguồn/license WebP; chốt vị trí disclosure/credit trước khi sửa code. Không đổi copy nghiệp vụ khi chưa review. | Thấp-vừa | Cao | Metadata/source chưa đủ | Mỗi ảnh có nguồn/license xác minh; ảnh minh họa/status tĩnh có nhãn trung thực; quy trình/CTA không đổi. |
| P0.3 — Source of truth cho 8 scene | Chapter 1 có copy không render; status/ảnh/progress tách rời | `FlightMissionExperience.tsx`, `LandingPage.messages.ts`, `content.ts` | frontend-design-pro, gsap-scrolltrigger-storytelling | Tạo scene map thống nhất; giữ đủ 8 ID/thứ tự. Phụ thuộc copy và asset approval. | Vừa | Cao | Bản dịch hoặc CTA lệch | Mỗi scene có ID duy nhất, VI/EN khớp; UI text đúng data; status/progress/backdrop cùng active ID. |
| P0.4 — Baseline desktop/mobile | Chưa đo hiệu năng; mobile render chưa xác minh | Landing route, browser/devtools | ui-check, webapp-testing, ui-ux-pro-max | Chụp 375/768/1024/1440; kiểm tra keyboard/reduced motion; ghi network, LCP, frame pacing trước thay đổi. | Vừa | Cao | Kết quả phụ thuộc thiết bị | Có evidence với viewport/browser/locale/motion setting; không ghi số liệu chưa đo. |

## P1 — High-impact Motion

| Task | Lý do | Files/components | Skill | Hướng triển khai / dependencies | Khó | UX impact | Rủi ro | Acceptance criteria |
|---|---|---|---|---|---|---|---|---|
| P1.1 — Timeline theo scene ID | Tránh drift giữa trigger và progress timeline | `FlightMissionExperience.tsx` | gsap-scrolltrigger-storytelling, gsap-scrolltrigger | Labels/progress map theo scene; native scroll. Phụ thuộc P0.3. | Vừa-cao | Rất cao | Scrub nhạy/marker lệch | 8 checkpoint có ID; scroll hai chiều cập nhật đúng progress, copy, ảnh, route, status. |
| P1.2 — Handoff có continuity | Hiện ảnh đổi bằng fade nhưng thiếu cảm giác cùng chuyến bay | `FlightMissionExperience.tsx`, `landing.css` | cinematic-scroll-storytelling, frontend-design | Dùng SVG path motif; parallax/crop/mask tại 2–3 handoff; không pin thêm. Phụ thuộc asset/rights. | Vừa-cao | Cao | Mask/scale giảm readability hoặc giật | Mỗi handoff có mục đích; không transition ngẫu nhiên; copy/CTA rõ; reduced motion có static state. |
| P1.3 — Đồng bộ drone với route | Cùng tiến độ nhưng chưa chung hình học | `FlightMissionExperience.tsx` | gsap-scrolltrigger, gsap-performance | Nối Lottie wrapper với SVG path/waypoint; cả hai đọc progress chung. Phụ thuộc P1.1. | Vừa | Cao | Lệch vị trí mobile | Drone theo route tại checkpoint; không lệch breakpoint; không suy đoán vị trí thực. |
| P1.4 — Giữ CTA/header hiện hữu | CTA theo role là chức năng cần bảo toàn | `LandingPage.tsx`, `resolveCreateRequestTarget.ts` | frontend-design-review, webapp-testing | Không đổi resolver; chỉ bố trí/visual; verify guest/customer/manager. | Thấp | Rất cao | CTA bị che trong final frame/menu mobile | Ba role vẫn đến đúng route; nav CTA sẵn; focus không bị chatbot che. |

## P2 — Immersive Interactions

| Task | Lý do | Files/components | Skill | Hướng triển khai / dependencies | Khó | UX impact | Rủi ro | Acceptance criteria |
|---|---|---|---|---|---|---|---|---|
| P2.1 — SVG overlay có chọn lọc | Giúp hiểu vùng khảo sát/kiểm tra | `FlightMissionExperience.tsx`; tham khảo `InspectionMedia.tsx` | frontend-design, ui-ux-pro-max | Boundary/path/marker; một annotation mỗi cảnh, có nhãn minh họa. Không thêm finding/count giả. Phụ thuộc P0.2. | Vừa | Vừa-cao | Trang giống dashboard hoặc claim giả | Không che copy/CTA; không dựa màu đơn; SVG trang trí aria-hidden; reduced motion đọc được. |
| P2.2 — Tương tác progress nếu user test ủng hộ | 8 segment hiện chỉ báo tiến độ | `FlightMissionExperience.tsx` | ux-audit, accessibility | Nếu thêm, dùng button/anchor có label và scroll native, không thành carousel. Phụ thuộc P0.1. | Vừa | Vừa | Nhảy cảnh/nhiều tab stop | Có accessible name, keyboard activation, focus đích hợp lý; reduced motion giữ quyền cuộn. |
| P2.3 — Giới hạn pointer follow | Tăng phản hồi nhưng biên hiệu ứng hiện rộng | `FlightMissionExperience.tsx` | gsap-performance, accessible-animation | Chỉ fine pointer/hover; clamp nhỏ; pause khi tab hidden/reduced motion; mobile static. | Thấp-vừa | Thấp-vừa | Nhiễu, motion sensitivity, pin | Không chạy touch/reduced; không che text; listener/tween cleanup được xác minh. |

## P3 — Polish & Optimization

| Task | Lý do | Files/components | Skill | Hướng triển khai / dependencies | Khó | UX impact | Rủi ro | Acceptance criteria |
|---|---|---|---|---|---|---|---|---|
| P3.1 — Responsive images | Story dùng URL trực tiếp, không srcset | `FlightMissionExperience.tsx`, `media.ts`, landing assets | ui-ux-pro-max, gsap-performance | SrcSet/sizes WebP; preload ảnh đầu; lazy theo scene tương lai; xác minh waterfall. Phụ thuộc P0.4/asset map. | Vừa | Cao | Ảnh mờ hoặc tải hai bản | LCP không xấu hơn baseline; mobile chọn bản phù hợp; không tải cả 8 ảnh nếu waterfall xác nhận. |
| P3.2 — Dọn CSS theo miền | Nhiều thế hệ selector làm khó review | `landing.css` | tailwind-design-system, frontend-design-pro | Tách shell/header/story/chatbot; xóa dead rules sau khi xác minh references và visual baseline. Không migrate framework. | Vừa-cao | Vừa | Mất style do cascade | Không đổi behavior/layout; selector bị loại xác minh không có consumer; responsive/reduced motion kiểm tra lại. |
| P3.3 — Motion tokens + reduced-motion live update | Duration/rule phân tán | `FlightMissionExperience.tsx`, `landing.css` | accessible-animation, gsap-performance | Chuẩn hóa timing; theo dõi setting đổi trong session; static scene model. | Vừa | Cao | Motion bật sai khi setting đổi | Reduced mode bỏ movement lớn nhưng giữ orientation/status/CTA; đổi setting phản ánh ngay. |
| P3.4 — Benchmark sau hiệu ứng | Không tăng cost chỉ theo cảm giác | Landing runtime | ui-check, webapp-testing, gsap-performance | So baseline/after desktop và mobile tầm trung; LCP, waterfall, frame pacing, long task. | Vừa | Cao | Số đo khác môi trường | Lưu environment/phương pháp; không tuyên bố 60fps nếu chưa đo lặp. |

## MVP sáng tạo nhất với chi phí hợp lý

1. Hoàn thành P0.1–P0.3 để keyboard, trust và scene state vững.
2. Dùng P1.1 + P1.2 với GSAP/ScrollTrigger, SVG, ảnh hiện có; route làm sợi chỉ xuyên suốt, chỉ 2 handoff dùng mask/crop rõ.
3. Dùng Lottie drone hiện tại trên desktop; tĩnh/ít chuyển động trên mobile và reduced motion.
4. Thêm tối đa một overlay SVG nhẹ ở cảnh khảo sát/hạ tầng; disclosure minh họa; giữ copy, thứ tự và CTA.
5. Đo tải ảnh/frame pacing rồi mới mở rộng interaction/asset.

MVP không cần Lenis, Three.js, Rive, video, model drone 3D hoặc thay đổi nghiệp vụ/CTA.
