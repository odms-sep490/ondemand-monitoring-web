# UI/UX Audit Report — `ondemand-monitoring-web`

## Scope & Inventory
- **Target Repo:** `ondemand-monitoring-web` (React 19.2.8, Vite 8.2.2, TypeScript 6, Ant Design 5.29.3, Tailwind CSS 4.3.3)
- **Public Routes Audited Live (Playwright Chromium):** `/` (Landing), `#auth/login`, `#auth/register`, `#auth/forgot-password` across 7 viewports (`1920x1080`, `1440x900`, `1280x800`, `1024x768`, `768x1024`, `390x844`, `360x800`).
- **Authenticated Portals Audited Statically + Unit Tested:** Customer (`CustomerApp`), Manager (`ManagerApp`), Operator (`DroneOperatorHomePage`), Admin (`AdminApp`, including `ResourceLifecyclePage` & `AiOperationsPage`), Report Studio (`ReportStudio`).

## Discovered Issues & Severity

| ID | Severity | Area | Finding | Status |
| --- | --- | --- | --- | --- |
| A11Y-01 | **P0** | Landing (`ChatbotWidget.tsx`) | Floating chatbot button (`.lp-bot-fab`) had no accessible name (`unlabeledButtonsCount = 1` on all 7 viewports). | **FIXED & VERIFIED** (`unlabeledButtonsCount = 0`) |
| A11Y-02 | **P0** | Landing (`landing.css`) | `.lp-bot-fab` and `.lpx-language.odm-lang-toggle button` lacked explicit `:focus-visible` outlines on dark hero background. | **FIXED & VERIFIED** |
| UX-01 | **P1** | Auth / Session Recovery (`router.tsx`) | When backend session check failed (`unavailable`), users saw a muted grey retry button with no primary CTA emphasis and no escape route back to Home. | **FIXED & VERIFIED** (primary `#1565E8` retry button + secondary "Về trang chủ" link) |
| UX-02 | **P1** | Landing Header (`landing.css`) | Language toggle buttons (`VI`/`EN`) measured `< 32px` height (`smallTouchTargets = 2` on all 7 viewports). | **FIXED & VERIFIED** (`smallTouchTargets = 0` on Landing) |
| DS-01 | **P1** | Design System (`global.css`, `odm.css`, `appTheme.ts`) | Primary brand color drifted between `#0369a1` (`global.css`) and `#1565E8` (`odm.css`/`appTheme.ts`), and 3 competing body fonts (`Plus Jakarta Sans`, `IBM Plex Sans`, `Be Vietnam Pro`) caused inconsistent Vietnamese diacritic rendering. | **FIXED & VERIFIED** |
| PERF-01 | **P1** | Font Loading (`index.html`) | Loaded 7 Google Font families simultaneously on every page load. | **FIXED & VERIFIED** (reduced to 2 families: `Be Vietnam Pro` + `JetBrains Mono`) |
| A11Y-03 | **P2** | Motion (`global.css`) | `html { scroll-behavior: smooth; }` was not disabled under `prefers-reduced-motion: reduce`. | **FIXED & VERIFIED** |
| A11Y-04 | **P2** | Report Studio (`ReportStudio.tsx`, `reportStudio.css`) | Broken media fallback had no frame/retry button, single `Giới hạn` card left 50% empty right column, and sticky `.ir-commandbar` overlapped `.ir-review-bar` on scroll. | **FIXED & VERIFIED** (completed earlier in session) |
| AUTH-01 | **P2** | Register (`1920x1080`) | 1 compact icon button inside Register form remains `< 32px` (`smallTouchTargets = 1`). | **OPEN** (tracked for follow-up) |
