# OnDemand Monitor — Landing Page Motion System

## 1. Motion Tokens (`src/features/landing/landingMotion.ts`)
- **Primary engine**: `motion/react` (`useScroll`, `useTransform`, `AnimatePresence`, `useReducedMotion`) + CSS transitions for hover/focus micro-interactions.
- **Easing**: `easeOut: [0.22, 1, 0.36, 1]` (cinematic deceleration), `spring: { stiffness: 320, damping: 30 }`.
- **Durations**: `micro: 0.16s`, `short: 0.28s`, `medium: 0.45s`, `cinematic: 0.72s`.
- **Stagger**: `0.07s` across cards and timeline steps.

## 2. Role Assignment by Section
| Section | Motion Role | Reduced-Motion Fallback |
|---|---|---|
| Hero | Scroll-linked parallax depth (`useScroll` + `useTransform`) on video/poster + subtle entrance | Static poster frame, immediate final opacity |
| Service Explorer | Asymmetric cross-fade stage (`AnimatePresence mode="wait"`) + shared-layout active indicator (`layoutId`) | Instant swap, no slide |
| Operational Pillars (`#services`) | Restrained viewport-triggered stagger (`viewport={{ once: true }}`) | Rendered immediately visible |
| Workflow (`#about` / `#how-it-works`) | Scroll-linked progress line + subtle reticle scan | Static progress bar & frame |
| AI Consultant Section | Reuses `AIAnimatedMascot` (`state="welcome"` on hover / `state="idle"` default) | Static mascot |

## 3. Performance & Accessibility Safeguards
- Native scrolling preserved (zero scroll-jacking).
- Hero video pauses automatically when scrolled out of view or when `document.hidden` is true, and falls back to the `.webp` poster under `prefers-reduced-motion: reduce`.
- Every animated heading remains unsplit and immediately readable by screen readers and without JS.
- Zero `requestAnimationFrame` loops when offscreen.
