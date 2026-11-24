# Landing Page Hero Fix Report

## 1. Root Cause Analysis

### Issue A — Hero Appeared Overly Dark & Heavy
- **Root Cause**: CSS selector specificity conflict in `src/features/landing/landing.css`.
  - The legacy rule `.lp-editorial .lpx-hero-scrim` (specificity `0,2,0`, lines 328–340) overrode `.lp2-hero-scrim` (specificity `0,1,0`, line 1233).
  - The winning legacy scrim stacked two heavy black gradients: **90% black** on the left + **86% black** across the entire bottom (`rgb(5 6 5 / 90%)` and `rgb(5 6 5 / 86%)`), suffocating the already moody dusk industrial drone video.
  - Additionally, `.lp-editorial .lpx-hero-media` ran a legacy `lpx-hero-settle` CSS animation alongside the Motion parallax wrapper.

### Issue B — White Strip / Gap Visible at Bottom of Hero
- **Root Cause**: Short viewport height constraints in `src/features/landing/landing.css`:
  - Desktop `.lp-editorial .lpx-hero` had `min-height: min(92svh, 820px)` (line 311). On 1080p desktop monitors, the Hero stopped at 820px, exposing **260px** of the light-background `#f6f8fc` next section (`.lp2-catalog`) at the bottom of the first viewport — appearing as an unintentional white strip beneath the Hero.
  - Mobile `.lp-editorial .lpx-hero` had `min-height: 580px` (line 1106), exposing **250px+** of white strip on modern mobile screens (e.g. 844px iPhone).
  - `.lp2-hero-stage` used `inset: 0` while translating vertically on scroll (`y: 0% → 14%`), risking edge exposure during parallax movement.

## 2. Affected Files
- `src/features/landing/landing.css`

## 3. Exact Fix Applied
1. **Scoped Specificity (`0,3,0`)**: Replaced `.lp2-hero` and `.lp2-hero-scrim` with `.lp-editorial .lpx-hero.lp2-hero` and `.lp-editorial .lpx-hero-scrim.lp2-hero-scrim` so the new rules cleanly override legacy editorial rules on desktop, tablet, and mobile.
2. **Eliminated White Strip**: Set `min-height: 100svh; margin: 0; align-items: center; padding: 112px 0 96px;` on `.lp-editorial .lpx-hero.lp2-hero` (and `100svh` on mobile `<= 640px`), plus `inset: -8% 0` on `.lp-editorial .lp2-hero-stage` so parallax motion never exposes container edges.
3. **Balanced Brightness & Contrast**:
   - Lifted hero video/poster clarity with subtle `filter: brightness(1.14) contrast(1.04) saturate(1.06)` and removed the conflicting `lpx-hero-settle` animation.
   - Replaced the 90%/86% black scrim with a clean directional aviation gradient (`70% → 40% → 10%` left-to-right, `42% → transparent → 38%` top-to-bottom), revealing the drone and horizon while keeping white headlines razor-sharp via soft text-shadow (`0 2px 24px rgb(6 13 25 / 38%)`).
