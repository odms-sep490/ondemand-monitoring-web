# Dashboard UI/UX Redesign — OnDemand Monitor Operations Command Center

## 1. Existing UX Problems Resolved
| Problem | Previous Defect | Redesign Solution |
| :--- | :--- | :--- |
| **A — Oversized Recent Mission Card** | Rendered a massive 3D landscape illustration (`dashboard-mission-3d.png`) and 3 empty `Chưa phân công` rows even when no mission existed, consuming ~460px vertically. | Replaced empty state with compact `<DashboardEmptyState variant="NO_MISSIONS" />` (~165px) featuring a restrained animated SVG drone icon and direct CTA to `#portal/manager/missions`. Populated state renders a crisp compact Mission Command Card with status Tag, schedule, operator, drone, and `Mở nhiệm vụ` button. |
| **B — Todo List (`Việc cần làm`) Huge Empty Space** | CSS Grid stretched `ActionListCard` to match the oversized sibling mission card, leaving a giant empty white void below 2 tasks. | Set `align-items: start` on `.mgr-group-grid` so every card uses content-driven height. Upgraded task rows with priority-tinted type icons, monospace order/mission code pills, relative timestamps, hover feedback, and `<DashboardEmptyState variant="ALL_CAUGHT_UP" />` when empty. |
| **C — Basic Order Status Donut** | Static 33-line raw `<svg>` using 3 shades of the same blue, zero animation, no interactive legend hover, no tooltip, and no click-through. | Upgraded `DonutChart.tsx` to animated interactive **Recharts `<PieChart>`** with `paddingAngle={3}`, `cornerRadius={6}`, semantic status color mapping (`PENDING` amber, `COMPLETED` emerald, `IN_PROGRESS` blue, `CANCELLED` slate, `REJECTED` rose), dynamic center metric on hover, synced legend highlight, custom `<ChartTooltip />`, and click-through to `#portal/manager/orders`. |
| **D — Empty Missions by Day Chart** | Plain text `<p>` inside a large blank card; `StackedBarChart` had `isAnimationActive={false}`. | Added `<DashboardEmptyState variant="NO_DATA" | "NO_DATA_FOR_FILTER" />` with clear date-range guidance and a one-click `Xóa lọc ngày` button when filtered. Enabled smooth Recharts bar entrance animation (`650ms ease-out`, respecting `prefers-reduced-motion`) and semantic emerald/rose colors. |

## 2. Widget Contracts & Real Data Integrity
All widgets consume live authorized data exclusively from `GET /api/manager/dashboard?range=7D|30D|90D` (plus `missionsApi.listMissions` fallback for recent mission). Zero hardcoded metrics, zero fabricated comparison percentages, zero fake time-series points.

- `KpiRow`: 5 verified metrics (`pendingOrderCount`, `pricingReviewCount + quoteReadyCount`, `waitingDepositCount`, `activeMissionCount`, `sum(missionTrend.completed)`). Distinguishes omitted fields (`—`) from real zero values (`0`).
- `ReferenceMissionPanel`: Active or latest real mission; distinguishes loading, empty, and retryable error states.
- `ActionListCard`: Filtered real `actionItems` grouped by type, priority-styled, capped at 6 with expand toggle.
- `OrderStatusCard` & `MissionTrendCard`: Real `orderStatusDistribution` and `missionTrend` with local date-range filtering.
- Preserved all 4 tabs (`Điều hành nhiệm vụ`, `Tài chính & giao dịch`, `Đơn hàng & báo giá`, `Hoạt động gần đây`), global sidebar, header, and dark-mode CSS variables.

## 3. Changed Files
- `src/features/manager/pages/Dashboard/dashboardTone.ts`
- `src/features/manager/pages/Dashboard/components/DashboardEmptyState.tsx` (new)
- `src/features/manager/pages/Dashboard/components/KpiRow.tsx`
- `src/features/manager/pages/Dashboard/components/ReferenceMissionPanel.tsx`
- `src/features/manager/pages/Dashboard/components/ActionListCard.tsx`
- `src/features/manager/pages/Dashboard/components/AnalyticsCharts.tsx`
- `src/features/manager/pages/Dashboard/components/charts/DonutChart.tsx`
- `src/features/manager/pages/Dashboard/components/charts/StackedBarChart.tsx`
- `src/features/manager/pages/Dashboard/dashboard.scss`
