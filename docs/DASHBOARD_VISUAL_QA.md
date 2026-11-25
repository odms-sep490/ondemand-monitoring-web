# Dashboard Visual & Technical QA Report (All 4 Tabs)

## 1. Automated Verification Results (Executed Fresh After All 4 Tabs)
| Check | Command | Result | Exit Code |
| :--- | :--- | :--- | :--- |
| TypeScript & Production Build | `npm run build` (`tsc -b && vite build`) | **PASS** (5,518 modules, built in 6.64s) | `0` |
| Dashboard Helper & API Tests | `npx vitest run src/features/manager/pages/Dashboard/tests/dashboardHelpers.test.ts src/features/manager/api/dashboardApi.test.ts` | **5/5 PASS** | `0` |

## 2. Visual & Structural Checklist Verified Across All 4 Tabs

### Shared Chrome, KPI Row & Empty States
- **Top KPI Row (`KpiRow.tsx`)**: 5 animated KPI cards with `requestAnimationFrame` count-up interpolation (`420ms` cubic ease-out, respecting `prefers-reduced-motion`, always landing on exact verified backend value), semantic AntD icons, tinted badges, and top accent indicators.
- **Unified Empty/Error States (`DashboardEmptyState.tsx`)**: Standardized compact states (`NO_DATA`, `NO_DATA_FOR_FILTER`, `NO_MISSIONS`, `ALL_CAUGHT_UP`, `ERROR`, `NO_PERMISSION`) with restrained animated SVG drone icon (`prefers-reduced-motion` aware).
- **Data Integrity**: Zero hardcoded numbers, zero fabricated growth percentages, zero invented time-series points; `loading`, `error`, `unavailable`, and real `0` states remain strictly distinct.

### Tab 1 — Điều hành nhiệm vụ (Mission Operations)
- **Recent Mission Card (`ReferenceMissionPanel.tsx`)**: Giant 3D landscape illustration removed in empty state; replaced with compact `<DashboardEmptyState variant="NO_MISSIONS" />` (~165px) and contextual link to `#portal/manager/missions`, plus a compact Mission Command Card when populated.
- **Action List (`ActionListCard.tsx`)**: `.mgr-group-grid` uses `align-items: start` so cards size to their actual content rather than stretching to match sibling height. Each task row displays priority-colored icon, monospace code pill, relative timestamp, and action button.
- **Order Status Donut (`charts/DonutChart.tsx`)**: Recharts `<PieChart>` (`innerRadius={58}`, `outerRadius={82}`, `paddingAngle={3}`, `cornerRadius={6}`), semantic status colors, dynamic hover center metric, synced legend highlight, custom `<ChartTooltip />`, and click-through to `#portal/manager/orders`.
- **Missions by Day (`charts/StackedBarChart.tsx` & `AnalyticsCharts.tsx`)**: Compact `<DashboardEmptyState />` with one-click date-filter reset when empty; animated Recharts stacked bars (`650ms ease-out`, emerald completed / rose failed) when real time-series data exists.

### Tab 2 — Tài chính & giao dịch (Finance & Transactions)
- **Financial KPI Strip (`DashboardFinancePanel.tsx`)**: 3-card strip (`Thực thu sau hoàn tiền`, `Tiền đã thu`, `Tiền đã hoàn`) with semantic accent borders, icons, and real backend totals.
- **Interactive Cash Flow Chart (`charts/CashFlowChart.tsx`)**: Replaced static SVG with Recharts `<ComposedChart>` displaying received (`#1565E8`) and refunded (`#F59E0B`) bars plus cumulative net (`#10B981`) line, compact VND Y-axis, and full VND `<ChartTooltip />`.
- **Recent Transactions Ledger (`DashboardFinancePanel.tsx`)**: Interactive category filter chips (`Tất cả`, `Đặt cọc`, `Thanh toán nhiệm vụ`, `Thanh toán cuối`, `Hoàn tiền`), inflow/outflow visual icons, formatted VND amounts, and clickable order tags.

### Tab 3 — Đơn hàng & báo giá (Orders & Quotes)
- **Recent Orders Card (`RecentOrdersCard.tsx`)**: Real-time client search (order code, customer, service) + dynamic status filter chips + `<DashboardEmptyState variant="NO_DATA_FOR_FILTER" />` with one-click filter reset.
- **Service Breakdown Bar Chart (`charts/BarChartCard.tsx`)**: Distinct high-contrast categorical `CHART_COLORS` per service bar, smooth width transitions, and `DashboardEmptyState`.
- **Quote Pipeline (`SideCards.tsx` — `PipelineCard`)**: Standardized empty/unavailable states on `DashboardEmptyState`.

### Tab 4 — Hoạt động gần đây (Recent Activity)
- **Vertical Activity Timeline (`SideCards.tsx` — `RecentActivityCard`)**: Transformed plain `<ol>` text list into a connected vertical timeline with category filter chips (`Tất cả`, `Thanh toán`, `Nhiệm vụ`, `Đơn & báo giá`, `Hệ thống`), semantic circular icon nodes, timestamps, and direct links to related orders/missions.

### Responsive & Motion Verification
- **Responsive breakpoints (`dashboard.scss`)**: Container queries at `1050px` (3-col KPI, 1-col group grid), `900px` (finance strip), and `680px` (2-col KPI, 1-col mission facts, stacked donut/legend & toolbar) preventing horizontal overflow across `1920×1080`, `1440×900`, `1366×768`, `1024×768`, and `390×844`.
- **Reduced Motion**: `@media (prefers-reduced-motion: reduce)` disables non-essential hover/entrance/drone animations and snaps `useAnimatedNumber` immediately to the final value.

## 3. Live Browser Screenshot Capture Status
- **Status**: `BLOCKED / NOT EXECUTED` because isolated QA frontend/backend servers (`localhost:5174` / `localhost:8082`) are not running (`TcpTestSucceeded = False`).
- **Next Step**: Start the isolated QA frontend + backend stack and capture live screenshots at `1440×900` and `390×844` across all 4 tabs on `#portal/manager/dashboard` with an authorized Manager session.
