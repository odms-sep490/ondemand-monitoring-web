# Blender Procedural Generation Guide — FPT University HCMC

## Script Location
- Generator script: `scripts/generate_fpt_campus.py`
- Editable Blender source output: `assets/blender/fpt-campus.blend`
- Web GLB outputs:
  - `public/models/fpt-campus.glb` (HIGH / MEDIUM desktop & laptop)
  - `public/models/fpt-campus-low.glb` (LOW / mobile)
- Architectural preview renders:
  - `assets/previews/aerial-view.png`
  - `assets/previews/courtyard-view.png`
  - `assets/previews/facade-view.png`
  - `assets/previews/model-stats.json`

## Running Generation
### PowerShell (Windows)
```powershell
cd ondemand-monitoring-web
$env:BLENDER_PATH = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
& $env:BLENDER_PATH --background --python scripts/generate_fpt_campus.py
```

### Standard CLI (when `blender` is on `PATH`)
```bash
blender --background --python scripts/generate_fpt_campus.py
```

### Optional Environment Flags
- `FPT_SKIP_RENDERS=1`: Skip EEVEE preview PNG rendering for faster iteration.
- `FPT_RENDER_SAMPLES=16`: Override preview render sample count.

## Blender Collection Hierarchy
```text
FPT_CAMPUS
├── TERRAIN
├── ARCHITECTURE
│   ├── FLOOR_SLABS
│   ├── FACADES
│   ├── WINDOWS
│   ├── BALCONIES
│   ├── CORRIDORS
│   └── ROOFTOP_GARDENS
├── VEGETATION
├── COURTYARD
├── PATHWAYS
├── WATER_FEATURES
├── SIGNAGE
├── COLLISION_MESHES   (hidden in viewport/render, simplified peak hulls)
└── SCAN_TARGETS       (3 named Empty markers: NW 11F, NE 8F, SW 6F)
```

## Optimization Design
- Geometry is batched per `(semantic_layer, material_role)` via `bmesh` before flushing to Blender mesh objects, reducing draw calls from thousands of instances to ~25 merged meshes while preserving full collection organization.
- Deterministic `random.Random(20260417)` ensures reproducible vegetation placement across runs.
- Metric scale (`1.0 BU = 1.0 m`) and `+Y up` glTF export preserve exact orientation and ground alignment (`Y = 0`) in Three.js.
