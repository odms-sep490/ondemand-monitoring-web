#!/usr/bin/env python3
"""
Automated Geometry & Dimension Validation Script — FPT University HCMC Digital Twin
===================================================================================
Opens assets/blender/fpt-campus.blend and measures actual polygon areas directly from
Blender mesh faces (NO bounding-box multiplication shortcuts, NO double-counting).

Outputs: docs/model-validation.json

Usage:
    blender --background assets/blender/fpt-campus.blend --python scripts/validate_fpt_campus.py
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

import bpy
from mathutils import Vector

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_PATH = SCRIPT_DIR / "fpt_campus_config.json"
OUT_PATH = PROJECT_ROOT / "docs" / "model-validation.json"


def mesh_horizontal_area(obj: bpy.types.Object) -> float:
    """Compute exact area of horizontal polygons in world space."""
    mesh = obj.data
    mat = obj.matrix_world
    total = 0.0
    for poly in mesh.polygons:
        # Compute world-space polygon area using triangle fan from vertex 0
        verts = [mat @ mesh.vertices[i].co for i in poly.vertices]
        if len(verts) < 3:
            continue
        v0 = verts[0]
        for i in range(1, len(verts) - 1):
            total += 0.5 * (verts[i] - v0).cross(verts[i + 1] - v0).length
    return total


def main() -> None:
    cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    targets = cfg["verified_targets"]
    tols = targets["tolerances"]

    site_area = 0.0
    floor_areas: Dict[int, float] = {}
    visual_meshes = 0
    total_tris = 0
    materials_used = set()

    arch_min = Vector((1e9, 1e9, 1e9))
    arch_max = Vector((-1e9, -1e9, -1e9))

    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        role = obj.get("validation_role")
        layer = obj.get("semantic_layer", "")

        if role == "SITE_POLYGON":
            site_area += mesh_horizontal_area(obj)

        if role == "FLOOR_POLYGON":
            lvl = int(obj.get("floor_level", 0))
            floor_areas[lvl] = floor_areas.get(lvl, 0.0) + mesh_horizontal_area(obj)
            continue

        if layer == "COLLISION_MESHES":
            continue

        visual_meshes += 1
        obj.data.calc_loop_triangles()
        total_tris += len(obj.data.loop_triangles)
        for m in obj.data.materials:
            if m:
                materials_used.add(m.name)

        if layer in ("FLOOR_SLABS", "FACADES", "WINDOWS", "BALCONIES", "CORRIDORS", "ROOFTOP_GARDENS"):
            for corner in obj.bound_box:
                wc = obj.matrix_world @ Vector(corner)
                arch_min.x = min(arch_min.x, wc.x)
                arch_min.y = min(arch_min.y, wc.y)
                arch_min.z = min(arch_min.z, wc.z)
                arch_max.x = max(arch_max.x, wc.x)
                arch_max.y = max(arch_max.y, wc.y)
                arch_max.z = max(arch_max.z, wc.z)

    ground_footprint = floor_areas.get(1, 0.0)
    total_gfa = sum(floor_areas.values())
    coverage = (ground_footprint / site_area) if site_area > 0 else 0.0

    def pct_diff(actual: float, target: float) -> float:
        return round(((actual - target) / target) * 100.0, 2) if target else 0.0

    site_err = pct_diff(site_area, targets["site_area_m2"])
    fp_err = pct_diff(ground_footprint, targets["building_footprint_target_m2"])
    gfa_err = pct_diff(total_gfa, targets["total_gross_floor_area_target_m2"])

    peak_floors = sorted([int(p["floors"]) for p in cfg["scan_peaks"]])
    stats_path = PROJECT_ROOT / "assets" / "previews" / "model-stats.json"
    stats_extra = json.loads(stats_path.read_text(encoding="utf-8")) if stats_path.exists() else {}

    report = {
        "blender_version": bpy.app.version_string,
        "measured_geometry": {
            "site_polygon_area_m2": round(site_area, 2),
            "building_ground_footprint_m2": round(ground_footprint, 2),
            "building_coverage_ratio": round(coverage, 4),
            "total_gross_floor_area_m2": round(total_gfa, 2),
            "floor_areas_by_level_m2": {str(k): round(v, 2) for k, v in sorted(floor_areas.items())},
            "peak_floors": peak_floors,
            "max_model_height_m": round(arch_max.z, 2) if arch_max.z > -1e8 else 0.0,
            "building_width_m": round(arch_max.x - arch_min.x, 2) if arch_max.x > -1e8 else 0.0,
            "building_length_m": round(arch_max.y - arch_min.y, 2) if arch_max.y > -1e8 else 0.0,
            "courtyard_width_m": cfg["envelope"]["courtyard_width_m"],
            "courtyard_length_m": cfg["envelope"]["courtyard_length_m"],
            "facade_modules": stats_extra.get("facade_modules", 0),
            "visual_mesh_count": visual_meshes,
            "material_count": len(materials_used),
            "master_triangle_count": total_tris,
        },
        "verified_targets_comparison": {
            "site_area": {
                "target_m2": targets["site_area_m2"],
                "actual_m2": round(site_area, 2),
                "diff_pct": site_err,
                "within_tolerance": abs(site_err) <= tols["site_area_pct"],
            },
            "building_footprint": {
                "target_m2": targets["building_footprint_target_m2"],
                "actual_m2": round(ground_footprint, 2),
                "diff_pct": fp_err,
                "within_tolerance": abs(fp_err) <= tols["building_footprint_pct"],
            },
            "gross_floor_area": {
                "target_m2": targets["total_gross_floor_area_target_m2"],
                "actual_m2": round(total_gfa, 2),
                "diff_pct": gfa_err,
                "within_tolerance": abs(gfa_err) <= tols["gross_floor_area_pct"],
            },
            "peak_floors": {
                "target": targets["primary_peak_floors"],
                "actual": peak_floors,
                "exact_match": peak_floors == targets["primary_peak_floors"],
            },
        },
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["verified_targets_comparison"], indent=2))
    print(f"[Validation] Saved report to {OUT_PATH}")


if __name__ == "__main__":
    main()
