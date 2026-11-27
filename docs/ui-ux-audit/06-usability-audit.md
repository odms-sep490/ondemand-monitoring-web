# 06 — Kiểm toán Tính khả dụng theo Nielsen's Heuristics (Usability Audit)

| Nguyên tắc Nielsen | Đánh giá | Phát hiện cụ thể từ mã nguồn & Playwright |
| --- | :---: | --- |
| **1. Hiển thị trạng thái hệ thống** | Khá | Có `RouteLoading`, `StateView`, thanh tiến độ 3D (`loadProgress%`). **Điểm trừ**: Khi offline/mất kết nối API, `SessionFeedback` (`router.tsx:139-170`) khóa cả trang công khai `#help` và `#auth/login` mà không chỉ rõ dịch vụ backend đang ngoại tuyến. |
| **2. Khớp với thế giới thực** | Tốt | Thuật ngữ tiếng Việt nhất quán trong luồng bay (`Kiểm tra trước bay`, `Bàn giao`, `Kiểm tra sau bay`, `Nghiệm thu`). Đã loại bỏ thuật ngữ kỹ thuật giả lập (`PX4/Gazebo`) ở màn hình quản lý. |
| **3. Quyền kiểm soát & tự do người dùng** | Trung bình | `OrderDetailPage` và `CreateOrderPage` có quay lại/hủy, nhưng `#auth/forgot-password` rơi im lặng về Landing Page thay vì mở đúng form quên mật khẩu hoặc báo 404 rõ ràng. |
| **4. Nhất quán & chuẩn mực** | **Yếu** | 3 bộ component dùng chung song song (`ui/`, `antd/`, `odm/`), 2 kiểu `PageHeader`, 3 kiểu `StatusBadge/StatusTag`, độ cao nút và bo góc khác nhau giữa các portal. |
| **5. Phòng ngừa lỗi** | Khá | `CreateOrder` có kiểm tra vùng bay và checklist; `Postflight` có nút đánh dấu nhanh và kiểm tra pin. **Điểm trừ**: `admin/routes.ts:46` không cắt query string nên link chia sẻ có `?tab=...` dễ rơi vào `notFound`. |
| **6. Nhận diện thay vì ghi nhớ** | Khá | Thanh tiến trình 7 bước trên `MissionDetail` rõ ràng; bộ lọc hành động Manager có số đếm badge. |
| **7. Linh hoạt & hiệu suất thao tác** | Trung bình | Trên mobile `LandingPage` (`375px`), nút CTA chính trên header bị cắt chữ nên người dùng khó bấm trực tiếp từ thanh top bar; bong bóng AI Mascot che mất `CAM 3`/`CAM 4`. |
| **8. Thiết kế tối giản & thẩm mỹ** | Trung bình | Một số màn hình nghiệp vụ (`CreateOrder`, `OrderReview`, `Dashboard`) còn dày chữ và nhiều lớp viền lồng nhau; các màn `omss/screens/*` vẫn dùng inline style rời rạc. |
| **9. Hỗ trợ nhận diện & phục hồi lỗi** | Khá | `StateView` và `Interactive3DDroneStage` có nút `Thử lại` / `Tải lại mô hình`. **Điểm trừ**: Chưa phân biệt rõ lỗi mạng tạm thời với lỗi hết phiên đăng nhập trên `#auth/login`. |
| **10. Trợ giúp & tài liệu** | **Yếu khi offline** | Có `HelpCenterHomePage` (`#help`) và `ContextAwareHelpWidget`, nhưng `#help` bị `SessionFeedback` chặn khi API phiên đăng nhập không phản hồi. |
