# UX và Motion Audit hiện trạng

## Cách đánh giá

Nguồn chính: `FlightMissionExperience.tsx`, `LandingPage.tsx`, `landing.css`, asset metadata và một lần xem desktop render tiếng Việt khoảng 1270×720. Mobile đối chiếu bằng CSS; không có runtime screenshot. Hai ảnh tham khảo không xuất hiện dưới dạng file ảnh. Không chạy đo FPS/RAM/network hoặc test suite.

## Điểm tổng hợp

| Nhóm | Điểm / 10 | Bằng chứng và lý do |
|---|---:|---|
| Visual design | **6.5** | Desktop có ảnh tràn khung, lớp phủ tối, chữ lớn dễ thấy, header và CTA rõ. Tuy vậy ảnh là stock phong cảnh, không làm rõ drone đang thao tác; status/ảnh thiếu nhãn minh họa trong active experience, giảm độ tin cậy. |
| Motion design | **6.5** | Có sticky narrative 16 bước, scrub timeline, route SVG, drone Lottie, pointer response và crossfade. Nhưng ảnh đổi chủ yếu bằng opacity/scale; “camera” chỉ transform overlay; drone keyframe chưa bám route; timeline chưa gắn ID cảnh. |
| User experience | **6** | Có skip link, CTA header/cuối, role-aware route, ngôn ngữ, menu mobile, progress 16 chặng và live region. Nhưng trải nghiệm cần nhiều lần cuộn; link trong copy opacity 0 vẫn focus được; status tĩnh có thể giống telemetry thật; mobile runtime chưa xác minh. |
| Engineering | **5.5** | Có useGSAP/gsap.matchMedia, cleanup pointer listener, quickTo, transforms, lazy/fetchPriority/decoding. Rủi ro: CSS 2.980 dòng nhiều lớp; ảnh chính không có srcset; state trigger tách timeline; credit chưa render. Không có benchmark để chấm hiệu năng thực tế. |

## Những gì đã có và hoạt động tốt

- Một stage sticky giữ backdrop trong khi 16 article cuộn qua; article cao `100svh` (`landing.css:198-236, 375-400`).
- Header có skip link; menu mobile có `aria-expanded`/`aria-controls`, đóng bằng Escape; metadata đổi theo locale (`LandingPage.tsx:34-139`).
- CTA giữ routing theo session/role: guest → login, customer → request, role khác → trang role (`resolveCreateRequestTarget.ts`).
- Motion dùng transforms; pointer listener và tween được cleanup (`FlightMissionExperience.tsx:404-509`).
- Có trạng thái chapter/progress và live region; lớp ảnh trang trí được bọc `aria-hidden` (`FlightMissionExperience.tsx:525-661`).
- Reduced motion có guard trước scrub timeline/Lottie và CSS rút thời lượng (`FlightMissionExperience.tsx:230-231, 564-569`; `landing.css:1027-1035`).

## Những gì đã có nhưng cần cải tiến

| Ưu tiên | Phát hiện | Bằng chứng | Hướng xử lý |
|---|---|---|---|
| P1 | Nội dung ẩn vẫn nhận focus | Copy inactive có `opacity: 0; pointer-events: none`, nhưng CTA đầu/cuối luôn có trong DOM; article không có inert/aria-hidden theo active state (`landing.css:2518-2545`; JSX `FlightMissionExperience.tsx:601-647`). pointer-events không loại link khỏi tab order. | Chỉ cho chapter đang nhìn thấy tab-focus; giữ nội dung đọc tuần tự cho screen reader; kiểm tra Tab/Shift+Tab. |
| P1 | Status giống telemetry live nhưng là chuỗi tĩnh | Lấy từ `copy.chapters[activeChapter].state`, không có data source (`FlightMissionExperience.tsx:578-585`). | Gắn nhãn quy trình minh họa hoặc gọi là “bước hiện tại”; không thêm số liệu/mission giả. |
| P1 | Attribution không hiển thị trong trang đang mount | `credits.json` đánh dấu `site-construction.jpg` CC BY 4.0, creditRequired=true; JSX experience không render `.lp-journey-credit`, dù CSS có style (`landing.css:291-317`). | Xác minh attribution; map nguồn/license cho từng ảnh WebP. |
| P2 | 16 cảnh dài 16 viewport | Mỗi article min-height `100svh`; sticky stage (`landing.css:198-207, 383-394, 924-929`). | Giữ cuộn native; rút copy mobile nếu kiểm thử thấy mệt; không pin thêm. |
| P2 | Trigger chapter và master timeline là hai nguồn tiến độ | Trigger ở `62%/38%`, timeline scrub toàn section `scrub: 0.7`, tween đặt theo tỷ lệ (`FlightMissionExperience.tsx:218-392`). | Dùng scene map/label tập trung để đồng bộ backdrop, route, status và progress. |
| P2 | Drone và route cùng tiến độ nhưng chưa cùng hình học | SVG path draw bằng dash offset; drone có tọa độ/rotation riêng (`FlightMissionExperience.tsx:303-391`). | Cho drone theo path/waypoint; nếu không khớp thì xem route là trang trí. |
| P2 | Hai cảnh cùng URL ảnh có thể active cùng lúc | `activeImage` được so bằng URL; scene 1 và 8 đều rail-yard (`FlightMissionExperience.tsx:511, 527-531`). | Chọn active theo chapter ID/index. |
| P2 | Hero đầu tiên chưa hiển thị drone | `pointerFollowEnabled` chỉ bật từ `activeChapter >= 2` và CSS chỉ reveal drone khi `data-drone-visible=true` (`FlightMissionExperience.tsx:404, 520`; `landing.css:2496-2500`). Desktop render đầu trang vì thế chỉ cho thấy ảnh hiện trường và copy. | Nếu drone là tín hiệu nhận diện dịch vụ, đưa nó vào trạng thái staging tĩnh/nhẹ trong cảnh 1; bắt đầu chuyển động theo scroll ở cảnh triển khai. |
| P3 | Helper srcset không được story chính dùng | Active story render `<img src>`; `media.ts` có srcSet cho prototype chưa mount (`FlightMissionExperience.tsx:527-542`). | Thêm picture/srcset/sizes rồi kiểm tra waterfall. |

## Chưa có hoặc chưa xác minh

- Không thấy video, GLB/GLTF, Three.js/R3F hoặc WebGL scene trong landing; không nên dựa vào camera drone 3D nếu chưa có model/footage phù hợp.
- Không có đo FPS, dropped frame, long task, GPU memory, decoded-image memory hoặc waterfall. Tám ảnh nằm trong một sticky stage nên cần đo trước khi kết luận cách browser áp dụng lazy loading.
- CSS có breakpoint 700px/390px, đổi bố cục copy và kích thước route/drone; runtime mobile chưa xác minh. Cần kiểm tra 375px, 768px, 1024px, 1440px.
- Hai ảnh tham khảo không có file đính kèm để so sánh mood/brand.

## Phân loại motion

| Trạng thái | Hiện tại | Nhận xét |
|---|---|---|
| Luôn hiện | Header, backdrop active, status, progress, copy active, chatbot FAB | CTA header luôn sẵn; chatbot cố định ở góc dưới. |
| Theo scroll | Active chapter, backdrop crossfade, copy fade-up, camera overlay transform, SVG route, drone keyframe | Tập trung vào một stage; chỉ giữ motion mang nghĩa. |
| Theo tương tác | Pointer follow từ chapter 3; menu, chatbot, language toggle | Pointer không phải đường duy nhất để hiểu nội dung. |
| Lặp | Lottie drone loop nếu không bật reduced motion | Cần trạng thái tĩnh có nghĩa. |
| Chỉ chạy một lần (đề xuất) | Reveal headline khi vào story | Không chạy lại ở mỗi lần cuộn lên/xuống. |
| Giảm/bỏ trên mobile (đề xuất) | Pointer follow, nghiêng scene, parallax sâu, motion path lớn | Mobile cần kiểm tra trên thiết bị thật. |

## Top 5 vấn đề theo tác động

1. **Focus vào CTA vô hình** ở chapter không active.
2. **Ảnh minh họa/status thiếu disclosure rõ**, trong khi status là hardcoded.
3. **Credit CC BY 4.0 không xuất hiện** ở component hiện hành.
4. **Ảnh chưa liền mạch về địa điểm thực**: video 16 giây nối chuyển động drone qua ảnh stock từ nhiều hiện trường khác nhau; nội dung cần tiếp tục ghi rõ đây là hành trình minh họa.
5. **Responsive/performance chưa có bằng chứng runtime**: chưa đo tải ảnh/FPS và chưa xem mobile render.
