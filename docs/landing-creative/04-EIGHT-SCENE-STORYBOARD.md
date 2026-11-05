# Storyboard gốc cho 8 cảnh

Tài liệu này giữ lại bản storyboard ban đầu. Landing hiện đã mở rộng lên 16 chặng; tám chặng bay bổ sung nằm giữa phần tiếp cận vị trí khó và phần rà soát kết quả trong `FlightMissionExperience.tsx`.

## Thứ tự và copy hiện có

Dữ liệu lấy từ `copyByLanguage` trong `src/features/landing/showcase/FlightMissionExperience.tsx:27-180`. Ở chapter 1, object có title/body riêng nhưng JSX dùng `heroTitleLines`/`heroLede` từ `LandingPage`; headline tiếng Việt đang render là “Kiểm tra an toàn hơn. Nắm rõ kết quả.” (`FlightMissionExperience.tsx:609-620`, `LandingPage.messages.ts`, `content.ts`). Đề xuất giữ thứ tự và ý chính.

## Storyboard từng scene

### 01 — Mở hành trình / yêu cầu hiện trường
- **Hiện có:** eyebrow “Giám sát hiện trường theo yêu cầu”; hero copy từ parent; status “Sẵn sàng triển khai”; `rail-yard.jpg`.
- **Mục tiêu:** giải thích dịch vụ từ yêu cầu tới kết quả bàn giao; đặt người xem ở điểm xuất phát.
- **Bố cục:** ảnh toàn màn hình, hero bên trái; negative space phía phải cho drone/route. Status cần nhãn minh họa nếu không có data thật.
- **Entrance:** fade nhẹ eyebrow → headline → mô tả; CTA header sẵn. Không preloader.
- **Theo scroll:** progress bắt đầu 1/8; một đoạn SVG route xuất hiện sau scroll đầu.
- **Drone:** Lottie hiện có ở staging, tĩnh hoặc hover nhẹ; không lộ “bay” trước scene triển khai.
- **Camera/nền:** crop rail-yard ổn định; scale tối đa 1.01–1.02 nếu performance cho phép.
- **Typography:** giữ headline hiện tại; không đổi ý nghĩa/thêm số liệu.
- **Handoff:** route kéo mắt về hướng triển khai; copy rút khi scene 2 vào.
- **Asset/perf:** `rail-yard.jpg` (credit CC0 theo metadata); ưu tiên ảnh đầu. Đây là phong cảnh minh họa, không xác nhận site khách hàng.

### 02 — Triển khai
- **Hiện có:** “Sẵn sàng. Bắt đầu hành trình.”; đội bay chuẩn bị thiết bị/tiếp cận khu vực; status “Đang triển khai”; `site-construction.jpg`.
- **Mục tiêu:** chuyển từ ý định sang chuẩn bị vận hành.
- **Bố cục:** text ở vùng ít chi tiết; route tiến về điểm khảo sát; không thêm HUD dày.
- **Entrance:** label/heading fade-up 12–16px.
- **Theo scroll:** route vẽ thêm; marker “khu vực cần kiểm tra” chỉ minh họa nếu không có dữ liệu thật.
- **Drone:** rời staging theo path; dùng Lottie hiện có.
- **Camera/nền:** crossfade ảnh công trường, horizon ổn định; hạn chế xoay cả scene.
- **Typography:** eyebrow “Triển khai” trước headline; status theo chapter.
- **Handoff:** route tiếp tục sang solar field.
- **Asset/perf:** `site-construction.jpg` khoảng 1 MB, CC BY 4.0 cần attribution; responsive image, không preload đủ 8 ảnh.

### 03 — Khảo sát khu vực
- **Hiện có:** “Quét toàn cảnh từng dãy pin.”; ghi nhận hiện trạng/đồng bộ ảnh với điểm giám sát; `solar-field.jpg`.
- **Mục tiêu:** diễn tả khảo sát diện rộng.
- **Bố cục:** mở rộng khoảng trống; có thể viền vùng site bằng SVG boundary nhẹ.
- **Entrance:** crossfade ảnh, boundary xuất hiện sau khi ảnh ổn định.
- **Theo scroll:** route/boundary reveal theo tiến độ; không hiện count hoàn thành giả.
- **Drone:** di chuyển cung ngắn; tránh rung/hover liên tục.
- **Camera/nền:** crop theo dãy pin; parallax foreground rất nhỏ hoặc bỏ trên mobile.
- **Typography:** giữ copy; bảo đảm tương phản trên ảnh sáng.
- **Handoff:** boundary thu thành tuyến dẫn sang scene 4.
- **Asset/perf:** `solar-field.jpg` (~1,09 MB; CC0 theo metadata); cần srcset và thử mạng chậm.

### 04 — Theo tuyến hạ tầng
- **Hiện có:** “Bám sát tuyến hạ tầng dài.”; theo dõi đường dây/nhiều vị trí; `transmission-tower.jpg`.
- **Mục tiêu:** chuyển phạm vi từ khu vực thành tuyến dài.
- **Bố cục:** tower ngoài vùng text; SVG route nối các marker.
- **Entrance:** route draw trước, heading xuất hiện khi route đến điểm đầu.
- **Theo scroll:** marker tuyến sáng lần lượt; chỉ minh họa, không gắn tọa độ.
- **Drone:** đi theo cùng route của scene 3; không thêm detection box.
- **Camera/nền:** đổi crop theo hướng tuyến thay vì xoay perspective nhiều.
- **Typography:** giữ copy; status không giả “đang bay” nếu là demo.
- **Handoff:** chuyển góc nhìn rộng sang chi tiết công trình.
- **Asset/perf:** `transmission-tower.jpg` (CC0 theo metadata); dùng một SVG path, tránh nhiều blur/pulse.

### 05 — Kiểm tra công trình
- **Hiện có:** “Quan sát an toàn từ trên cao.”; rà soát công trình/ghi nhận điểm chú ý; `construction-1280.webp`.
- **Mục tiêu:** minh họa quan sát công trình, không khẳng định đã phát hiện sự cố thực.
- **Bố cục:** ảnh chiếm khung; tối đa một marker, không dùng màu cảnh báo khi không có finding.
- **Entrance:** focus crop nhẹ; tránh zoom mạnh.
- **Theo scroll:** marker xuất hiện sau khi người xem hiểu ảnh; có thể click để đọc chú giải minh họa.
- **Drone:** giữ ổn định, không che subject.
- **Camera/nền:** tối đa một lớp parallax; fade theo CSS.
- **Typography:** giữ eyebrow/copy, tránh marker đè nội dung.
- **Handoff:** marker thành mục “cần rà soát”, không tuyên bố lỗi.
- **Asset/perf:** `construction-1280.webp`; cần truy xuất nguồn/license; dùng cặp 640/1280 và sizes.

### 06 — Tiếp cận vị trí khó
- **Hiện có:** “Đến gần vị trí khó tiếp cận.”; ghi hình vị trí cao/khu vực khó tiếp cận; `infrastructure-1280.webp`.
- **Mục tiêu:** cho thấy giá trị quan sát từ xa trong phạm vi copy hiện tại.
- **Bố cục:** cấu trúc cao làm điểm neo; tuyến đứng/marker nhỏ gợi góc tiếp cận.
- **Entrance:** chuyển crop rộng sang cận vừa phải; không mô phỏng cảm giác rơi.
- **Theo scroll:** camera overlay đổi vị trí chậm; status hiển thị 6/8.
- **Drone:** lùi ra để thấy quy mô; không vẽ sensor cone nếu thiếu logic/asset.
- **Camera/nền:** giữ horizon, giảm parallax mobile; không che copy bằng HUD.
- **Typography:** giữ copy; overlay mềm giúp contrast.
- **Handoff:** route rời hiện trường, dẫn thành media strip ở scene 7.
- **Asset/perf:** `infrastructure-1280.webp`; cần provenance, chọn WebP 640 mobile nếu rõ nét.

### 07 — Rà soát kết quả
- **Hiện có:** “Ảnh, video và checklist cùng một hồ sơ.”; bằng chứng/đánh giá tập hợp để rà soát; “Đang gửi dữ liệu”; `landscape-1280.webp`.
- **Mục tiêu:** chuyển thu thập sang rà soát; không khẳng định đã hoàn tất kiểm duyệt.
- **Bố cục:** ảnh làm context; HTML panel với nhãn “Ảnh / Video / Checklist” như khái niệm, không sinh dữ liệu/thumbnail giả.
- **Entrance:** panel opacity/translate nhỏ sau copy.
- **Theo scroll:** nhấn từng mục bằng màu/underline, không count-up.
- **Drone:** rời trung tâm; route vẫn là motif.
- **Camera/nền:** giảm chuyển động để người đọc nghỉ trước cảnh cuối.
- **Typography:** giữ headline; gọi status là “Bước rà soát” nếu vẫn tĩnh.
- **Handoff:** route trở về điểm mở đầu.
- **Asset/perf:** `landscape-1280.webp`; nguồn/license cần map; UI là HTML/CSS.

### 08 — Trở về và bàn giao
- **Hiện có:** “Hạ cánh an toàn. Sẵn sàng cho lần bay tiếp.”; kết quả gửi để rà soát/bàn giao; `rail-yard.jpg`; CTA tạo yêu cầu.
- **Mục tiêu:** đóng hành trình, dẫn tới CTA hiện hữu.
- **Bố cục:** lặp crop/motif scene 1; CTA không bị chatbot che.
- **Entrance:** CTA fade-in khi chapter active; focus ring nhìn thấy.
- **Theo scroll:** route về điểm xuất phát, progress 8/8; không thêm state hoàn thành thật.
- **Drone:** dừng ở trạng thái đỗ; chỉ Lottie hiện có.
- **Camera/nền:** reset crop/transform; giữ frame tĩnh để đọc CTA.
- **Typography:** giữ copy; CTA tiếp tục nhận `createRequestTarget` từ parent.
- **Handoff:** kết thúc ở CTA; không thêm footer như thể đã tồn tại.
- **Asset/perf:** `rail-yard.jpg` (CC0 theo metadata); freeze timeline cuối, CTA dùng được bằng keyboard.

## Luật motion thống nhất

1. Một scene map chứa ID, asset, crop, title, status label và marker; progress, copy, status, route, backdrop cùng đọc active scene/progress.
2. Mỗi handoff chỉ có một transition lớn. Copy dùng opacity/dịch ngắn; backdrop crossfade; route/drone cùng progress.
3. Không giả telemetry, cảnh báo, detection, checklist hoàn tất hoặc thống kê nếu backend không cung cấp.
4. Desktop có thể giữ pointer follow nhẹ; mobile không dựa hover.
5. Reduced motion bỏ parallax/scale/flight path; giữ ảnh/chapter tĩnh, status/progress và CTA rõ.
6. Mobile giữ native scroll; không thêm scroll hijack, Lenis hoặc pin dài hơn stage hiện tại.
