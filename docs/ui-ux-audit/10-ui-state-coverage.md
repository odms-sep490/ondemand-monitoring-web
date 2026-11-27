# 10 — Kiểm toán Độ phủ Trạng thái UI (UI State Coverage)

| Trạng thái UI | Mức độ phủ hiện tại | Chi tiết kiểm toán từ mã nguồn & runtime |
| --- | :---: | --- |
| `DEFAULT` | Đầy đủ | Các trang chính render sạch khi đủ dữ liệu |
| `HOVER` / `ACTIVE` | Đầy đủ | Có hiệu ứng hover trên nút, card, table row, scene button |
| `FOCUS` | **Thiếu (P1)** | `37` vị trí xóa `outline` bàn phím không có `:focus-visible` thay thế |
| `DISABLED` | Khá | Nút submit khi đang gửi (`loading`/`disabled`) có khóa chống bấm đúp ở các form chính (`OrderFeedbackCard`, `CreateOrder`, `Postflight`) |
| `LOADING` | Tốt | Có `RouteLoading`, `DashboardSkeleton`, thanh `%` tải 3D GLB |
| `EMPTY` | Tốt | Có `DashboardEmptyState`, `EmptyState` (nhưng trùng lặp ở 2 thư mục `ui/` và `antd/`) |
| `ERROR` | Khá | Có `StateView state="error"` + nút `Thử lại`; `Interactive3DDroneStage` có màn lỗi + nút tải lại |
| `SUCCESS` | Khá | Dùng `message.success` (Antd) và `Toast` riêng (cần thống nhất 1 cơ chế thông báo) |
| `PENDING` | Khá | Có trạng thái chờ duyệt/chờ báo giá/chờ đặt cọc trên `OrderDetail` & `Dashboard` |
| `UNAUTHORIZED` | Khá | `RoleRoute` điều hướng về `#auth/login` hoặc home đúng vai trò (`router.tsx:113-137`) |
| `OFFLINE` | **Lỗi (P1)** | Khi không gọi được API kiểm tra phiên, `SessionFeedback` chặn cả trang công khai `#help` và `#auth/login` |
| `PARTIAL_DATA` | Trung bình | Một số màn hình (như `DashboardPage`) có `normalizeDashboard()` rất tốt; cần mở rộng defensive fallback tương tự cho các màn hình con ít dùng |
| `LONG_TEXT` (Tiếng Việt) | **Có lỗi (P0/P2)** | Nhãn `Tạo yêu cầu giám sát` bị cắt ở Header Mobile `375px`; các chuỗi tiếng Việt dài trong thẻ bảng dễ xuống dòng lệch nếu thiếu `min-width: 0` |
| `LARGE_DATASET` | Trung bình | Có phân trang `TableComponent` / `GridPagination`; một số danh sách hoạt động chưa có virtual scrolling khi dữ liệu hàng nghìn bản ghi |
