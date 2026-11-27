# Material Palette — FPT University HCMC Digital Twin V4

All sRGB hex values are converted to linear RGB inside `scripts/generate_fpt_campus.py` (`srgb_hex_to_linear_rgba`) for Blender `Principled BSDF` inputs, and exported cleanly to glTF 2.0 so Three.js (`THREE.SRGBColorSpace` + `ACESFilmicToneMapping`) avoids double gamma conversion.

| Material Name | Role | sRGB Hex | Metallic | Roughness | Notes |
| --- | --- | --- | ---: | ---: | --- |
| `MAT_CONCRETE_WARM_WHITE` | Primary floor slabs, parapets, walls | `#F0EEE6` | 0.0 | 0.82 | Warm architectural concrete (replaced V1 cold gray) |
| `MAT_CONCRETE_LIGHT` | Structural columns, planters, curbs | `#D3D0C8` | 0.0 | 0.84 | Secondary structural concrete |
| `MAT_FPT_ORANGE_PRIMARY` | Entrance canopy fascia, signage, peak fins | `#F37021` | 0.0 | 0.55 | Signature FPT brand orange |
| `MAT_FPT_ORANGE_SECONDARY` | Facade accent piers & courtyard spandrels | `#E87524` | 0.0 | 0.58 | Visible from aerial, facade & courtyard views |
| `MAT_WINDOW_GLASS_NEUTRAL` | Recessed classroom glazing | `#68777B` | 0.0 | 0.22 | Neutral gray-green tint (replaced V1 saturated blue) |
| `MAT_WINDOW_FRAME` | Window mullions & frames | `#474B49` | 0.60 | 0.45 | Dark anodized charcoal aluminum |
| `MAT_METAL_RAILING` | Courtyard corridor handrails | `#646864` | 0.65 | 0.45 | Brushed architectural steel |
| `MAT_TERRACE_GRASS` | Courtyard lawn & rooftop gardens | `#76974E` | 0.0 | 0.90 | Natural tropical grass (no plastic neon green) |
| `MAT_FOLIAGE_DARK` / `MEDIUM` / `LIGHT` | Layered multi-branch canopies | `#426638` / `#52763C` / `#7E9A4E` | 0.0 | 0.78–0.82 | Smooth-shaded organic canopy variation |
| `MAT_TERRACE_SOIL` | Planter box soil | `#88705A` | 0.0 | 0.96 | Natural earth substrate |
| `MAT_COURTYARD_TERRACOTTA` | Courtyard student plaza | `#BC6243` | 0.0 | 0.84 | Warm terracotta paving |
| `MAT_COURTYARD_OCHRE` | Courtyard plaza accent | `#D6B365` | 0.0 | 0.84 | Warm ochre-yellow paving |
| `MAT_COURTYARD_CONCRETE` | Curved walkways & entrance apron | `#BDB8AE` | 0.0 | 0.86 | Neutral pedestrian stone |
| `MAT_POND_WATER` | Courtyard reflection/lotus pond | `#4E7468` | 0.04 | 0.22 | Natural emerald-teal water |
