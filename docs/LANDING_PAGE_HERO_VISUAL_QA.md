# Landing Page Hero — Visual QA Summary

## Before vs After
- **Brightness**: Replaced stacked 90%/86% black scrim with a directional `70% → 40% → 10%` navy gradient + `brightness(1.14)` media lift. Headline and CTA maintain strong WCAG AA+ contrast while the drone video and aerial depth are clearly visible.
- **White Gap at Bottom**: Fixed root cause (`min(92svh, 820px)` on desktop and `580px` on mobile) by enforcing `min-height: 100svh` with `inset: -8% 0` parallax buffer on `.lp2-hero-stage`. The Hero now fills 100% of the initial viewport seamlessly across desktop, tablet, and mobile with zero white strip.
- **Typography & Spacing**: Centered the hero content vertically (`align-items: center`) with `padding: 112px 0 96px`, tightened subtitle spacing (`22px`), and increased subtitle legibility (`rgb(241 245 249 / 92%)`).

## Verification
- **TypeScript + Vite Production Build (`npm run build`)**: Executed (`tsc -b && vite build`).
- **LandingPage Unit Tests (`LandingPage.test.tsx`)**: Executed (`6/6`).
- **Git status**: No commit, push, or deployment performed.
