# 12 — Bảng chấm điểm từng trang (Page-by-Page Scorecards)

**Thang điểm trọng số (100 điểm)**: Thiết kế thị giác (15) · Tính khả dụng (20) · Nhất quán Design System (15) · Responsive (15) · Accessibility (15) · Hiệu năng (10) · Trạng thái UI & Tương tác (10).  
*Các trang cần đăng nhập chưa đo được runtime trên server local sẽ ghi rõ `N/A (mã nguồn only)` cho các cột phụ thuộc runtime thay vì chấm bừa.*

| Xếp hạng ưu tiên sửa | Trang / Nhóm trang | Thị giác (15) | Khả dụng (20) | Nhất quán (15) | Responsive (15) | A11y (15) | Hiệu năng (10) | UI State (10) | Tổng / Độ phủ | Lý do trừ điểm chính |
| :---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: | --- |
| **1** | **Auth (`#auth/login`, `register`, `forgot`)** | 10 | 11 | 10 | 11 | 8 | 9 | 4 | **63 / 100** | Bị `SessionFeedback` khóa khi offline; `#auth/forgot-password` rơi về Landing; `3` lỗi `outline: none` (`auth.css:325,938,1026`); 5 nút nhỏ mobile |
| **2** | **Help Center (`#help`)** | N/A | 10 | 11 | 12 | 11 | 9 | 3 | **56 / 85** *(runtime blocked)* | Trang công khai bị khóa hoàn toàn khi API phiên ngoại tuyến |
| **3** | **Landing Page (`/`)** | 13 | 16 | 12 | 9 | 10 | 7 | 8 | **75 / 100** | **P0** cắt CTA header `375px`; **P1** AI Mascot đè `CAM 3/4`; 27 touch target `< 36px`; GLB chưa nén Draco (9.92 MB) |
| **4** | **Customer CreateOrder** *(mã nguồn)* | N/A | N/A | 7 | N/A | 8 | 6 | 7 | **28 / 50** *(static)* | **7,481 dòng CSS** phân mảnh qua 3 file; `OrderConversation.css:1038` `z-index: 1600`; `Checklist.css:155,218` `outline: none` |
| **5** | **Staff Drone Operator** *(mã nguồn)* | N/A | N/A | 6 | N/A | 9 | 5 | 7 | **27 / 50** *(static)* | Bundle `530.5 KB` + `175.3 KB` CSS; `omss/screens/*` dùng 43–51 inline styles/tệp; `ChecklistEvidencePanel.css` có 66 `!important` |
| **6** | **Manager Portal** *(mã nguồn)* | N/A | N/A | 8 | N/A | 10 | 6 | 8 | **32 / 50** *(static)* | `manager.css` 4,893 dòng + `dashboard.scss` 3,601 dòng; `MissionGridDroneAssignment.css:286` `z-index: 12000` |
| **7** | **Admin Portal** *(mã nguồn)* | N/A | 14 | 8 | N/A | 8 | 7 | 7 | **44 / 70** *(static)* | `parseAdminRoute` lỗi khi có `?query`; `refund-management.css` & `pricingDraftEditor.css` xóa `outline: 0` |
