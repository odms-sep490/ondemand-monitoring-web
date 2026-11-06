# Living Office 3D — Phase 1

## Business mapping

The Manager Schedule page combines the available-staff API with active mission data. Current staff responsibilities are taken from current mission staff assignments; the backend role values confirmed for this flow are `PILOT`, `OPERATOR`, `MAINTAINER`, and `INSPECTOR`. The current manager identity is supplied separately by the page.

| Office area | Verified mapping | What the screen shows |
| --- | --- | --- |
| Manager office | Current manager identity | Manager profile and team overview |
| Flight dispatch | `PILOT`, `OPERATOR` | Staff and active mission status from loaded assignments |
| Engineering | `MAINTAINER` | Staff and active mission status from loaded assignments |
| Device inspection | `INSPECTOR` | Staff and active mission status from loaded assignments |
| Shared workspace | Staff with no mapped role in the loaded data | A neutral default area, not a business department |
| Meeting room, lounge, pantry, storage | Shared/support spaces | Illustrative furniture only; no live meeting, occupancy, or inventory state is claimed |

Because the available-staff response does not provide a complete organization-wide role directory, a person with no role in the loaded active mission assignments is shown in Shared workspace. This does not assert that the person has no role elsewhere in the system.

## Scene and interaction changes

- Kept the current vanilla Three.js scene, orthographic camera, OrbitControls, FBX character loading, and existing route-based staff placement.
- Replaced the unsupported “Design studio” label with Shared workspace and added two shared desks.
- Applied muted, area-specific floor colors and reduced the glass partition height and opacity so the whole office stays visible.
- Added a visual monitor wall in Flight dispatch, a tool board and work tray in Engineering, a pin board in Shared workspace, and a coffee station in the pantry. These are decorative scene props, not live telemetry or inventory.
- Added room and staff hover emphasis, native contextual titles, double-click camera focus, and a keyboard-operable room selector.
- Room details now show the area's business mapping and staff that match that mapping, with mission status still sourced from loaded API data.
- Staff with an active mission assignment stay at their mapped workstation instead of taking an ambient break. Break movement remains visual-only for staff without an active mission.
- Animation playback continues to use matching clips only when the FBX provides them. No typing, inspection, or other task animation is claimed by this change.

## APIs and state

The Schedule page remains the integration point. It passes available operators, active missions, the manager identity, and language to `Office3DView`. Active staff roles are derived from current `staffAssignments`; mission labels and statuses use the existing domain status helpers. This work adds no API, backend, or database changes.

## Skills applied

- `design-taste-frontend`: used to assess the office as a working product screen and retain the existing blue application identity.
- `ui-ux-pro-max`: applied accessible focus treatment, direct selection feedback, and responsive controls.
- `frontend`: followed the existing Three.js lifecycle and avoided per-frame React state updates.
- `webapp-testing`: used to attempt local route and viewport inspection. The isolated browser redirected to sign-in, so it could not inspect the authenticated 3D office.

## Changed files

- `src/features/manager/pages/Schedule/components/Office3DView.tsx`
- `src/features/manager/pages/Schedule/components/office3d.scss`
- `src/features/manager/pages/Schedule/components/officeBusiness.ts`
- `src/features/manager/pages/Schedule/components/officeBusiness.test.ts`
- `docs/architecture/living-office-3d-phase1.md`

## Verification and current limits

- Business-area mapping tests: **6 passed**.
- Type checking: passed. ESLint on the changed TypeScript files: passed. The scoped app style scan has no FAIL findings; it reports five existing shadow warnings.
- `SchedulePage.test.tsx`: **7 passed, 4 failed** in the current checkout. Failure output shows the mock-backed page remaining in its loading/error state and an English title assertion expecting `Mission schedule`; this page test was not changed as part of the office scene work.
- Production build: passed. Vite reports the existing large-chunk warning and dependency `eval` warnings from `lottie-web`.
- Browser review: the isolated local browser redirected to the sign-in page, so the authenticated office scene could not be visually verified in this session.
- The existing graph routes characters through office waypoints for ambient breaks; this phase does not add collision-aware routing around every prop or individual business workflows such as drag-and-drop mission assignment.
- Available FBX clips are selected by supported clip names at runtime. Additional task-specific character actions require an asset with validated animation clips or a separately authored procedural animation.
