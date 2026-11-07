# Drone room and assignment workspace

## What changed

The Manager **Đội drone** page now opens on a Blender-built 3D room. The room replaces the old fleet summary cards and device-card grid as the main view. A side panel keeps the real device list, search, current API status, device details, and status-change action. All devices returned by the existing paged fleet API appear together in the room and scrollable list; the six Blender pads are the core layout, with additional pads placed on circular outer rings as the fleet grows.

The **Gán drone** tab remains available from the same page. Mission choices come from the existing missions API and are limited to missions in `PLANNING` or `READY` with a scheduled start and end. For the selected mission, available devices come from `droneApi.getAvailable`; already assigned devices and non-`AVAILABLE` devices are filtered from the picker. Selecting a model in the 3D room and selecting a device in the list share the same selected ID.

Assigning calls the existing `missionsApi.assignDevice(missionId, deviceId, role)` flow. The UI shows success only after that request succeeds, updates the returned mission, and reloads the available-device list. Errors stay visible and do not optimistically mark the assignment complete. The existing confirmation for replacing a main drone is preserved. No backend endpoint or API contract changed.

## 3D asset and runtime

- Blender source: `assets/drone-assignment/drone_assignment_room.blend`
- Reproducible builder: `tools/blender/build_drone_assignment_room.py`
- Web asset: `public/models/drone-assignment/drone-assignment-room.glb`
- Render preview: `assets/drone-assignment/drone_assignment_room_preview.png`
- Browser capture: `assets/drone-assignment/browser-preview.png`

The Blender scene uses a white and pale-blue operations room, six core landing pads, a flight-operations console, equipment and charging areas, PBR materials, and soft area lighting. The exported GLB is approximately 0.85 MB and contains about 16.6k triangles. Its named `PAD_01`–`PAD_06` anchors and hidden-render `DRONE_TEMPLATE` are used by `DroneRoomScene`; the browser clones the pad and drone models for actual API devices, adds a radial floor extension, and frames the expanded room to fit. Slot labels are generated from live indices so extension pads are numbered correctly. This keeps device identity and status in API data rather than baking sample devices into the asset.

Blender 5.2.1 was run with the reproducible `bpy` builder in background mode. The live Blender scene was not changed. The scene also retains overview and detail cameras for future renders.

## Interaction and resilience

- Clicking a drone in the room selects the matching API device and updates the accessible device list and details.
- The list remains a keyboard-accessible selection path when WebGL is unavailable.
- The scene is lazy-loaded and renders on demand; device data changes do not recreate the renderer.
- Every returned device is rendered. New devices after the six core pads add outer-ring pads and expand the floor and camera framing; the list stays scrollable without paging.
- Loading, API error, empty inventory, empty search, and missing-WebGL states are represented.
- Device battery is not shown because the fleet API response used here does not supply battery telemetry.
- The 3D model is a visual fleet layout. Physical pad position is not stored by the backend.

## Skills applied

- `blender-core`, `blender-hardsurface-modeling`, `blender-pbr-materials`, `blender-lighting-lookdev`, `blender-rendering`, and `blender-asset-qa` for scene creation, export, presentation, and mesh review.
- `frontend`, `vercel-react-best-practices`, `design-taste-frontend`, and `ui-ux-pro-max` for React integration, renderer lifecycle, responsive layout, and accessible selection.
- `webapp-testing` for local browser checks of the rendered model, interactions, and viewport sizes.

## Verification

- Blender GLB export completed with six pad anchors and one reusable drone template.
- Blender asset QA: passed with no geometry errors, z-fighting, or floating parts. The report lists hidden back-to-back faces at joined room/pad and prop surfaces.
- Browser: the GLB returned HTTP 200; the room and API-backed drones rendered; selecting a device updated its details; no uncaught page errors were recorded.
- Responsive widths checked: 390, 768, and 1440 px; document width matched each viewport.
- The assignment tab and 3D picker were visible in the browser.
- Browser fleet expansion check: a local API response with 18 devices rendered 18 selectable drones across the core pads and two expanding outer rings, without a pagination control or page errors.
- TypeScript typecheck, ESLint, targeted Vitest, and production build passed.
