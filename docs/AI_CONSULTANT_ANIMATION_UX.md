# AI Consultant Animated Workspace — UX & Architecture

## 1. UI Architecture

The Customer AI Consultant workspace lives inside the existing Create Order flow (`ondemand-monitoring-web/src/features/customer/pages/CreateOrder/components/`) without duplicating business state or modifying Create Order APIs:

- **`AIRobotAnimationController.ts`**: Typed animation state machine (`AIMascotState`), backend/UI event mapping (`AIRobotEvent`), single-primary-state priority resolver (`resolveMascotState`), and Vietnamese status labels (`MASCOT_STATUS_LABEL`).
- **`AIAnimatedMascot.tsx` / `AIAnimatedMascot.css`**: Layered 2.5D animated robot rig built on `motion/react` using the existing `/assets/ai/ondemand-ai-mascot.webp` asset, supporting `launcher`, `hero`, `companion`, and `avatar` sizes.
- **`OrderConversation.tsx` / `OrderConversation.css`**: Responsive 2-column desktop workspace (Conversation & Contextual Stage on the left, live `AIOrderDraftSummary` on the right, sticky composer at the bottom) that collapses cleanly to 1 column on mobile (`<= 900px`).
- **`AIOrderDraftSummary.tsx`**: Live Order Draft panel showing confirmed vs missing information across all order steps with completion percentage, animated update highlights, and quick edit actions.
- **`MissionDescriptionAssistant.tsx` / `MissionDescriptionAssistant.css`**: Interactive `"AI hỗ trợ hoàn thiện yêu cầu"` panel with a 4-stage progress stepper (*1. Đánh giá → 2. Làm rõ → 3. Hoàn thiện → 4. Áp dụng*), animated newly-confirmed facts, highlighted active question, and smooth description preview expansion.

## 2. Robot Asset & 2.5D Rig Approach

- **Asset**: `/assets/ai/ondemand-ai-mascot.webp` (glossy white/blue floating robot with cyan eyes and neon ring). No generic substitute is used.
- **Approach**: Layered 2.5D rig combining `motion/react` body/head choreography with state-driven CSS/DOM overlays:
  - Ambient neon halo ring (reacts to state & audio amplitude).
  - `thinking`: head tilt + floating thought dots (`•••`).
  - `listening`: attentive lean + concentric sonar rings.
  - `speaking`: Web Audio `AnalyserNode` RMS amplitude drives `--speech-glow` and live equalizer bars synchronized with real TTS playback.
  - `pointing`: directional tilt + pointer cue synced to the hovered/focused service card.
  - `success`: cheerful nod + emerald checkmark badge.
  - `error`: subtle empathetic tilt + amber ring (no aggressive flashing).
- **Honest Limitation**: Because the supplied mascot is a rendered 2D `.webp` image rather than a rigged 3D `.glb` mesh, independent 3D skeletal arm articulation is not claimed; instead, a lightweight, high-FPS layered 2.5D rig preserves 100% of the mascot's visual identity without WebGL overhead.

## 3. Living Robot Personality & Animation State Machine

Only one primary animation state is active at a time (`resolveMascotState`), paired with deterministic secondary expressions (`AIRobotExpression`) and gestures (`AIRobotGesture`) via `resolveRobotPersonality`:

- **Primary states (11)**: `idle`, `welcome`, `listening`, `thinking`, `speaking`, `explaining`, `pointing`, `confirming`, `success`, `error`, `goodbye`.
- **Secondary expressions (7)**: `happy`, `curious`, `focused`, `excited`, `confused`, `calm`, `encouraging`.
- **Secondary gestures (10)**: `wave`, `nod`, `head_tilt`, `look_at_target`, `present_card`, `point_left`, `point_right`, `open_hands`, `celebrate`, `small_bounce`.
- **Priority**: `error` > `listening` > `thinking` > `speaking` > `pointing` > transient reaction (`welcome` / `confirming` / `success` / `goodbye`) > `idle`.
- **Hologram Assistant Overlay**: Lightweight translucent document/check hologram (`ai-animated-mascot__hologram`) appears beside the mascot during `thinking` analysis and disappears immediately when analysis completes.
- **Voice Amplitude Sync**: Web Audio `AnalyserNode` RMS is exponentially smoothed (`0.72 * prev + 0.28 * raw`) to prevent jitter, driving `--speech-glow` and live waveform bars; resets immediately on pause/stop.

Events mapped via `mascotStateForEvent`:
`SESSION_STARTED`, `MICROPHONE_STARTED`, `MICROPHONE_STOPPED`, `MESSAGE_SENT`, `AGENT_REQUEST_STARTED`, `AGENT_RESPONSE_RECEIVED`, `TTS_PLAYBACK_STARTED`, `TTS_PLAYBACK_ENDED`, `SERVICE_RECOMMENDED`, `SERVICE_SELECTED`, `REQUIREMENT_CONFIRMED`, `DESCRIPTION_READY`, `REVIEW_READY`, `VALIDATION_FAILED`, `SESSION_CLOSED`.

## 4. Performance & Accessibility

- Respects `prefers-reduced-motion` (`useReducedMotion()` + CSS `@media (prefers-reduced-motion: reduce)`).
- Pauses animation loops automatically when `document.hidden` is true.
- Cleans up `requestAnimationFrame`, `AudioContext`, `MediaRecorder`, and `AbortController` on close/unmount.
- Graceful static fallback (`RobotOutlined`) if the mascot image fails to load.
- Zero WebGL dependency; works on all browsers and low-power devices.

## 5. Verification Results

- **Unit tests**: `AIAnimatedMascot.test.tsx` (2/2 passed) and `AIRobotAnimationController.test.ts` (2/2 passed).
- **Production build**: `tsc -b && vite build` verified.
- **Note**: Existing `OrderConversation.test.tsx` has 8 pre-existing failures from an earlier UI copy refactor (unrelated to these changes); all 5 voice/loading/optimistic-bubble tests pass. Live Playwright E2E browser capture requires a running backend + QA environment.
