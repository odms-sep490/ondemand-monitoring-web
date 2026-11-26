# Performance Report

## Optimizations Implemented
1. **Google Fonts Payload Reduction (`index.html`)**: Removed 5 redundant font families (`DM Mono`, `IBM Plex Mono`, `IBM Plex Sans`, `Inter`, `Plus Jakarta Sans`), retaining only `Be Vietnam Pro` + `JetBrains Mono` with non-render-blocking `media="print" onload="this.media='all'"`.
2. **Route-Level Code Splitting (`src/app/router.tsx`, `AdminApp.tsx`)**: All major role portals (`LandingPage`, `AuthPage`, `CustomerApp`, `ManagerApp`, `AdminApp`, `ResourceLifecyclePage`, `AiOperationsPage`) remain lazy-loaded via `React.lazy`.

## Measured Local Dev Timings (Headless Chromium via Playwright)
*Measurement condition: local Vite dev server (`127.0.0.1:5173`), unthrottled local network, backend API offline.*

| Route @ Viewport | Before DCL / Load / FCP | After DCL / Load / FCP |
| --- | --- | --- |
| `landing@1920x1080` (cold first load) | 8331ms / 8912ms / 8616ms | **1361ms / 1368ms / 1536ms** |
| `landing@1440x900` (warm) | 1309ms / 1311ms / 1432ms | **1220ms / 1223ms / 1332ms** |

- **Note:** Real production LCP/INP/CLS under throttled 4G via Lighthouse was `NOT_RUN` because Lighthouse CLI / Chrome DevTools MCP was not invoked against a production preview server with live backend.
