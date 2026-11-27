# 02 — Danh mục Thành phần (Component Inventory)

## 1. Phân bố tệp nguồn theo Feature (`src/`)
Tổng cộng **2,202 tệp** (`1,044 .tsx`, `956 .ts`, `122 .css`, `28 .scss`):
| Feature / Module | Số tệp | Ghi chú kiến trúc |
| --- | ---: | --- |
| `features/manager` | 436 | Lớn nhất hệ thống (`manager.css` 4,893 dòng + `dashboard.scss` 3,601 dòng) |
| `features/drone-operator` | 342 | Gồm cả `omss/screens/*` cũ có nhiều inline styles (43–51 `style={{}}`/tệp) |
| `features/customer` | 310 | Nặng nhất ở `CreateOrder` (7,481 dòng CSS) và `OrderDetail` |
| `features/admin` | 171 | `refund-management.css` (2,454 dòng), `admin.css` (1,984 dòng), `aiOperations.css` (1,193 dòng) |
| `shared` | 90 | Chứa 3 bộ UI dùng chung chồng lấn |
| `features/auth` | 57 | `auth.css` (1,271 dòng) |
| `features/support` | 55 | Help Center + Ticket list/detail |
| `features/mission` | 52 | `OperatorDashboardPage.tsx` (70 inline styles), `ChecklistEvidencePanel.css` (66 `!important`) |
| `features/finance` | 45 | `finance.css` (3,614 dòng) |
| `features/landing` | 34 | `landing.css` (3,619 dòng) + `Interactive3DDroneStage` (Three.js GLB) |
| Khác (`media`, `delivery`, `resource-lifecycle`, `staff`, `notifications`, `maintenance-workflow`, ...) | 130 | Các module nghiệp vụ chuyên biệt |

## 2. Trùng lặp Component Dùng Chung (Phát hiện P1)
Trong `src/shared/components/` hiện tồn tại song song **4 lớp component trùng vai trò**:
| Nhóm UI | Tệp 1 (Legacy/Root) | Tệp 2 (`shared/components/ui/`) | Tệp 3 (`shared/components/antd/`) | Tệp 4 (`shared/components/odm/`) |
| --- | --- | --- | --- | --- |
| **Button** | `shared/components/Button.tsx` | `ui/Button.tsx` | Antd `<Button>` trực tiếp | — |
| **Status Badge** | — | `ui/StatusBadge.tsx` | `antd/StatusTag.tsx` | `odm/StatusBadge.tsx` |
| **Empty / Error State** | — | `ui/EmptyState.tsx` | `antd/EmptyState.tsx`, `antd/ErrorState.tsx` | `odm/StateView.tsx` |
| **Page Header** | — | `ui/PageHeader.tsx` | `antd/PageHeader.tsx` | — |
| **Card / Table** | — | `ui/Card.tsx`, `ui/TableCard.tsx` | `antd/CardComponent.tsx`, `antd/TableComponent.tsx` | — |
| **Modal / Confirm** | — | `ui/Modal.tsx`, `ui/ConfirmDialog.tsx` | Antd `<Modal>` / `<Drawer>` | — |

## 3. Hệ thống Layout & Navigation
- **Portal Shell**: `shared/components/portal/PortalLayout.tsx`, `PortalUserMenu.tsx`, `shared/components/RoleSidebar.tsx` (`roleSidebar.css`, `pageBanner.css`).
- **Landing Shell**: Header cố định, Hero video 4 cảnh (`CinematicDroneHero`), 3D Digital Twin (`Interactive3DDroneStage`), AI Mascot + Chatbot (`ChatbotWidget`), Footer phân cột.
- **Biểu đồ & Bản đồ**: Recharts (`CartesianChart` 268.5 KB, `ComposedChart`), Leaflet (`leaflet` 148.6 KB), FullCalendar, Three.js (`GLTFLoader` 664.6 KB).
- **Trình soạn thảo**: TipTap (`ReportStudio` 476.0 KB).
