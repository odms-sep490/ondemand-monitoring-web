# Creative directions cho OnDemand Monitor

## Nguyên tắc chung

- Kể đúng quy trình hiện có: yêu cầu → triển khai → khảo sát khu vực → theo tuyến → kiểm tra công trình → tiếp cận vị trí khó → rà soát kết quả → trở về/bàn giao.
- Không thêm phát hiện AI, cảnh báo thật, tọa độ, số lượng vật thể, thời gian bay, dữ liệu khách hàng hay cam kết an toàn chưa có trong source.
- Giữ CTA và route theo vai trò; direction không thay đổi nghiệp vụ.
- Ảnh hiện là stock; ghi rõ tính minh họa và source credit. Chỉ bổ sung asset khi tạo được continuity thật.

## So sánh ba hướng

| Direction | Core idea / trải nghiệm | Điểm khác biệt và motion | Asset / stack | Tương thích source | Độ khó | Rủi ro hiệu năng | Mobile |
|---|---|---|---|---|---|---|---|
| **A — Drone Mission Journey** | Theo một chuyến giám sát từ chuẩn bị tới bàn giao; drone/flight path dẫn mắt qua 16 chặng. | Quỹ đạo dài qua nhiều lượt khảo sát rồi trở về; status là bước minh họa, không phải live data. | GSAP + ScrollTrigger, video drone Blender; SVG/Lottie làm fallback. Muốn liền mạch địa điểm thực cần footage cùng dự án và quyền sử dụng. | Cao: tái dùng chapters, sticky stage, progress và video. | Vừa | Vừa; video cần tải và decode trong lúc cuộn. | Cao nếu reduced motion giữ ảnh và cuộn native. |
| **B — Cinematic Scroll Experience** | Các cảnh nối thành hành trình hình ảnh thay vì slideshow; đường chân trời/đường bay nối bối cảnh. | Mask reveal ở một số handoff, scale rất nhẹ, parallax giới hạn; typography vào theo nhịp. Không dùng effect mới ở mọi chapter. | GSAP/ScrollTrigger, CSS transforms/opacity, SVG; ảnh wide có crop tương thích. Không cần package mới. | Cao: tận dụng sticky stage/image layers; cần thay timeline/keyframe. | Vừa-cao | Vừa; mask/blur/full-screen paint phải giới hạn và đo. | Vừa-cao nếu giản lược thành crossfade/chuyển động nhỏ. |
| **C — Field Intelligence Overlay** | Cảm giác quan sát lượt kiểm tra hiện trường, marker vừa đủ để hiểu vùng đang được ghi nhận. | Boundary, route, target marker, scan beam xuất hiện có chủ đích; mỗi cảnh tối đa một overlay. Gắn nhãn minh họa, không giả telemetry/findings. | Inline SVG/CSS và assets hiện có; tham khảo `InspectionMedia.tsx`. Không cần Three/WebGL. | Vừa: có SVG route trong active page, prototype overlay chưa mount. | Vừa | Thấp-vừa; blur/glow liên tục có thể tốn GPU. | Cao nếu marker đơn giản, tương phản tốt, không dựa hover. |

## Đánh giá chọn hướng

| Tiêu chí | A | B | C |
|---|---:|---:|---:|
| Liên kết nghiệp vụ | 5/5 | 4/5 | 4/5 |
| Tận dụng source | 5/5 | 4/5 | 4/5 |
| Nét riêng thương hiệu | 4/5 | 5/5 | 4/5 |
| MVP tiết kiệm | 5/5 | 3/5 | 4/5 |
| Giảm chuyển động cho mobile | 5/5 | 3/5 | 4/5 |

### Khuyến nghị: A làm xương sống, B cho handoff, C làm lớp tín hiệu

Chọn **A + B**, giữ **C** ở mức overlay SVG chọn lọc. A gắn 16 chặng thành một nhiệm vụ; B tạo handoff liền mạch tại vài điểm thay vì thêm chuyển động mọi nơi; C giải thích khu vực kiểm tra mà không biến trang thành dashboard. Dùng GSAP/ScrollTrigger đã có; không thêm Lenis, Three.js, R3F hay shader trong MVP.

## Top 10 ý tưởng nâng cấp

Thứ tự dựa trên impact, khả năng triển khai với source và khả năng tái sử dụng.

| # | Ý tưởng | Impact | Feasibility | Tái sử dụng |
|---:|---|---|---|---|
| 1 | Chỉ cho chapter hiện tại tab-focus; CTA vô hình không nhận focus | Cao | Cao | Cao |
| 2 | Đồng bộ active chapter, progress, status, ảnh và timeline từ một scene map | Cao | Cao | Cao |
| 3 | Nối drone với đường SVG đang vẽ để chuyển động có nguyên nhân | Cao | Vừa | Cao |
| 4 | Disclosure “Hình ảnh/quy trình minh họa” và map attribution | Cao | Cao | Cao |
| 5 | Handoff bằng crop/heading/đường bay lặp lại, giữ 16 chặng và nội dung | Cao | Vừa | Cao |
| 6 | Dùng responsive srcset 640/1280 cho WebP hiện có | Vừa-cao | Cao | Cao |
| 7 | Phân vai backdrop/copy/route/drone thành lớp riêng với transform nhỏ | Vừa-cao | Vừa | Cao |
| 8 | Rút gọn/đổi bố cục cuộn tuyến tính trên mobile nếu kiểm thử cho thấy mệt | Vừa-cao | Vừa | Vừa |
| 9 | Map nguồn/license nhất quán; bổ sung credit cho ảnh yêu cầu | Cao | Cao | Cao |
| 10 | Profile ảnh/timeline trên desktop, mobile và máy cấu hình thấp trước khi thêm effect | Cao | Vừa | Cao |

## Asset còn thiếu (không bắt buộc cho MVP)

1. Ảnh/footage được cấp quyền, liên tục môi trường/góc nhìn để kể hành trình thống nhất; hiện có ảnh từ nhiều bối cảnh.
2. Nếu muốn drone 3D, cần model/sequence và giấy phép rõ; hiện chưa thấy GLB trong source.
3. Mapping nguồn/license cho `construction-640/1280.webp`, `infrastructure-640/1280.webp`, `landscape-640/1280.webp` cần được lưu cùng asset.
