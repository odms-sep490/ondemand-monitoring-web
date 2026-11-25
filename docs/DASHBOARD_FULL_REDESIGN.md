# OnDemand Monitor — Complete 4-Tab Dashboard Redesign

## 1. Selected Design Direction
**Hybrid: Aerial Command Center + Intelligent Operations Studio**
- Crisp enterprise light/dark-compatible surfaces (`var(--mgr-card)`, `var(--mgr-border)`, `var(--mgr-text)`), deep navy typography, electric brand blue (`#1565E8`), and semantic status colors (`#10B981` emerald, `#F59E0B` amber, `#EF4444` rose, `#64748B` slate).
- Zero unnecessary card stretching (`align-items: start` on all multi-column grids).
- Restrained drone-inspired visual language (animated SVG drone in empty mission state, clean tabular numerals, tactile micro-interactions).

## 2. All Four Tabs Redesigned
1. **Tab 1 — Điều hành nhiệm vụ (`ReferenceMissionPanel`, `ActionListCard`, `OrderStatusCard`, `MissionTrendCard`)**:
   - Compact Mission Command Card / compact drone empty state (fixed oversized 3D illustration).
   - Content-driven Action Center with priority-colored icons, monospace order/mission code pills, and category filters.
   - Interactive Recharts `DonutChart` with semantic status colors, dynamic hover center callout, synced legend highlight, and click-through.
   - Animated Recharts `StackedBarChart` (emerald completed / rose failed) with date-range filter and one-click reset empty state.
2. **Tab 2 — Tài chính & giao dịch (`DashboardFinancePanel`, `CashFlowChart`)**:
   - 3-card Financial KPI Strip (`Thực thu sau hoàn tiền`, `Tiền đã thu`, `Tiền đã hoàn`) with semantic icons and confirmed-transactions scope label.
   - Upgraded `CashFlowChart` from static SVG to **interactive Recharts `<ComposedChart>`** (received bars + refunded bars + emerald cumulative net balance line + currency `<ChartTooltip />`).
   - Replaced raw `<details>` with a filterable Recent Transactions card (`Tất cả`, `Đặt cọc`, `Thanh toán nhiệm vụ`, `Thanh toán cuối`, `Hoàn tiền`) with inflow/outflow badges and clickable order links.
3. **Tab 3 — Đơn hàng & báo giá (`RecentOrdersCard`, `PipelineCard`, `BarChartCard`, `AnalyticsCharts`)**:
   - Added real-time client search (order code, customer, service) and dynamic status filter chips to `RecentOrdersCard`.
   - Upgraded `BarChartCard` with multi-color categorical accents (`CHART_COLORS`) and smooth CSS width transitions.
   - Standardized all empty/unavailable states on `DashboardEmptyState`.
4. **Tab 4 — Hoạt động gần đây (`RecentActivityCard`)**:
   - Transformed plain `<ol>` text wall into a connected **Vertical Activity Timeline** with category filter chips, semantic circular icon nodes, category labels, timestamps, and direct links to related orders and missions.

## 3. Shared Region Upgrades
- **Animated `KpiRow`**: Smooth `requestAnimationFrame` count-up (`420ms` cubic ease-out, `prefers-reduced-motion` aware), semantic icon badges, and top accent indicators.
- **Tab Navigation**: Polished active underline (`3px` rounded indicator) and crisp typography hierarchy in `dashboard.scss`.
- **Reusable `DashboardEmptyState`**: Unified compact component supporting `NO_DATA`, `NO_DATA_FOR_FILTER`, `NO_MISSIONS`, `ALL_CAUGHT_UP`, `ERROR`, and `NO_PERMISSION`.
