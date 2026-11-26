# Design System — OnDemand Monitor (`ondemand-monitoring-web`)

## 1. Color Tokens (Single Source of Truth)
Aligned across `src/styles/global.css`, `src/styles/odm.css`, and `src/shared/theme/appTheme.ts`:

| Token | Value | Role |
| --- | --- | --- |
| `--color-primary` / `APP_COLORS.primary` | `#1565E8` | Primary CTA, active navigation, focus accent |
| `--color-primary-hover` / `APP_COLORS.secondary` | `#0958D9` | Hover/active state for primary controls |
| `--color-success` / `APP_COLORS.success` | `#16A34A` | Verified, healthy, paid, approved states |
| `--color-warning` / `APP_COLORS.warning` | `#F59E0B` | Due soon, partial payment, caution banners |
| `--color-danger` / `APP_COLORS.danger` | `#DC2626` | Blocked, maintenance required, destructive actions |
| `--color-background` | `#F8FAFC` (light) / `#0B1220` (dark) | Page canvas |
| `--color-surface` | `#FFFFFF` (light) / `#111C2E` (dark) | Elevated cards, modals, drawers |
| `--color-border` | `#E2E8F0` (light) / `#2B3B54` (dark) | Dividers and control borders |
| `--focus-ring` | `0 0 0 3px rgb(21 101 232 / 24%)` | Keyboard focus indicator |

## 2. Typography
- **UI & Display (`--sans`):** `'Be Vietnam Pro', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif` (weights `400`, `500`, `600`, `700`, `800`) — specifically chosen for clean stacked Vietnamese diacritics.
- **Technical / Monospace (`--mono`):** `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace` (weights `400`, `500`, `600`) — used for order codes, mission IDs, timestamps, and numeric telemetry.

## 3. Spacing, Radius & Motion
- **Spacing scale:** `--space-1` (`4px`) through `--space-8` (`32px`).
- **Border radius:** `--radius-sm` (`8px`), `--radius-md` (`10px`), `--radius-lg` (`16px`), pill tags (`999px`).
- **Reduced motion:** All smooth scrolling (`html`), landing transitions, and shell animations respect `@media (prefers-reduced-motion: reduce)`.
