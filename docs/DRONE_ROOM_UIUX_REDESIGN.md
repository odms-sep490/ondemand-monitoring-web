# Drone 3D Room UI/UX Redesign (`DRONE_ROOM_UIUX_REDESIGN`)

## 1. Screenshot-Based Problems & Verified Root Causes

| Visual / UX Symptom | Verified Root Cause in Source Code |
| --- | --- |
| **Giant overflowing dashed ellipse across the page** | `ManagerLayout.tsx` rendered `.mgr-flight-decor` (`.mgr-flight-route` + `<FlightDrone />` Lottie) on `route.screen === 'drones'` (only `schedule` and `missionDetail` were excluded). |
| **Giant empty white space when scrolling** | `droneFleetRoom.scss` set `align-items: start` on `.mgr-drone-room-layout` and `height: auto; max-height: none; overflow: visible` on `.mgr-drone-room-sidebar`. Expanding specs/device list stretched the page height to 1500–2500px while the 3D scene stayed fixed at `clamp(380px, calc(100dvh - 320px), 650px)`, leaving >1000px of blank space underneath the 3D scene. |
| **Repeated `"Phòng drone 3D"` heading** | `DronesPage.tsx` rendered `<PageHeader title="Phòng drone 3D" />` in an oversized top card, and `DroneFleetRoom.tsx` rendered `<h2>Phòng drone 3D</h2>` again inside `.mgr-drone-room-stage`. |
| **Overcrowded, clipped right sidebar** | All sections (device details, mission assignment, full specs, device types, and device picker) were stacked in one vertical column with `9px–11px` micro-text and no internal scroll containment. |
| **No 3D camera controls & small, indistinguishable drones** | `DroneRoomScene.tsx` used a static `OrthographicCamera` with no `OrbitControls`, no zoom/focus/fit/reset/fullscreen controls, no hover tooltip, and no per-drone status ring. |

## 2. Previous Layout vs. New Layout

- **Previous:** Tall `<PageHeader>` card → 2-column grid with unbounded sidebar height → duplicate `<h2>` inside scene card → static 3D canvas → long single-column inspector stretching the entire document.
- **New (Viewport-Aware Command Workspace):**
  - **Compact Single-Row Topbar (`DronesPage.tsx`):** One `<h1>Phòng drone 3D</h1>`, live fleet status KPI pills (derived from actual `DeviceResponse.status`), and `+ Thêm thiết bị` action.
  - **Viewport-Locked 2-Column Workspace (`.mgr-drone-room-layout`):** `grid-template-columns: minmax(0, 1fr) minmax(336px, 380px)` and `height: clamp(520px, calc(100dvh - 168px), 800px)`. Both the 3D viewport and right inspector fill 100% of the workspace height; the inspector scrolls internally so the page never creates giant empty voids.
  - **Edge-to-Edge 3D Viewport:** Houses subtle top-left HUD pills (`10 drone đang hiện trong phòng`, `10 bệ drone`), floating hover tooltip, and a bottom-center frosted-glass `DroneSceneToolbar`.
  - **3-Tab Right Inspector (`DroneFleetRoom.tsx`):** Persistent selected-drone mini header + accessible `Thông tin` | `Gán nhiệm vụ` | `Danh sách` tabs preserving selection across tab switches, with collapsible accordions for secondary specs and automatic jump to `Gán nhiệm vụ` when `assignmentMissionId` is supplied.

## 3. Changed & Added Files

- [ManagerLayout.tsx](../src/features/manager/ManagerLayout.tsx): Excluded `route.screen === 'drones'` from `.mgr-flight-decor` / `<FlightDrone />`.
- [DronesPage.tsx](../src/features/manager/pages/Drones/DronesPage.tsx): Replaced oversized `PageHeader` with compact topbar + live fleet status pills.
- [DroneRoomScene.tsx](../src/features/manager/pages/Drones/components/DroneRoomScene.tsx): Added `OrbitControls` with damping and safe polar/zoom limits, smooth camera lerp transitions (`focusDrone`, `fitAll`, `resetCamera`, `zoomBy`), per-drone status rings, animated selected beacon + gentle hover lift (paused when hidden or `prefers-reduced-motion`), hover ring + tooltip, double-click guard, and fullscreen toggle.
- [DroneSceneToolbar.tsx](../src/features/manager/pages/Drones/components/DroneSceneToolbar.tsx): New compact floating 3D viewport toolbar (`Zoom In`, `Zoom Out`, `Focus Selected`, `Fit All`, `Reset Camera`, `Fullscreen`).
- [DroneFleetRoom.tsx](../src/features/manager/pages/Drones/components/DroneFleetRoom.tsx): Rebuilt right panel into a compact persistent selected-drone header + 3-tab inspector (`Thông tin`, `Gán nhiệm vụ`, `Danh sách`) with search, status filter chips, keyboard-accessible compact rows, and camera focus trigger.
- [droneFleetRoom.scss](../src/features/manager/pages/Drones/components/droneFleetRoom.scss) & [droneRoom.scss](../src/features/manager/pages/Drones/components/droneRoom.scss): Viewport-locked grid layout, readable `12px–14px` operational typography, dark theme parity, responsive breakpoints (`1180px`, `900px`, `520px`), and `prefers-reduced-motion` support.
- [DroneFleetRoom.test.tsx](../src/features/manager/pages/Drones/components/DroneFleetRoom.test.tsx) & [drone-room-uiux-redesign.e2e.ts](../e2e/drone-room-uiux-redesign.e2e.ts): Updated unit test and added multi-viewport Playwright QA suite.

## 4. 3D Interaction, Animation & Performance

- **Camera Controls:** Smooth damped `OrbitControls` + animated lerp focus when selecting a drone from the list or clicking `Tập trung 3D` / toolbar `Aim`, cancelling smoothly if the user grabs the viewport.
- **Distinguishability:** Each pad displays a status-colored ring (`#10b981` Available, `#1565e8` In Mission/Assigned, `#f59e0b` Maintenance/Charging, `#ef4444` Out of Service/Offline); hovering shows an on-demand floating tooltip and ring; selecting activates a double glowing beacon.
- **Performance & Accessibility:** Single WebGL renderer reused across API updates; animation loop pauses automatically when `document.hidden`; `prefers-reduced-motion: reduce` disables continuous pulse/hover and snaps camera transitions; full ARIA `tablist`/`tabpanel` semantics and focus-visible outlines.

## 5. Verification & Browser QA Evidence

- **TypeScript (`tsc -b`) & Production Build (`npm run build`):** Passed (exit code `0`, `✓ built` cleanly).
- **Vitest Unit Tests (4 files / 10 tests passed):**
  - `DronesPage.test.tsx`: **4/4 passed** (default 3D room render, loading state, `assignmentMissionId` auto-tab + mission preselection, English i18n switch).
  - `DroneFleetRoom.test.tsx`: **1/1 passed** (all 18 API drones rendered in scene + Fleet tab selection).
  - `DroneRoomAssignmentControl.test.tsx`: **2/2 passed** (real assignment + primary drone replacement confirmation).
  - `droneRoomLayout.test.ts`: **3/3 passed** (ring expansion geometry & room extent).
- **Playwright Multi-Viewport QA (`e2e/drone-room-uiux-redesign.e2e.ts`):**
  - Verified at `1440×900`, `1366×768`, `1920×1080`, and `390×844` with zero horizontal overflow, zero `.mgr-flight-decor` stray ellipse, single `"Phòng drone 3D"` heading, viewport-locked height (no giant blank scroll space), working 3D toolbar (`Zoom In`, `Zoom Out`, `Focus Selected`, `Fit All`, `Reset`), smooth 3D focus when selecting a drone from the `Danh sách` tab, and clean `Gán nhiệm vụ` tab.
  - Visually inspected screenshots:
    - `docs/screenshots/drone-room-after-1440.png`
    - `docs/screenshots/drone-room-after-list-tab.png`
    - `docs/screenshots/drone-room-after-assign-tab.png`
    - `docs/screenshots/drone-room-after-1366.png`
    - `docs/screenshots/drone-room-after-1920.png`
    - `docs/screenshots/drone-room-after-390.png`

## 6. Remaining Notes

- All existing backend APIs (`dronesApi.listDrones`, `missionsApi.listMissions`, `droneApi.getAvailable`, `missionsApi.assignDevice`) and mission replacement confirmation rules remain unchanged.
- Expansion pads beyond the 6 core interior pads continue to use the deterministic ring layout in `droneRoomLayout.ts` (preserving `droneRoomLayout.test.ts`), now paired with smooth camera zoom/focus/fit controls so any drone on any pad can be inspected effortlessly.
