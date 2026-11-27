# 03 — Kiểm toán Mã nguồn UI (Source Code UI Audit)

Áp dụng quy tắc **Vercel Web Design Guidelines** trên toàn bộ `797` tệp `.tsx` sản xuất và `150` tệp `.css/.scss` (`85,173` dòng).

## 1. Bảng tổng hợp các vi phạm đo được bằng quét tĩnh
| Hạng mục kiểm tra | Số lượng | Mức độ | Ví dụ `file:line` xác thực |
| --- | ---: | :---: | --- |
| Lạm dụng `!important` | **277** | **P1** | `src/features/mission/components/ChecklistEvidencePanel.css` (66), `PreflightChecklist.css` (24), `ImageQualityPanel.css` (24), `aiOperations.css` (18) |
| Màu hex cứng ngoài token | **1,295 màu** | **P1** | Rải khắp `manager.css`, `CreateOrder.css`, `finance.css`, `landing.css` |
| Inline `style={{...}}` trong TSX | **1,649 khối** | **P2** | `OperatorDashboardPage.tsx` (70), `omss/screens/MissionDetail.tsx` (51), `SysOpOverview.tsx` (51), `StaffAssignmentPage.tsx` (50), `PoliciesTab.tsx` (45) |
| Xóa viền focus `outline: none/0` | **37 vị trí** | **P1** | `auth.css:325,938,1026`, `Checklist.css:155,218`, `refund-management.css:77,1251`, `pricingDraftEditor.css:71,378`, `baseChecklistPricing.css:156` |
| Leo thang `z-index >= 1000` | **13 vị trí** | **P1** | `MissionGridDroneAssignment.css:286` (`12000`), `FlightCockpit.css:234` (`2000`), `OrderConversation.css:1038` (`1600`), `notifications.css:28` (`1600`) |
| CSS đơn khối quá lớn (> 2,000 dòng) | **8 tệp** | **P2** | `manager.css` (4,893), `CreateOrder.css` (3,834), `landing.css` (3,619), `finance.css` (3,614), `dashboard.scss` (3,601), `planning.css` (2,583), `refund-management.css` (2,454), `CreateOrder.refinement.css` (2,315) |
| `<img>` thiếu `alt` | **0** | PASS | Tuân thủ tốt |
| `target="_blank"` thiếu `noopener` | **0** | PASS | Tuân thủ tốt |
| `div/span` có `onClick` thiếu role/keyboard | **0** | PASS | Tuân thủ tốt (trừ các widget bên thứ 3 cần kiểm tra runtime) |

## 2. Phân tích nguyên nhân gốc rễ trong mã nguồn
1. **Chiến tranh Specificity (`!important` & file CSS phình to)**: Nhiều tính năng (như `CreateOrder` có cả `CreateOrder.css` 3,834 dòng + `CreateOrder.refinement.css` 2,315 dòng) dùng file override nối đuôi thay vì sửa trực tiếp rule gốc, buộc phải dùng `!important` và làm CSS build lên tới **1,494.6 KB**.
2. **Thiếu lớp `z-index` chuẩn hóa**: Ant Design dùng `z-index: 1000` cho Modal/Drawer/Popover, nhưng `MissionGridDroneAssignment.css:286` đặt `12000` và `notifications.css:28` đặt `1600` khiến panel tùy biến có thể đè lên hộp thoại xác nhận hoặc dropdown hệ thống.
3. **Di sản màn hình `omss/screens/*`**: Các màn hình trong `src/features/drone-operator/omss/screens/` chứa tới 43–51 inline `style={{...}}` mỗi tệp, không đồng bộ token dark mode và không dùng Ant Design / `shared/components`.
4. **Trùng lặp thư viện chuyển động trong `package.json`**: Cài đồng thời `framer-motion` (`^14.6.0`), `motion` (`^14.6.0`), `gsap` (`^3.15.0`) và `lottie-react` (`^3.1.2`) làm phình dependency và thiếu nhất quán easing/duration.
