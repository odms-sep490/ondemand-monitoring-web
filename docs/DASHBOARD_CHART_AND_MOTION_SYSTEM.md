# Dashboard Chart & Motion System

## 1. Unified Chart Stack (Recharts `^3.10.1`)
All interactive charts share a single library (`recharts`) and a single shared `<ChartTooltip />` component:
- **`DonutChart`** (`components/charts/DonutChart.tsx`): Animated Recharts `<PieChart>`, `innerRadius={58}`, `outerRadius={82}`, `paddingAngle={3}`, `cornerRadius={6}`, hover segment emphasis (`fillOpacity` dimming to `0.35`), synced legend hover, dynamic center metric, and click-through navigation.
- **`StackedBarChart`** (`components/charts/StackedBarChart.tsx`): Animated Recharts `<BarChart>` (`650ms ease-out`), rounded bar tops `[5, 5, 0, 0]`, integer Y-axis, emerald completed / rose failed series.
- **`CashFlowChart`** (`components/charts/CashFlowChart.tsx`): Animated Recharts `<ComposedChart>` combining received bars (`#1565E8`), refunded bars (`#F59E0B`), and cumulative net receipt line (`#10B981`) with compact VND Y-axis and full VND hover tooltips.
- **`BarChartCard`** (`components/charts/BarChartCard.tsx`): Ranked horizontal proportion bars with distinct `CHART_COLORS` accents and `550ms` smooth width reveal.

## 2. Semantic Palette (`dashboardTone.ts`)
- Pending / Review: `#F59E0B` | Waiting Deposit: `#EA580C`
- Active / In Progress / In Flight: `#1565E8` / `#0284C7`
- Completed / Net Positive: `#10B981`
- Failed / Rejected / Issue: `#EF4444`
- Cancelled / Neutral: `#64748B`

## 3. Motion Tokens & Reduced Motion Accessibility
- **KPI Count-Up**: `420ms` cubic ease-out via `requestAnimationFrame`; snaps immediately when `prefers-reduced-motion: reduce` is active.
- **Chart Reveal**: `650–750ms ease-out`; disabled (`isAnimationActive={false}`) when `prefers-reduced-motion: reduce` is active.
- **Micro-Interactions**: `150–180ms ease` card elevation (`-2px`), task row horizontal nudge (`2px`), KPI icon scale (`1.06`), empty-state drone float (`3.2s`, disabled under reduced motion).
- **Theme Consistency**: All surfaces, borders, text, gridlines, and tooltips inherit CSS variables (`--mgr-card`, `--mgr-border`, `--mgr-text`, `--mgr-muted`, `--dash-accent`) for seamless light and dark theme compatibility.
