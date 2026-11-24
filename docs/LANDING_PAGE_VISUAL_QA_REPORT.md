# OnDemand Monitor — Visual QA Report

## 1. Visual Assets Verified & Integrated

| Asset Path | Tool / Provenance | Visual QA Result | Notes |
|---|---|---|---|
| `public/assets/landing/services/factory-inspection.jpg` (956 KB) | Generated via `image-generator` (`gemini-3.1-flash-image`) | **PASS** | Crisp enterprise quadcopter with gimbal camera above modern metal industrial roof & solar panels; zero text, zero artifacts, natural late-afternoon lighting. |
| `public/assets/landing/services/forest-monitoring.jpg` (956 KB) | Generated via `image-generator` (`gemini-3.1-flash-image`) | **PASS** | Clean enterprise survey drone above lush misty highland forest canopy; zero text/watermarks, cohesive aerial color language. |
| `public/assets/landing/backgrounds/final-cta-drone.jpg` (571 KB) | Generated via `image-generator` (`gemini-3.1-flash-image`) | **PASS** | Twilight drone with cyan navigation LEDs in right third; generous deep-navy negative space across left 60% paired with directional scrim for WCAG AA+ white text contrast. |
| `public/images/landing/bridge-inspection.webp` | Verified existing project asset (`credits.json`) | **PASS (REUSED)** | Used for `Giám sát khu vực` after `gemini-3.1-flash-image` reached its 5-hour quota (`429 RESOURCE_EXHAUSTED`). |
| `public/images/landing/construction-1280.webp` | Verified existing project asset (`credits.json`) | **PASS (REUSED)** | Used for `Giám sát công trình` after `gemini-3.1-flash-image` reached its 5-hour quota (`429 RESOURCE_EXHAUSTED`). |
| `public/assets/cinematic-drone/living-mission-industrial-v5.mp4` + mobile variant + posters | Verified existing project video | **PASS (REUSED)** | Full-bleed Hero video with offscreen auto-pause, scroll parallax, and reduced-motion poster fallback. |
| `public/assets/ai/ondemand-ai-mascot.webp` | Verified existing project mascot | **PASS (REUSED)** | Preserved unchanged in `LandingAIConsultantSection` (`AIAnimatedMascot`). |

## 2. Motion & Integration Verification
- **Service Explorer (`InteractiveServiceShowcase.tsx`)**: Smooth `AnimatePresence` tab cross-fade + Ken Burns depth settle (`scale: 1.05 → 1.0`), disabled under `prefers-reduced-motion: reduce`.
- **Final CTA Band (`LandingPage.tsx` + `landing.css`)**: Full-bleed twilight drone image (`object-position: right center`) behind a 94% → 32% left-to-right deep-navy scrim so headline & CTAs remain crisp on desktop, tablet, and mobile.
- **Automated Verification**: `LandingPage.test.tsx` (6/6), `resolveCreateRequestTarget.test.ts` (5/5), and `npm run typecheck` (`tsc -b`).

## 3. Honest Limitations
- Two service slots (`Giám sát khu vực`, `Giám sát công trình`) reuse existing verified project aerial photography because the `gemini-3.1-flash-image` quota reset window (~5 hours) was reached after generating 3 bespoke images. They can be swapped into `public/assets/landing/services/` once quota resets without changing component structure.
- No git commit, push, or deployment was performed.
