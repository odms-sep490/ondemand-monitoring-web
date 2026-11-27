# 01 — Danh mục Route & Độ phủ Kiểm toán (Route Inventory)

Hệ thống sử dụng **Hash Routing** (`window.location.hash`) được điều phối tập trung tại [router.tsx](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/app/router.tsx) kết hợp các sub-router theo vai trò (`RoleRoute`).

## 1. Routes Công khai (Public / Guest)
| Route Hash | Thành phần đích | Vai trò | Trạng thái kiểm toán | Ảnh chụp `before/` | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `#` / `/` | `LandingPage` | GUEST / ALL | **Đã chạy Playwright (9 viewports)** | `landing-375px.png`, `landing-768px.png`, `landing-1440px.png` | Lỗi P0 cắt CTA header mobile, P1 mascot che CAM 3/4 |
| `#auth/login` | `AuthPage` | GUEST | **Đã chạy Playwright (9 viewports)** | `auth-login-375px.png`, `auth-login-1440px.png` | Bị `SessionFeedback` chặn khi offline |
| `#auth/register` | `AuthPage` | GUEST | **Đã chạy Playwright (9 viewports)** | `auth-register-375px.png`, `auth-register-1440px.png` | 5 touch target `< 36px` trên mobile |
| `#auth/forgot-password` | (Rơi về `LandingPage`) | GUEST | **Đã chạy Playwright** | `auth-forgot-1440px.png` | **Lỗi route**: không khớp route forgot thực tế |
| `#auth/callback` | `SocialCallbackPage` | GUEST | Kiểm toán mã nguồn | N/A (cần OAuth state) | Không thể test trực tiếp không có OAuth token |
| `#help` | `HelpCenterHomePage` | GUEST / ALL | **Đã chạy Playwright (9 viewports)** | `help-center-375px.png`, `help-center-1440px.png` | **Lỗi P1**: bị chặn khi phiên chưa xác thực được với backend |
| `#payment/result` | `PaymentResultPage` | CUSTOMER | Kiểm toán mã nguồn | N/A (cần callback VNPay/PayOS) | CSS có 9 `!important` trong `payment-result.css` |

## 2. Routes Khách hàng (`#portal/customer/*` — Role `CUSTOMER`)
Nguồn: [customer/routes.ts](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/customer/routes.ts) — *Chưa truy cập runtime vì cần tài khoản local có phiên backend sống; đã kiểm toán toàn bộ mã nguồn*.
| Route Hash | Trang (`*Page.tsx`) | Ghi chú kiểm toán mã nguồn |
| --- | --- | --- |
| `#portal/customer/orders` | `OrdersPage` | Trang mặc định của Customer |
| `#portal/customer/orders/new` | `CreateOrderPage` | **7,481 dòng CSS** rải qua 3 tệp (`CreateOrder.css`, `CreateOrder.refinement.css`, `ContentStep.css`) |
| `#portal/customer/orders/:id` | `OrderDetailPage` | Tích hợp báo giá, hợp đồng, thanh toán, nghiệm thu, `OrderFeedbackCard` |
| `#portal/customer/orders/:id/missions/:mid/report` | `CustomerMissionReportPage` | Xem báo cáo nhiệm vụ |
| `#portal/customer/orders/:id/live` | `LivePage` | Xem phát trực tiếp theo đơn |
| `#portal/customer/orders/:id/media` | `MediaPage` | Media theo đơn |
| `#portal/customer/live` | `LiveHubPage` | Trung tâm live |
| `#portal/customer/media` / `:mediaId` | `MediaLibraryPage` / `MediaDetailPage` | Thư viện media |
| `#portal/customer/notifications` | `NotificationsPage` | Thông báo (`z-index: 1600`) |
| `#portal/customer/mission-history` | **`notFound` (Lỗi!)** | `parseCustomerRoute` trả `notFound` dù `customerHref` vẫn sinh URL này (`routes.ts:34-35, 66-69`) |

## 3. Routes Quản lý (`#portal/manager/*` — Role `MANAGER`)
Nguồn: [manager/routes.ts](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/manager/routes.ts) — *Đã kiểm toán toàn bộ mã nguồn + 4,893 dòng `manager.css` + 3,601 dòng `dashboard.scss`*.
- `#portal/manager` (`DashboardPage` — 5 tab: Điều hành nhiệm vụ, Tài chính & giao dịch, Đơn hàng & báo giá, Hoạt động gần đây, Quản lý nguồn lực)
- `#portal/manager/orders` (`OrderQueuePage`), `/orders/:id` (`OrderReviewPage`), `/orders/:id/results` (`OrderResultsPage`)
- `#portal/manager/orders/:id/mission` (`MissionCreatePage`), `/rework/:reworkId` (`ReworkPlanningPage`), `/inspection/:mid/:cid` (`InternalCorrectionPlanningPage`)
- `#portal/manager/missions` (`MissionsPage`), `/missions/:id/detail` (`MissionDetailPage`), `/dispatch` (`MissionDispatchPage`), `/setup` (`LiveDispatchPage`)
- `#portal/manager/schedule` (`SchedulePage` / `FlightCalendarPage`), `/drones` (`DronesPage`), `/maintenance` (`MaintenancePage`), `/notifications`, `/support`

## 4. Routes Nhân sự / Phi công (`#portal/staff/*` — Role `STAFF`)
Nguồn: [drone-operator/routes.ts](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/drone-operator/routes.ts) — *Bundle `DroneOperatorHomePage.js` nặng `530.5 KB` + `FlightDrone.js` `489.9 KB`*.
- `/missions`, `/missions/:id` (`MissionDetailPage`), `/availability`, `/preflight/:id`, `/handover/:id`, `/flight/:id`, `/postflight/:id`, `/upload/:id`, `/checklist/:id`, `/inspection/:id`, `/corrections/:id`, `/technical`, `/maintenance`, `/zone-map`, `/support`, `/notifications`, `/profile`.

## 5. Routes Quản trị (`#portal/admin/*` — Role `ADMIN`)
Nguồn: [admin/routes.ts](file:///c:/Users/ACER/Documents/GitHub/doan/ondemand-monitoring-web/src/features/admin/routes.ts) — **Lỗi P1**: `parseAdminRoute` không cắt `?query` ở dòng 46.
- `/accounts`, `/accounts/new`, `/accounts/:id`, `/roles`, `/catalog`, `/checklists`, `/services/:id/checklists`, `/operating-config`, `/order-criteria`, `/device-check-criteria`, `/audit-log`, `/refunds`, `/resource-lifecycle`, `/ai-ops/:tab` (10 tabs).
