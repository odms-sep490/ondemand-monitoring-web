# 11 — Kiểm toán Hành trình Người dùng & Nghiệp vụ (User Journey Audit)

## 1. Các vai trò người dùng trong hệ thống
1. **Khách truy cập (`GUEST`)**: Landing Page → Xem mô phỏng 3D ĐH FPT → Xem dịch vụ/quy trình → Đăng ký/Đăng nhập hoặc xem Trung tâm trợ giúp (`#help`).
2. **Khách hàng (`CUSTOMER`)**: Tạo yêu cầu giám sát (`CreateOrderPage`) → Theo dõi duyệt & báo giá (`OrderDetailPage`) → Ký hợp đồng & đặt cọc 30% → Theo dõi bay/nhiệm vụ → Thanh toán phần còn lại → Nghiệm thu & đánh giá (`OrderFeedbackCard`).
3. **Quản lý (`MANAGER`)**: Bảng điều khiển 5 tab (`DashboardPage`) → Duyệt đơn & lập báo giá (`OrderReviewPage`) → Lập kế hoạch nhiệm vụ & điều phối (`MissionCreatePage`, `MissionDispatchPage`) → Quản lý lịch, drone, bảo trì & nguồn lực (`ResourceLifecyclePage`).
4. **Nhân sự / Phi công / Kỹ thuật (`STAFF`)**: Danh sách nhiệm vụ (`MissionListPage`) → Tổng quan nhiệm vụ (`MissionDetailPage`) → Kiểm tra trước bay (`PreflightPage`) → Bàn giao (`HandoverPage`) → Bay (`FlightPage`) → Kiểm tra sau bay (`PostflightPage`) → Tải ảnh/video (`UploadMediaPage`) → Xử lý phiếu bảo trì (`MaintenanceWorkflowDrawer`).
5. **Quản trị viên (`ADMIN`)**: Tài khoản, phân quyền, danh mục dịch vụ/checklist, cấu hình vận hành, hoàn tiền, AI Ops (10 tab), nhật ký kiểm toán.

## 2. Điểm nghẽn UX phát hiện theo hành trình
| Hành trình | Điểm nghẽn UX | Mức độ | Khuyến nghị |
| --- | --- | :---: | --- |
| **Guest → Tạo yêu cầu (Mobile)** | Nút CTA chính trên header bị cắt chữ ở `375px` (`landing-375px.png`) | **P0** | Rút gọn/ẩn CTA thừa trên header mobile |
| **Guest → Khám phá Hero 4 cảnh** | Bong bóng AI Mascot đè lên `CAM 3` và `CAM 4` (`landing-1440px.png`) | **P1** | Tách vùng neo mascot và thanh chọn cảnh |
| **Guest → Quên mật khẩu / Trợ giúp** | `#auth/forgot-password` rơi về Landing Page; `#help` bị khóa khi mất kết nối API phiên | **P1** | Mở public `#help` độc lập với `restoreAuthSession`; map chuẩn route quên mật khẩu |
| **Customer → Lịch sử nhiệm vụ** | `customerHref({ screen: 'missionHistory' })` tạo URL bị `parseCustomerRoute` trả `notFound` | **P1** | Xóa dead route hoặc nối về đúng màn hình lịch sử |
| **Admin → Chia sẻ link có bộ lọc** | `parseAdminRoute` không tách `?query` (`admin/routes.ts:46`) gây `notFound` | **P1** | Dùng `hash.split('?')[0]` giống Manager/Customer |
| **Staff → Chuyển màn hình vận hành** | Bundle `DroneOperatorHomePage.js` (`530.5 KB`) + `omss/screens/*` cũ chưa đồng nhất UI với các trang mới | **P2** | Tách lazy-load từng màn hình staff và dọn dần inline styles |
