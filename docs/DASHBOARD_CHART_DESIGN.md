# Dashboard Chart Design & Motion Specification

## 1. Chart Library Decision
Reused the existing installed **Recharts (`^3.10.1`)** stack across the entire Manager Dashboard. No competing chart library was introduced.

## 2. Semantic Status Color System (`dashboardTone.ts`)
Verified against backend Order and Mission status enums:
- **Pending / Under Review / Waiting Quote**: `#F59E0B` (Amber)
- **Waiting Deposit**: `#EA580C` (Orange)
- **Approved / Scheduled / In Flight / In Progress**: `#1565E8` (Brand Blue) / `#0284C7` (Sky)
- **Completed / Delivered / Adjusted & Approved**: `#10B981` (Emerald)
- **Failed / Rejected / Issue**: `#EF4444` (Rose)
- **Cancelled / Expired / Draft**: `#64748B` / `#94A3B8` (Slate)

## 3. Chart Specifications
### Order Status Donut (`components/charts/DonutChart.tsx`)
- **Geometry**: Recharts `<PieChart>`, `innerRadius={58}`, `outerRadius={82}`, `paddingAngle={3}`, `cornerRadius={6}`, white segment separator `strokeWidth={2}`.
- **Interactive Sync**: Hovering a segment or legend row sets `activeIndex`, dims non-selected segments to `0.35` opacity, highlights the matching legend item, and dynamically updates the center callout to display that category's exact count and percentage.
- **Click-through**: Clicking a segment or legend row navigates to `#portal/manager/orders` when `onSelect` is wired.

### Missions by Day (`components/charts/StackedBarChart.tsx`)
- **Geometry**: Stacked vertical bars (`maxBarSize={30}`, rounded top corners `[5, 5, 0, 0]`), horizontal dashed gridlines (`strokeDasharray="3 5"`), integer Y-axis ticks (`allowDecimals={false}`).
- **Series Colors**: Completed `#10B981` (Emerald), Failed `#EF4444` (Rose).
- **Empty State**: Never fabricates zero-filled trend points; renders compact `<DashboardEmptyState />` with one-click filter reset when a custom date range yields no records.

## 4. Motion System & Accessibility
- **KPI Count-up**: `requestAnimationFrame` cubic ease-out (`420ms`) in `KpiRow.tsx`, always landing on the exact verified backend integer.
- **Chart Entrance**: Recharts native `650–680ms ease-out` reveal.
- **Hover Micro-interactions**: `150–180ms ease` elevation on KPI cards (`-2px`), subtle `2px` slide on task rows, `scale(1.06)` on KPI icons, `3.2s` gentle float on empty-state drone icon.
- **Reduced Motion**: All JS animations (`useAnimatedNumber`, Recharts `isAnimationActive`) and CSS keyframes/transitions explicitly honor `@media (prefers-reduced-motion: reduce)`.
