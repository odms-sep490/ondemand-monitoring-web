# OnDemand Monitor — Living AI World V3 (`AI_ROBOT_CREATIVE_MOTION_V3`)

## 1. Motion Design Language

Every animated element in the AI Order Consultant workspace draws from one shared token set in [`aiMotionTokens.ts`](../src/features/customer/pages/CreateOrder/components/aiMotionTokens.ts):

- **Color & Light Language:** Cyan light trails (`#00c4ff` / `#38bdf8`), royal-blue depth accents (`#1565e8`), emerald confirmation highlights (`#10b981`), and frosted glass cards (`rgba(248, 252, 255, 0.82)`).
- **Spring Physics:** Dedicated springs for portal entrance (`portalSpring`), magnetic edge docking (`dockSpring`), delayed antenna follow-through (`antennaSpring`), 3D card tilt (`softSpring`), and tactile clicks (`spring`).
- **Timing Discipline:** Brief, interruptible choreography (`portalFirst: 0.78s`, `portalRepeat: 0.36s`, `chipFlight: 0.58s`, `goodbye: 0.38s`). Messages never hide behind slow typewriter animations.

## 2. Real 3D vs. Articulated 2.5D Rig Approach & Asset Limitations

- **Existing Asset:** `public/assets/ai/ondemand-ai-mascot.webp` is a single flat raster image of the glossy white-and-blue floating robot mascot. Animating it as a single `<img>` only supports whole-body bob/tilt and cannot articulate individual limbs, eyes, mouth, or antenna.
- **V3 Architecture Decision:**
  - Rather than adding a heavy React Three Fiber / Rive runtime without a rigged `.glb` or `.riv` mascot asset, V3 introduces [`RobotCharacterRig.tsx`](../src/features/customer/pages/CreateOrder/components/RobotCharacterRig.tsx) — a **faithful, articulated 2.5D layered SVG character rig** matching the original mascot's exact glossy white helmet, dark glass visor, glowing cyan eyes, rosy mouth, ear pods with 4-point star emblem, blue chest star badge, cyan antenna bulb, hover thruster, cyan orbital energy rings, and golden sparkles.
  - **Independent Joints & Secondary Physics:**
    - `antenna` (`transformOrigin: 100px 44px`): delayed spring wobble trailing head/wave/celebrate motion, plus listening/thinking pulse.
    - `head`: independent nod, curious tilt, and pointer/target lean.
    - `eyes`: live gaze tracking (`gaze.x`, `gaze.y`), automatic blinking + procedural double-blink, and 7 distinct expressions (`happy`, `curious`, `focused`, `excited`, `confused`, `calm`, `encouraging`).
    - `mouth`: amplitude-driven openness via real Web Audio `AnalyserNode` RMS (`AudioReactiveAnimator.ts`) during TTS playback (honestly amplitude-driven; no fake phoneme lip-sync claims).
    - `left-arm` & `right-arm`: independent shoulder/forearm waving (with cyan wave arcs), dual-arm celebration, open-palms speaking gestures, directional pointing (`point_left`, `point_right`, `present_card`), hand flourish, and idle holographic cube inspection.
  - **Compact Avatar Fallback:** The 36px inline chat avatar (`size="avatar"`) retains the lightweight `/assets/ai/ondemand-ai-mascot.webp` image with state rings and audio glow, keeping DOM weight low and preserving backward compatibility.

## 3. Animation Director System & Gesture Priority

Centralized in [`AIRobotAnimationController.ts`](../src/features/customer/pages/CreateOrder/components/AIRobotAnimationController.ts):

| Priority Tier | Weight | States |
| --- | --- | --- |
| `USER_INTERACTION` | 50 | `error`, `goodbye` |
| `REAL_AUDIO_STATE` | 40 | `listening`, `speaking` |
| `ACTIVE_CONSULTATION` | 30 | `thinking`, `pointing`, `explaining` |
| `SHORT_SUCCESS_FEEDBACK` | 20 | `welcome`, `confirming`, `success` |
| `DECORATIVE_IDLE` | 10 | `idle` (+ procedural micro-behaviors) |

- **Single Dominant Gesture:** Only one primary state/gesture runs at a time; eye blinking, gaze tracking, and antenna follow-through layer cleanly without fighting.
- **Controlled Success Variety:** `pickSuccessVariation(counter)` deterministically rotates through `nod`, `small_wave`, `smile_tilt`, `hand_flourish`, and `celebrate_pop` so milestones feel alive while remaining deterministic in automated visual tests.
- **Procedural Idle Personality:** `pickNextIdleAction(previous, seed)` cycles `look_left`, `look_right`, `double_blink`, `head_tilt`, `hover_adjust`, `inspect_holo_hand`, and `gentle_wave` on a controlled 5.5–10.5s schedule, never repeating consecutive actions and automatically pausing during `calmFocus` (typing, description review, or date selection).

## 4. Implemented Effects & Choreography

| Experience | Implementation |
| --- | --- |
| **Portal Robot Entrance** | [`AIPortalTransition.tsx`](../src/features/customer/pages/CreateOrder/components/AIPortalTransition.tsx) renders layered glowing cyan portal rings behind the hero robot; first open plays full ring expansion + aerial spin (`0.78s`), repeat opens play a brisk variation (`0.36s`); instant reveal under `prefers-reduced-motion`. |
| **Magnetic Edge Dock & Pointer Personality** | [`OrderAssistantLauncher.tsx`](../src/features/customer/pages/CreateOrder/components/OrderAssistantLauncher.tsx) supports drag-vs-click detection, viewport clamping, magnetic left/right edge snapping with spring bounce, keyboard `Shift+Arrow` repositioning, and fine-pointer-only eye tracking + occasional greeting sparkle. |
| **Service Card Magic Reveal** | [`AnimatedServiceCard.tsx`](../src/features/customer/pages/CreateOrder/components/AnimatedServiceCard.tsx) renders real backend services with staggered 3D perspective entrance, pointer-driven tilt (`±6°`), cyan specular lighting, subtle image parallax, and animated selected halo. |
| **Service Micro-Worlds** | [`ServiceMicroWorld.tsx`](../src/features/customer/pages/CreateOrder/components/ServiceMicroWorld.tsx) renders subtle category-driven SVG silhouettes (`factory`, `forest`, `construction`, `area`) derived strictly from real service metadata — never fabricating mission geometry. |
| **Miniature Drone Illustration** | [`MiniatureDroneIllustration.tsx`](../src/features/customer/pages/CreateOrder/components/MiniatureDroneIllustration.tsx) provides a purely decorative hovering quadcopter in the welcome hero and Step 2 guidance banner (kept strictly separate from the real Leaflet map). |
| **Robot Touches the Interface** | [`RobotTargetRegistry.ts`](../src/features/customer/pages/CreateOrder/components/RobotTargetRegistry.ts) registers real DOM bounds (`services`, `purpose`, `description`, `draft`, step widgets) and computes live gaze/pointing vectors only when targets are visible in the viewport. |
| **Holographic Data Analysis** | [`HologramEffectLayer.tsx`](../src/features/customer/pages/CreateOrder/components/HologramEffectLayer.tsx) + [`AIThinkingBubble.tsx`](../src/features/customer/pages/CreateOrder/components/AIThinkingBubble.tsx) show an abstract cyan document scanner during real in-flight requests only (no fake reasoning or percentages). |
| **Flying Data Chips** | [`FlyingDataChip.tsx`](../src/features/customer/pages/CreateOrder/components/FlyingDataChip.tsx) animates a temporary glowing chip from confirmed actions (service, purpose, description, step confirmations) to `[data-draft-key]` in [`AIOrderDraftSummary.tsx`](../src/features/customer/pages/CreateOrder/components/AIOrderDraftSummary.tsx), falling back to a local highlight if the Draft row is offscreen. |
| **Morphing Chat Bubbles & Mission Brief Reveal** | `AnimatePresence` + `layoutId="ai-assistant-turn"` morphs the thinking indicator into the assistant reply; [`MissionDescriptionAssistant.tsx`](../src/features/customer/pages/CreateOrder/components/MissionDescriptionAssistant.tsx) unfolds an immediately editable Mission Brief card. |
| **Goodbye Animation** | Closing the workspace immediately aborts in-flight work, preserves session state, and triggers a goodbye wave on the docked floating robot. |

## 5. Before / After Comparison

- **Before (V2):** Static raster `<img>` bobbing as one flat unit; flat static service cards with no tilt/lighting or category ambiance; no portal entrance; basic drag without magnetic edge docking; no flying chip link to the Draft summary; HTTP/2 upgrade warnings on Java→Python worker calls.
- **After (V3):** Articulated 2.5D layered SVG character rig with independent joints and delayed antenna physics; cyan portal entrance with aerial spin; magnetic edge-docked launcher with pointer tracking; 3D-tilting service cards with dynamic cyan lighting, category micro-worlds, and miniature drone illustration; FLIP-style flying data chips landing on live Draft rows; holographic document scanner during real processing; controlled procedural idle and success gesture variations.

## 6. Performance & Accessibility

- **Zero extra bundle dependencies:** Built entirely with the already-installed `motion/react` and lightweight inline SVG/CSS transforms (`transform`, `opacity`).
- **GPU-friendly & visibility-aware:** Audio-reactive RMS sampling throttles to ~24fps and pauses automatically on `document.hidden`; no full-screen WebGL canvas.
- **Accessibility:** Full `prefers-reduced-motion: reduce` support (instant workspace reveal, no portal rings, no flying chips, no idle loops), keyboard-accessible launcher movement (`Shift+Arrow`), preserved `aria-live="polite"` / `aria-pressed` / focus-visible outlines, and touch-safe pointer-tracking guards (`(hover: hover) and (pointer: fine)`).

## 7. Verification & Playwright Visual Evidence

- **TypeScript typecheck (`tsc -b`):** Passed (0 errors).
- **Production build (`npm run build`):** Passed (`vite build` succeeded, `dist/` generated cleanly).
- **Unit tests (`vitest`):**
  - `AIAnimatedMascot.test.tsx`: **4/4 passed** (including articulated 2.5D rig joint verification for `antenna`, `head`, `eyes`, `mouth`, `left-arm`, `right-arm`).
  - `AIRobotAnimationController.test.ts`: **6/6 passed** (priority resolution, deterministic success variations, non-repeating procedural idle actions, `calmFocus` suppression, and service micro-world metadata mapping).
  - Note: `OrderConversation.test.tsx` has 12 pre-existing failures asserting legacy V1 Vietnamese copy (`Đề xuất — cần bạn xác nhận`, `Nhập bằng giọng nói`, `Tiếp tục nhập thủ công`) that were already absent before V3; the close/abort regression test (`ignores a late response after the chat modal closes`) passed.
- **Playwright visual & interaction verification (`e2e/ai-robot-creative-motion-v3.e2e.ts`):** **2/2 passed** (Chromium 1440×900, mobile 390×844, and `prefers-reduced-motion: reduce`).
  - Captured and visually inspected:
    - `docs/screenshots/ai-v3-launcher-desktop.png` — Articulated 2.5D robot launcher with cyan portal halo in bottom-right dock.
    - `docs/screenshots/ai-v3-workspace-desktop.png` — Living AI World workspace with articulated hero robot, miniature drone, subtle right-masked micro-world silhouette, topbar service badge, and 2×2 service grid.
    - `docs/screenshots/ai-v3-service-selected.png` — Dynamic switch to the factory roof micro-world badge, speaking state aura, and cyan arrival glow on the `Dịch vụ` Draft row after chip flight.
    - `docs/screenshots/ai-v3-workspace-mobile.png` — 390×844 mobile layout with zero horizontal overflow and collapsible Draft summary.
  - Visual polish iteration from inspecting the first capture: softened and right-masked `.ai-welcome-microworld-bg` so SVG lines never cross the welcome heading, and tightened `.ai-svc-media` / `.ai-svc-body` spacing so all 4 service cards remain visible on desktop.

## 8. Remaining Limitations

- Mouth animation during TTS is amplitude-driven (Web Audio RMS) rather than phoneme-level viseme lip-sync, because the local TTS worker streams WAV audio without phoneme timestamps.
- The 2.5D SVG rig provides genuine independent 2D/2.5D joint articulation without a 3D mesh; full 360° volumetric camera orbit would require a dedicated rigged `.glb` mascot asset in the future.
