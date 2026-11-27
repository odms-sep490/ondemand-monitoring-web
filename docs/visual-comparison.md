# Concept-Target Visual Gate & Iterative Comparison Ledger

Following the installed `concept-target-visual-gate` and `blender-staged-scene-construction` skills, every refinement pass was rendered in Blender background mode, opened and visually inspected, and recorded honestly without fabricated similarity percentages.

## Installed Blender Agent Skills
- `.agents/skills/concept-target-visual-gate/SKILL.md` (MIT, from `oh-ashen-one/blender-agent-skills`) — used for gated `silhouette → proportion → composition → color → material → lighting` critique passes.
- `.agents/skills/blender-staged-scene-construction/SKILL.md` (MIT, from `oh-ashen-one/blender-agent-skills`) — used for `bmesh` batching (zero `bpy.ops` hot loops), scene provenance properties, background rendering, and automated validation reporting.
- Existing Blender MCP addon on user's workstation was preserved untouched (no conflicting MCP servers installed).

## Refinement Passes

### V1 (Baseline) — Rejected
- **Observed defects**: 8×8m stacked cube modules looked like residential apartment boxes; saturated blue glass dominated facades; low-poly spherical trees; gray studio background; peak heights were 6/8/11 instead of 6/9/11.

### V2 / Pass 1 — Rejected by Visual Gate
- **Improvements**: Replaced cube grid with continuous floor-by-floor architectural wings (`116×112m`), spacious `78×74m` courtyard, exact `22,500 m²` site & `6,764 m²` footprint, 6/9/11 peaks.
- **5 Largest Discrepancies Caught by Visual Inspection**:
  1. Tree branches had inverted Euler rotation (pointed downward like spider legs) + flat-shaded faceted canopies.
  2. South entrance canopy column at `x = +4.5m` directly obstructed the letter `"I"` in `FPT UNIVERSITY`.
  3. Rooftop terraces used alternating 4m pavement/grass tiles, creating a checkerboard pattern.
  4. Tropical sky + sun exposure (`-0.15`) was ~2 stops overexposed, blowing out sky & washing out concrete/pond.
  5. GFA measured `31,831 m²` (`+6.37%` vs `29,926 m²`, outside ±5% tolerance).

### V3 / Pass 2 — Geometry & Exposure Verified
- **Fixes applied**: Upward-forking `add_cylinder_between()` tree branches + smooth-shaded canopies; moved `FPT UNIVERSITY` monument forward and widened canopy span (`±8.5m`); removed roof checkerboard; lowered exposure to `-1.25` with balanced Nishita/Multiple-Scattering sky; tuned Floors 3–6 setbacks to hit **GFA = `29,980 m²` (`+0.18%`)** — all 4 verified targets PASSED.

### V4 / Pass 3 — FPT Orange Identity, Organic Courtyard & Full 9-View Render Set
- **Fixes applied**:
  - Added `MAT_FPT_ORANGE_PRIMARY` (`#F37021`) and `MAT_FPT_ORANGE_SECONDARY` (`#E87524`) across exterior vertical accent piers, peak corner fins, recessed courtyard spandrels, entrance canopy fascia, and 3D signage so FPT's warm-white & orange identity is unmistakably visible from aerial, courtyard, and facade angles.
  - Replaced symmetrical 8-spoke courtyard paths with an asymmetric curved promenade, offset terracotta/ochre gathering plaza, lotus pond, and mature shade groves.
  - Rendered all 9 views (`aerial`, `courtyard`, `facade`, `entrance`, `top`, `front-elevation`, `rear-elevation`, `left-elevation`, `right-elevation`) at 1920×1080.
  - Adjusted Three.js `Interactive3DDroneStage.tsx` default camera framing (`span * 0.86`) so the full campus fits comfortably in the viewport with neutral tropical daylight lighting matching Blender.

## Remaining Discrepancies & Honest Limitations
- Procedural multi-branch trees and smooth-shaded layered crowns are optimized for real-time WebGL (~100–165k total triangles across the entire 156m campus) rather than botanical hero-asset leaf cards.
- Without surveyed CAD/BIM drawings, exact interior classroom partitions, curved glass curtain-wall sub-mullions, and non-orthogonal site road boundaries remain architectural approximations.
- Reference comparison relied on published VTN/FPT/Ashui architectural descriptions and search summaries; external gallery images behind third-party web pages were not scraped.
