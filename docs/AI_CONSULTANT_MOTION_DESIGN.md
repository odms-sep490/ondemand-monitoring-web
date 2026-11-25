# AI Consultant — Motion Design

Scope: visual and motion layer of "AI hỗ trợ tạo yêu cầu" (`src/features/customer/pages/CreateOrder/components/`). No AI, RAG or backend logic was changed.

## Visual principles
- White surface with soft cyan/electric-blue radial light; one accent family (`#1565e8`, `#38bdf8`), green only for confirmed data.
- Text stays on solid surfaces at full contrast. No glass behind body text.
- Motion only answers a real event: opening, a request in flight, a validated field, a selection.
- Big gestures for onboarding only. While the customer types or reads a long description the robot goes still (`calmFocus`).

## Motion tokens (`aiMotionTokens.ts`)
| Token | Value | Use |
|---|---|---|
| `duration.micro` | 0.14s | button press |
| `duration.short` | 0.22s | bubbles, widgets |
| `duration.medium` | 0.34s | cards, panels |
| `ease.out` | cubic-bezier(.22,1,.36,1) | all entrances |
| `ease.spring` | stiffness 380 / damping 30 | shared-layout outline |
| `stagger` | 0.06s | service card reveal |
| `AI_CARD_TILT_DEG` | 6° | pointer tilt (fine pointer only) |

## Components
| Component | What moves | Trigger |
|---|---|---|
| `AnimatedServiceCard` | staggered reveal, pointer tilt, image skeleton → fade, hover zoom, shared `layoutId` outline that glides between cards, check pop on select, other cards dim | real catalog (`imageUrl` → `fallbackImageUrl` → initial letter) |
| `AIThinkingBubble` | dashed hologram ring, data glyphs drifting to the robot, scanline sweep, typing dots | only while a conversation request is in flight |
| `AIOrderDraftSummary` | one milestone segment per required field; done = gradient + glow burst, first missing = pulse; panel turns green "Sẵn sàng xem lại" when all required fields are valid | computed from `FormState` validation, not from clicks |
| `AIAnimatedMascot` | 11 states, 7 expressions, 10 gestures, amplitude-smoothed speech glow | `resolveRobotPersonality` |
| `OrderAssistantLauncher` | hover lift + invitation pill (desktop only), stable button hit area | pointer hover/focus |
| Welcome hero | robot springs in from the launcher corner, copy fades in after | modal open |
| `MissionDescriptionAssistant` | 4-step stepper, facts flash blue when added, question swaps with `AnimatePresence`, preview expands | real `description-review` response |

## Choreography
1. Click launcher → modal opens → robot springs from top-right into hero → welcome copy → cards stagger in (≈0.5s total). Nothing blocks clicks.
2. Auto-presentation highlights each real service every 2.6s; any hover, focus or click stops it immediately.
3. Select service → outline settles green, check pops, other cards dim, draft "Dịch vụ" milestone glows, robot `confirming`.
4. Send message → bubble slides in → thinking bubble (ring + scanline) → reply replaces it; robot only enters `speaking` when TTS audio actually plays.
5. All required fields valid → draft panel turns green, robot `success` via `REVIEW_READY`.

## Performance & accessibility
- Transforms and opacity only; tilt uses motion values (no React re-render per pointer move).
- Tilt disabled on touch / coarse pointers; glyphs and scanline hidden ≤900px.
- `prefers-reduced-motion` disables every keyframe, tilt and entrance offset.
- Mascot pauses when the tab is hidden; rAF, timers and audio nodes are cleaned up.
- `aria-pressed` on service buttons, `role=status` on thinking bubble, milestones carry `aria-label`, cyan `:focus-visible` ring.

## Honest limitations
- The mascot is a single raster image. "Gestures" are whole-body transforms plus overlays (ring, dots, waves, pointer, sparkle). There is no independent arm, eye or mouth articulation; that needs a layered or rigged source asset.
- Speech sync is amplitude-driven (Web Audio RMS), not phoneme lip sync.
- Pointing at map/date widgets is not implemented: those open in a separate step modal, so there is no on-screen target to point at.
- Playwright visual runs need the backend + QA environment; not captured in this pass.
