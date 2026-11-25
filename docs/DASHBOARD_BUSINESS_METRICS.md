# Dashboard Business Metrics & Verified API Inventory

## Primary Data Source
- **Endpoint**: `GET /api/manager/dashboard?range=7D|30D|90D` (`src/features/manager/api/dashboardApi.ts`)
- **Fallback Recent Mission**: `GET /api/manager/missions` (`missionsApi.listMissions`, invoked only when `activeMissions` is empty)
- **Authorization**: Manager role (`#portal/manager/dashboard`). No mock or fabricated metrics in authenticated production UI.

## Verified Widget Inventory
| Widget | Tab | Source Field | Business Meaning | Empty / Unavailable Handling |
| :--- | :--- | :--- | :--- | :--- |
| `KpiRow` (5 KPIs) | Top Shared | `summary.pendingOrderCount`, `pricingPipeline.pricingReviewCount + quoteReadyCount`, `summary.waitingDepositCount`, `summary.activeMissionCount`, `sum(missionTrend.completed)` | Real counts of orders awaiting review/quote/deposit, active missions, and completed missions in selected period. | Renders `—` with `Chưa có dữ liệu` aria-label when field omitted; `0` when genuinely zero. |
| `ReferenceMissionPanel` | Tab 1 (`Điều hành nhiệm vụ`) | `activeMissions` / `missionsApi.listMissions` | In-flight or most recent mission (code, status, schedule, operator, drone). | Compact `<DashboardEmptyState variant="NO_MISSIONS" />` (~165px) or retryable `ERROR` state. |
| `ActionListCard` | Tab 1 (`Điều hành nhiệm vụ`) | `actionItems` (excluding `QUOTE_READY`) | Actionable pending tasks grouped by type with priority indicator, code pill, age, and direct route. | Compact `<DashboardEmptyState variant="ALL_CAUGHT_UP" />`. |
| `OrderStatusCard` | Tab 1 & Tab 3 | `orderStatusDistribution` | Categorical counts of orders by real backend status enum (`PENDING`, `COMPLETED`, `IN_PROGRESS`, `CANCELLED`, `REJECTED`, etc.). | Compact `<DashboardEmptyState variant="NO_DATA" />`. |
| `MissionTrendCard` | Tab 1 | `missionTrend` | Daily/period completed vs failed mission counts with local date-range filter. | Compact `<DashboardEmptyState variant="NO_DATA" | "NO_DATA_FOR_FILTER" />` with one-click reset. |
| `DashboardFinancePanel` & `CashFlowChart` | Tab 2 (`Tài chính & giao dịch`) | `finance.cashFlow`, `finance.recentTransactions` | Confirmed payments received, refunds paid (outflows), net cash received (`received - refunded`), cumulative net balance, and recent confirmed transactions (`DEPOSIT`, `MISSION_PAYMENT`, `FINAL_PAYMENT`, `REFUND`). Quotations are NEVER counted as revenue. | Compact `<DashboardEmptyState />` for empty period, filtered empty, or unavailable finance payload. |
| `RecentOrdersCard` & `PipelineCard` & `AnalyticsCharts` | Tab 3 (`Đơn hàng & báo giá`) | `recentOrders`, `pricingPipeline`, `serviceDistribution`, `priceAdjustmentSummary`, `additionalServiceDistribution` | Searchable/filterable recent orders table, 5-stage pricing pipeline, service breakdown bars, and manager price-adjustment summary. | Compact `<DashboardEmptyState />` with filter reset. |
| `RecentActivityCard` | Tab 4 (`Hoạt động gần đây`) | `recentActivities` | Vertical operational event timeline filterable by category (`Thanh toán`, `Nhiệm vụ`, `Đơn & báo giá`, `Hệ thống`) with direct links to related order/mission. | Compact `<DashboardEmptyState variant="NO_DATA" />`. |
