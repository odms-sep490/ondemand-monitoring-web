# OnDemand Monitor — Landing Page Art Direction

## 1. Three Evaluated Directions

| Criterion | Direction A: Cinematic Drone Tech | Direction B: Modern Aerial Intelligence | Direction C: Futuristic Interactive 3D |
|---|---|---|---|
| Business Fit | High — enterprise trust & aviation rigor | High — clear SaaS workflow & checklist clarity | Medium — risk of feeling like a game |
| Brand Fit | High — matches dark dusk apron & cobalt blue | High — matches clean white/slate portal | Medium |
| Visual Distinctiveness | Strong cinematic video hero | Clean editorial rhythm | High, but heavy GPU cost |
| Performance (LCP/INP) | High (poster + lazy video) | Very high | Lower (WebGL overhead) |

## 2. Chosen Direction: Hybrid A + B ("Cinematic Aerial Precision")
- **Hero**: Full-bleed dark aviation slate (`#060d19`) with the project's authentic industrial drone mission video (`/assets/cinematic-drone/living-mission-industrial-v5.mp4` + `.webp` poster fallback), subtle HUD framing, and high-contrast typography.
- **Service Explorer**: Asymmetric light editorial gallery (`#ffffff` on `#f6f8fc`) showcasing the 4 verified monitoring services with cross-fading aerial photography (`industrial-port.webp`, `bridge-inspection.webp`, `highland-overview.webp`, `construction-1280.webp`).
- **Operational Pillars & Workflow**: Clean alternating dark/light spatial cadence (`#0b1526` ↔ `#f6f8fc`) with scroll-linked progress line and reticle-framed aerial preview (`wind-farm.webp`).
- **AI Consultant Spotlight**: Dedicated section featuring the real `/assets/ai/ondemand-ai-mascot.webp` (`AIAnimatedMascot`) explaining verified AI capabilities without duplicating floating chatbots.

## 3. Asset Provenance
- `/images/logo-new.png`: Project brand mark.
- `/assets/cinematic-drone/living-mission-industrial-v5.mp4` & `-mobile-industrial-v5.mp4` + `-poster.webp`: Project-owned cinematic drone footage.
- `/assets/ai/ondemand-ai-mascot.webp`: Project-owned AI consultant mascot.
- `/images/landing/*.webp`: Verified project assets documented in `public/images/landing/credits.json`.
- **Three.js decision**: Intentionally omitted on the landing page because the project's pre-rendered cinematic industrial drone video + `.webp` poster delivers higher visual realism, instant LCP, zero WebGL failure modes, and smooth 60 FPS on mobile/low-power devices.
