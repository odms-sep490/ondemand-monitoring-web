#!/usr/bin/env python3
"""
Procedural 3D Architectural Reconstruction V2 — FPT University Ho Chi Minh City
===============================================================================
Reference-driven reconstruction of FPT University HCMC (VTN Architects):
- Verified targets: 22,500 m2 site, ~6,750 m2 ground footprint (~30% coverage),
  ~29,926 m2 GFA, 3 asymmetric peaks (6, 9, 11 floors -> 22.5m, 33.3m, 40.5m).
- Continuous horizontal white-concrete academic wings (NOT stacked apartment cubes),
  deep recessed neutral-gray classroom windows, solid concrete piers, shaded courtyard
  corridors, selective FPT orange accents, spacious central green courtyard with
  terracotta/ochre paths & reflection pond, multi-branch tropical trees & palms,
  and photorealistic Nishita tropical daylight + AgX color management.

Usage:
    blender --background --python scripts/generate_fpt_campus.py
"""

from __future__ import annotations

import json
import math
import os
import random
from pathlib import Path
from typing import Dict, List, Tuple

import bpy
import bmesh
from mathutils import Euler, Matrix, Vector

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_PATH = SCRIPT_DIR / "fpt_campus_config.json"
BLEND_OUT = PROJECT_ROOT / "assets" / "blender" / "fpt-campus.blend"
PREVIEW_DIR = PROJECT_ROOT / "assets" / "previews"
GLB_HIGH_OUT = PROJECT_ROOT / "public" / "models" / "fpt-campus.glb"
GLB_LOW_OUT = PROJECT_ROOT / "public" / "models" / "fpt-campus-low.glb"


def load_config() -> dict:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


# ---------------------------------------------------------------------------
# Color & Scene Utilities
# ---------------------------------------------------------------------------
def srgb_hex_to_linear_rgba(hex_str: str, alpha: float = 1.0) -> Tuple[float, float, float, float]:
    h = hex_str.lstrip("#")
    r = int(h[0:2], 16) / 255.0
    g = int(h[2:4], 16) / 255.0
    b = int(h[4:6], 16) / 255.0

    def to_lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (to_lin(r), to_lin(g), to_lin(b), alpha)


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def ensure_collection(name: str, parent: bpy.types.Collection | None = None) -> bpy.types.Collection:
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        if parent is None:
            bpy.context.scene.collection.children.link(col)
        else:
            parent.children.link(col)
    return col


def setup_collections() -> Dict[str, bpy.types.Collection]:
    root = ensure_collection("FPT_CAMPUS")
    arch = ensure_collection("ARCHITECTURE", root)
    return {
        "FPT_CAMPUS": root,
        "TERRAIN": ensure_collection("TERRAIN", root),
        "ARCHITECTURE": arch,
        "FLOOR_SLABS": ensure_collection("FLOOR_SLABS", arch),
        "FACADES": ensure_collection("FACADES", arch),
        "WINDOWS": ensure_collection("WINDOWS", arch),
        "BALCONIES": ensure_collection("BALCONIES", arch),
        "CORRIDORS": ensure_collection("CORRIDORS", arch),
        "ROOFTOP_GARDENS": ensure_collection("ROOFTOP_GARDENS", arch),
        "VEGETATION": ensure_collection("VEGETATION", root),
        "COURTYARD": ensure_collection("COURTYARD", root),
        "PATHWAYS": ensure_collection("PATHWAYS", root),
        "WATER_FEATURES": ensure_collection("WATER_FEATURES", root),
        "SIGNAGE": ensure_collection("SIGNAGE", root),
        "COLLISION_MESHES": ensure_collection("COLLISION_MESHES", root),
        "SCAN_TARGETS": ensure_collection("SCAN_TARGETS", root),
    }


# ---------------------------------------------------------------------------
# Reference-Matched PBR Material Library (neutral white concrete, subtle orange,
# neutral gray-green glass, natural tropical foliage)
# ---------------------------------------------------------------------------
def make_material(
    name: str,
    hex_color: str,
    roughness: float,
    metallic: float = 0.0,
    alpha: float = 1.0,
    ior: float = 1.45,
    subtle_noise: bool = False,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name=name)
    if not mat.use_nodes:
        mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")

    base_rgba = srgb_hex_to_linear_rgba(hex_color, 1.0)
    bsdf.inputs["Base Color"].default_value = base_rgba
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = ior
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
    if alpha < 0.99 and hasattr(mat, "blend_method"):
        mat.blend_method = "BLEND"

    # Subtle procedural concrete surface variation for offline Blender renders
    # (glTF exporter cleanly falls back to Base Color when unconnected or uses scalar)
    if subtle_noise:
        tex_coord = nt.nodes.new("ShaderNodeTexCoord")
        noise = nt.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 0.35
        noise.inputs["Detail"].default_value = 4.0
        bump = nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.04
        bump.inputs["Distance"].default_value = 0.02
        nt.links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])
        nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    return mat


def create_materials(cfg: dict, web_mode: bool = False) -> Dict[str, bpy.types.Material]:
    p = cfg["palette_srgb"]
    noise_on = not web_mode
    return {
        "concrete_white": make_material("MAT_CONCRETE_WARM_WHITE", p["concrete_white"], roughness=0.82, metallic=0.0, subtle_noise=noise_on),
        "concrete_off_white": make_material("MAT_CONCRETE_WARM_WHITE_ALT", p["concrete_off_white"], roughness=0.80, metallic=0.0, subtle_noise=noise_on),
        "concrete_light_gray": make_material("MAT_CONCRETE_LIGHT", p["concrete_light_gray"], roughness=0.84, metallic=0.0, subtle_noise=noise_on),
        "concrete_weathered": make_material("MAT_CONCRETE_WEATHERED", p["concrete_weathered"], roughness=0.86, metallic=0.0, subtle_noise=noise_on),
        "fpt_orange": make_material("MAT_FPT_ORANGE_PRIMARY", p["fpt_orange"], roughness=0.55, metallic=0.0),
        "orange_accent": make_material("MAT_FPT_ORANGE_SECONDARY", p["orange_facade_accent"], roughness=0.58, metallic=0.0),
        "corridor_shade": make_material("MAT_CORRIDOR_SHADE", p["corridor_shade"], roughness=0.88, metallic=0.0),
        "glass_neutral": make_material("MAT_WINDOW_GLASS_NEUTRAL", p["glass_neutral"], roughness=0.22, metallic=0.0, ior=1.45),
        "window_frame": make_material("MAT_WINDOW_FRAME", p["window_frame"], roughness=0.45, metallic=0.60),
        "metal_railing": make_material("MAT_METAL_RAILING", p["metal_railing"], roughness=0.45, metallic=0.65),
        "grass_green": make_material("MAT_TERRACE_GRASS", p["grass_green"], roughness=0.90, metallic=0.0),
        "foliage_dark": make_material("MAT_FOLIAGE_DARK", p["foliage_dark"], roughness=0.82, metallic=0.0),
        "foliage_medium": make_material("MAT_FOLIAGE_MEDIUM", p["foliage_medium"], roughness=0.80, metallic=0.0),
        "foliage_light": make_material("MAT_FOLIAGE_LIGHT", p["foliage_light"], roughness=0.78, metallic=0.0),
        "soil": make_material("MAT_TERRACE_SOIL", p["soil"], roughness=0.96, metallic=0.0),
        "terracotta": make_material("MAT_COURTYARD_TERRACOTTA", p["courtyard_terracotta"], roughness=0.84, metallic=0.0),
        "ochre": make_material("MAT_COURTYARD_OCHRE", p["courtyard_ochre"], roughness=0.84, metallic=0.0),
        "pavement": make_material("MAT_COURTYARD_CONCRETE", p["pavement"], roughness=0.86, metallic=0.0),
        "asphalt": make_material("MAT_ASPHALT", p["asphalt"], roughness=0.90, metallic=0.0),
        "pond_water": make_material("MAT_POND_WATER", p["pond_water"], roughness=0.22, metallic=0.04, ior=1.333),
        "trunk": make_material("MAT_TRUNK_BARK", p["trunk_bark"], roughness=0.92, metallic=0.0),
        "wood_bench": make_material("MAT_WOOD_BENCH", p["wood_bench"], roughness=0.72, metallic=0.0),
        "collision": make_material("MAT_COLLISION_HULL", "#68777B", roughness=0.9, metallic=0.0, alpha=0.12),
    }


# ---------------------------------------------------------------------------
# Fast BMesh Geometry Batcher
# ---------------------------------------------------------------------------
class MeshBatcher:
    def __init__(self) -> None:
        self.batches: Dict[Tuple[str, str], bmesh.types.BMesh] = {}

    def _bm(self, layer: str, mat_key: str) -> bmesh.types.BMesh:
        key = (layer, mat_key)
        bm = self.batches.get(key)
        if bm is None:
            bm = bmesh.new()
            self.batches[key] = bm
        return bm

    def add_box(
        self,
        layer: str,
        mat_key: str,
        center: Tuple[float, float, float],
        size: Tuple[float, float, float],
        rot_z: float = 0.0,
    ) -> None:
        bm = self._bm(layer, mat_key)
        mat = (
            Matrix.Translation(Vector(center))
            @ Matrix.Rotation(rot_z, 4, "Z")
            @ Matrix.Diagonal((size[0], size[1], size[2], 1.0))
        )
        bmesh.ops.create_cube(bm, size=1.0, matrix=mat)

    def add_cylinder(
        self,
        layer: str,
        mat_key: str,
        center: Tuple[float, float, float],
        r1: float,
        r2: float,
        depth: float,
        segments: int = 8,
        rot_euler: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    ) -> None:
        bm = self._bm(layer, mat_key)
        mat = Matrix.Translation(Vector(center)) @ Euler(rot_euler, "XYZ").to_matrix().to_4x4()
        bmesh.ops.create_cone(
            bm,
            cap_ends=True,
            cap_tris=False,
            segments=segments,
            radius1=r1,
            radius2=r2,
            depth=depth,
            matrix=mat,
        )

    def add_icosphere(
        self,
        layer: str,
        mat_key: str,
        center: Tuple[float, float, float],
        radius: float,
        subdivisions: int = 1,
        scale: Tuple[float, float, float] = (1.0, 1.0, 1.0),
        rot_euler: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    ) -> None:
        bm = self._bm(layer, mat_key)
        mat = (
            Matrix.Translation(Vector(center))
            @ Euler(rot_euler, "XYZ").to_matrix().to_4x4()
            @ Matrix.Diagonal((scale[0], scale[1], scale[2], 1.0))
        )
        bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=radius, matrix=mat)

    def add_cylinder_between(
        self,
        layer: str,
        mat_key: str,
        p0: Vector,
        p1: Vector,
        r1: float,
        r2: float,
        segments: int = 6,
    ) -> None:
        vec = p1 - p0
        length = vec.length
        if length < 1e-4:
            return
        mid = (p0 + p1) * 0.5
        rot = vec.to_track_quat("Z", "Y").to_matrix().to_4x4()
        bm = self._bm(layer, mat_key)
        bmesh.ops.create_cone(
            bm,
            cap_ends=True,
            cap_tris=False,
            segments=segments,
            radius1=r1,
            radius2=r2,
            depth=length,
            matrix=Matrix.Translation(mid) @ rot,
        )

    def flush(
        self,
        collections: Dict[str, bpy.types.Collection],
        materials: Dict[str, bpy.types.Material],
    ) -> List[bpy.types.Object]:
        created: List[bpy.types.Object] = []
        for (layer, mat_key), bm in self.batches.items():
            if len(bm.verts) == 0:
                bm.free()
                continue
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            name = f"FPT_{layer}_{mat_key}"
            mesh = bpy.data.meshes.new(name)
            bm.to_mesh(mesh)
            bm.free()
            # Smooth shade organic foliage & trunks so trees never look like faceted disco balls
            if layer == "VEGETATION":
                mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
            mesh.uv_layers.new(name="UVMap")
            if mat_key in materials:
                mesh.materials.append(materials[mat_key])
            obj = bpy.data.objects.new(name, mesh)
            obj["semantic_layer"] = layer
            obj["material_role"] = mat_key
            collections.get(layer, collections["FPT_CAMPUS"]).objects.link(obj)
            created.append(obj)
        self.batches.clear()
        return created


# ---------------------------------------------------------------------------
# Floor Elevation & Polygon Overlap Helpers
# ---------------------------------------------------------------------------
def floor_z_bounds(cfg: dict, level: int) -> Tuple[float, float]:
    """Return (z_bottom, floor_height) for 1-based floor level."""
    v = cfg["vertical"]
    g_h = v["ground_floor_height_m"]
    t_h = v["typical_floor_height_m"]
    if level == 1:
        return (0.0, g_h)
    return (g_h + (level - 2) * t_h, t_h)


def point_in_floor_rects(x: float, y: float, rects: List[dict], eps: float = 0.05) -> bool:
    for r in rects:
        if r["x0"] - eps <= x <= r["x1"] + eps and r["y0"] - eps <= y <= r["y1"] + eps:
            return True
    return False


# ---------------------------------------------------------------------------
# Realistic Tropical Vegetation (Multi-Branch Shade Trees, Curved Palms, Shrubs)
# ---------------------------------------------------------------------------
def add_realistic_shade_tree(
    batcher: MeshBatcher,
    x: float,
    y: float,
    z_base: float,
    rng: random.Random,
    height: float,
    detail_high: bool,
) -> None:
    """Multi-branch tropical shade tree with upward-forking limbs and organic layered canopy."""
    trunk_h = height * 0.42
    r_base = max(0.09, height * 0.032)
    r_top = max(0.05, r_base * 0.58)
    p_base = Vector((x, y, z_base))
    p_fork = Vector((x + rng.uniform(-0.18, 0.18), y + rng.uniform(-0.18, 0.18), z_base + trunk_h))
    segs = 7 if detail_high else 5

    # Grounded tapered trunk
    batcher.add_cylinder_between("VEGETATION", "trunk", p_base, p_fork, r_base, r_top, segments=segs)

    branch_count = 4 if detail_high else 3
    canopy_r = height * 0.30

    # Upward-reaching primary branches + lush overlapping foliage clusters
    for i in range(branch_count):
        ang = (i / branch_count) * math.tau + rng.uniform(-0.35, 0.35)
        spread = canopy_r * rng.uniform(0.55, 0.88)
        rise = height * rng.uniform(0.24, 0.38)
        p_tip = Vector((p_fork.x + math.cos(ang) * spread, p_fork.y + math.sin(ang) * spread, p_fork.z + rise))
        if detail_high:
            batcher.add_cylinder_between("VEGETATION", "trunk", p_fork, p_tip, r_top * 0.72, r_top * 0.32, segments=5)
        fol_mat = rng.choice(["foliage_dark", "foliage_medium", "foliage_light"])
        batcher.add_icosphere(
            "VEGETATION",
            fol_mat,
            (p_tip.x, p_tip.y, p_tip.z + canopy_r * 0.12),
            canopy_r * rng.uniform(0.60, 0.85),
            subdivisions=2 if detail_high else 1,
            scale=(rng.uniform(0.95, 1.25), rng.uniform(0.9, 1.2), rng.uniform(0.62, 0.80)),
            rot_euler=(rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2), rng.uniform(0, math.tau)),
        )

    # Central upper canopy dome unifying the silhouette
    batcher.add_icosphere(
        "VEGETATION",
        "foliage_light",
        (p_fork.x + rng.uniform(-0.25, 0.25), p_fork.y + rng.uniform(-0.25, 0.25), p_fork.z + height * 0.42),
        canopy_r * 0.80,
        subdivisions=2 if detail_high else 1,
        scale=(1.12, 1.05, 0.65),
    )


def add_tropical_palm(
    batcher: MeshBatcher,
    x: float,
    y: float,
    z_base: float,
    rng: random.Random,
    height: float,
    detail_high: bool,
) -> None:
    """Slender tropical palm (7-14m) with gently curved trunk and arched pinnate fronds."""
    segments = 4 if detail_high else 3
    seg_h = height / segments
    curve_ang = rng.uniform(0, math.tau)
    cx, cy = x, y
    for s in range(segments):
        tilt = 0.04 * (s + 1)
        nx = cx + math.cos(curve_ang) * seg_h * math.sin(tilt)
        ny = cy + math.sin(curve_ang) * seg_h * math.sin(tilt)
        r1 = 0.24 * (1.0 - 0.12 * s)
        r2 = 0.24 * (1.0 - 0.12 * (s + 1))
        batcher.add_cylinder(
            "VEGETATION",
            "trunk",
            ((cx + nx) * 0.5, (cy + ny) * 0.5, z_base + (s + 0.5) * seg_h),
            r1,
            r2,
            seg_h * 1.04,
            segments=6,
            rot_euler=(math.sin(curve_ang) * tilt, -math.cos(curve_ang) * tilt, 0.0),
        )
        cx, cy = nx, ny

    top_z = z_base + height
    frond_count = 10 if detail_high else 6
    for i in range(frond_count):
        ang = (i / frond_count) * math.tau + rng.uniform(-0.12, 0.12)
        f_len = rng.uniform(2.3, 3.2)
        droop = 0.22 if i % 2 == 0 else 0.42
        fx = cx + math.cos(ang) * f_len * 0.48
        fy = cy + math.sin(ang) * f_len * 0.48
        fz = top_z - f_len * droop * 0.28
        mat = "foliage_medium" if i % 2 == 0 else "foliage_light"
        batcher.add_box("VEGETATION", mat, (fx, fy, fz), (f_len, 0.46, 0.10), rot_z=ang)


def add_planter_shrub(
    batcher: MeshBatcher,
    x: float,
    y: float,
    z_base: float,
    rng: random.Random,
    radius: float = 0.55,
) -> None:
    fol_mat = rng.choice(["foliage_dark", "foliage_medium", "foliage_light"])
    batcher.add_icosphere(
        "VEGETATION",
        fol_mat,
        (x, y, z_base + radius * 0.55),
        radius,
        subdivisions=1,
        scale=(rng.uniform(1.0, 1.4), rng.uniform(0.9, 1.3), rng.uniform(0.55, 0.78)),
        rot_euler=(0.0, 0.0, rng.uniform(0, math.tau)),
    )


# ---------------------------------------------------------------------------
# Site & Terrain (Exact 22,500 m2 site parcel)
# ---------------------------------------------------------------------------
def create_campus_terrain(cfg: dict, batcher: MeshBatcher, collections: Dict[str, bpy.types.Collection], materials: Dict[str, bpy.types.Material]) -> None:
    sw = cfg["site"]["width_m"]
    sl = cfg["site"]["length_m"]

    # Dedicated clean site polygon object for exact area validation
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5, matrix=Matrix.Diagonal((sw, sl, 1.0, 1.0)))
    mesh = bpy.data.meshes.new("FPT_SITE_BOUNDARY_MESH")
    bm.to_mesh(mesh)
    bm.free()
    mesh.uv_layers.new(name="UVMap")
    mesh.materials.append(materials["grass_green"])
    site_obj = bpy.data.objects.new("FPT_SITE_BOUNDARY", mesh)
    site_obj["semantic_layer"] = "TERRAIN"
    site_obj["validation_role"] = "SITE_POLYGON"
    collections["TERRAIN"].objects.link(site_obj)

    # Architectural plinth edge beneath site
    batcher.add_box("TERRAIN", "concrete_weathered", (0.0, 0.0, -0.65), (sw + 2.0, sl + 2.0, 1.25))
    # South campus entrance road & drop-off boulevard
    batcher.add_box("TERRAIN", "asphalt", (0.0, -sl / 2.0 + 5.5, 0.02), (sw - 2.0, 9.5, 0.04))
    batcher.add_box("PATHWAYS", "pavement", (0.0, -sl / 2.0 + 12.2, 0.04), (sw - 8.0, 4.0, 0.06))
    # Main entrance arrival plaza connecting boulevard to south gateway
    batcher.add_box("PATHWAYS", "pavement", (0.0, -sl / 2.0 + 20.5, 0.05), (36.0, 14.0, 0.07))
    batcher.add_box("PATHWAYS", "terracotta", (0.0, -sl / 2.0 + 20.5, 0.065), (12.0, 14.0, 0.05))


# ---------------------------------------------------------------------------
# Continuous Architectural Floor Slabs & Reference-Driven Facades
# ---------------------------------------------------------------------------
def build_facade_edge(
    batcher: MeshBatcher,
    x0: float,
    y0: float,
    x1: float,
    y1: float,
    z0: float,
    fh: float,
    level: int,
    normal_x: float,
    normal_y: float,
    is_courtyard_side: bool,
    cfg: dict,
    rng: random.Random,
    detail_high: bool,
) -> int:
    """Build realistic continuous concrete facade with solid piers, recessed neutral glass windows,
    shaded courtyard corridors, slender metal railings, and selective orange accents."""
    v = cfg["vertical"]
    slab_t = v["slab_thickness_m"]
    bay = v["structural_bay_m"]
    win_w = v["window_width_m"]
    win_h = min(v["window_height_m"], fh - slab_t - 0.85)
    recess = v["window_recess_m"]

    dx = x1 - x0
    dy = y1 - y0
    length = math.hypot(dx, dy)
    if length < 1.5:
        return 0
    ux, uy = dx / length, dy / length
    rot_z = math.atan2(dy, dx)
    n_bays = max(1, int(round(length / bay)))
    actual_bay = length / n_bays
    pier_w = max(0.85, actual_bay - win_w)

    wall_h = fh - slab_t
    wall_cz = z0 + slab_t + wall_h * 0.5
    sill_h = max(0.55, (wall_h - win_h) * 0.45)
    lintel_h = max(0.35, wall_h - win_h - sill_h)

    # Continuous horizontal spandrel & lintel concrete bands (strong horizontal architectural rhythm!)
    mid_x = (x0 + x1) * 0.5 - normal_x * 0.14
    mid_y = (y0 + y1) * 0.5 - normal_y * 0.14
    batcher.add_box("FACADES", "concrete_off_white", (mid_x, mid_y, z0 + slab_t + sill_h * 0.5), (length, 0.26, sill_h), rot_z=rot_z)
    batcher.add_box("FACADES", "concrete_off_white", (mid_x, mid_y, z0 + fh - lintel_h * 0.5), (length, 0.26, lintel_h), rot_z=rot_z)

    if is_courtyard_side:
        # Shaded open-air corridor backing & perimeter structural columns
        cor_x = (x0 + x1) * 0.5 - normal_x * 1.15
        cor_y = (y0 + y1) * 0.5 - normal_y * 1.15
        batcher.add_box("CORRIDORS", "corridor_shade", (cor_x, cor_y, wall_cz), (length - 0.4, 0.24, wall_h), rot_z=rot_z)
        # Concrete parapet + slender metal handrail along courtyard corridor
        rail_x = (x0 + x1) * 0.5 + normal_x * 0.08
        rail_y = (y0 + y1) * 0.5 + normal_y * 0.08
        batcher.add_box("CORRIDORS", "concrete_white", (rail_x, rail_y, z0 + slab_t + 0.48), (length, 0.18, 0.96), rot_z=rot_z)
        batcher.add_box("CORRIDORS", "metal_railing", (rail_x, rail_y, z0 + slab_t + 1.06), (length, 0.06, 0.06), rot_z=rot_z)

    for i in range(n_bays):
        t = (i + 0.5) / n_bays
        bx = x0 + dx * t
        by = y0 + dy * t

        # Solid white concrete pier between classroom windows + signature FPT orange architectural accents
        px = x0 + dx * (i / n_bays)
        py = y0 + dy * (i / n_bays)
        pier_mat = "concrete_off_white"
        # Reference-driven FPT orange accents visible from aerial, facade, and courtyard views:
        # 1) Vertical accent fins at wing transitions & peak corners
        # 2) Warm orange recessed corridor backing panels on courtyard-facing galleries
        if not is_courtyard_side:
            if (i in (1, n_bays - 2) and level in (2, 3, 4, 6, 8, 10)) or (level in (5, 7, 9, 11) and i % 4 == 1):
                pier_mat = "fpt_orange" if level % 2 == 0 else "orange_accent"
        else:
            if i % 4 == 2 and level in (2, 3, 4, 5, 7):
                pier_mat = "orange_accent"
        batcher.add_box(
            "FACADES",
            pier_mat,
            (px - normal_x * 0.14, py - normal_y * 0.14, wall_cz),
            (pier_w * 0.84, 0.32, wall_h),
            rot_z=rot_z,
        )
        # Warm FPT orange recessed accent spandrel panel on selected academic bays
        if (i + level) % 5 == 0 and level >= 2:
            batcher.add_box(
                "FACADES",
                "orange_accent" if is_courtyard_side else "fpt_orange",
                (bx - normal_x * 0.22, by - normal_y * 0.22, z0 + slab_t + sill_h * 0.5),
                (win_w + 0.1, 0.22, sill_h * 0.85),
                rot_z=rot_z,
            )

        # Deeply recessed neutral gray-green classroom window + charcoal aluminum frame
        wx = bx - normal_x * recess
        wy = by - normal_y * recess
        wz = z0 + slab_t + sill_h + win_h * 0.5
        batcher.add_box("WINDOWS", "glass_neutral", (wx, wy, wz), (win_w, 0.08, win_h), rot_z=rot_z)
        # Top/bottom/center mullions
        fx = bx - normal_x * (recess - 0.07)
        fy = by - normal_y * (recess - 0.07)
        batcher.add_box("WINDOWS", "window_frame", (fx, fy, z0 + slab_t + sill_h + 0.04), (win_w + 0.08, 0.12, 0.08), rot_z=rot_z)
        batcher.add_box("WINDOWS", "window_frame", (fx, fy, z0 + slab_t + sill_h + win_h - 0.04), (win_w + 0.08, 0.12, 0.08), rot_z=rot_z)
        batcher.add_box("WINDOWS", "window_frame", (fx, fy, wz), (0.07, 0.12, win_h), rot_z=rot_z)

        # Selective overhanging concrete planter pockets on exterior faces (VTN signature greenery)
        if not is_courtyard_side and level >= 2 and ((i + level * 2) % 3 == 0):
            pl_x = bx + normal_x * 0.58
            pl_y = by + normal_y * 0.58
            batcher.add_box("BALCONIES", "concrete_light_gray", (pl_x, pl_y, z0 + slab_t + 0.28), (win_w + 0.5, 0.95, 0.55), rot_z=rot_z)
            batcher.add_box("BALCONIES", "soil", (pl_x, pl_y, z0 + slab_t + 0.54), (win_w + 0.2, 0.72, 0.08), rot_z=rot_z)
            if detail_high:
                add_planter_shrub(batcher, pl_x, pl_y, z0 + slab_t + 0.56, rng, radius=0.58)
                if rng.random() < 0.35:
                    add_realistic_shade_tree(batcher, pl_x, pl_y, z0 + slab_t + 0.56, rng, height=rng.uniform(1.8, 2.8), detail_high=False)

    return n_bays


def create_architecture_floors(
    cfg: dict,
    batcher: MeshBatcher,
    collections: Dict[str, bpy.types.Collection],
    materials: Dict[str, bpy.types.Material],
    rng: random.Random,
    detail_high: bool,
) -> int:
    """Create floor-by-floor continuous architectural wings, exact validation floor polygons,
    realistic facades, and stepped rooftop terrace gardens."""
    v = cfg["vertical"]
    slab_t = v["slab_thickness_m"]
    parapet_h = v["parapet_height_m"]
    floors = cfg["floors"]
    facade_modules = 0

    for idx, fl in enumerate(floors):
        level = fl["level"]
        z0, fh = floor_z_bounds(cfg, level)
        rects = fl["rects"]
        next_rects = floors[idx + 1]["rects"] if idx + 1 < len(floors) else []

        # Create clean per-floor exact horizontal polygon mesh for automated GFA validation
        bm_floor = bmesh.new()
        for r in rects:
            w = r["x1"] - r["x0"]
            d = r["y1"] - r["y0"]
            cx = (r["x0"] + r["x1"]) * 0.5
            cy = (r["y0"] + r["y1"]) * 0.5
            mat_slab = Matrix.Translation(Vector((cx, cy, z0 + slab_t))) @ Matrix.Diagonal((w, d, 1.0, 1.0))
            bmesh.ops.create_grid(bm_floor, x_segments=1, y_segments=1, size=0.5, matrix=mat_slab)

            # Continuous solid horizontal white concrete slab fascia
            batcher.add_box("FLOOR_SLABS", "concrete_white", (cx, cy, z0 + slab_t * 0.5), (w + 0.36, d + 0.36, slab_t))
            # Interior shaded structural volume (recessed behind facade piers & windows)
            batcher.add_box("FACADES", "corridor_shade", (cx, cy, z0 + slab_t + (fh - slab_t) * 0.5), (max(1.0, w - 0.9), max(1.0, d - 0.9), fh - slab_t))

            # Build exposed exterior & courtyard facades along the 4 edges of each wing
            edges = [
                (r["x0"], r["y0"], r["x1"], r["y0"], 0.0, -1.0),  # South
                (r["x1"], r["y1"], r["x0"], r["y1"], 0.0, 1.0),   # North
                (r["x0"], r["y1"], r["x0"], r["y0"], -1.0, 0.0),  # West
                (r["x1"], r["y0"], r["x1"], r["y1"], 1.0, 0.0),   # East
            ]
            for ex0, ey0, ex1, ey1, nx, ny in edges:
                # Sample midpoint just outside edge to skip internal seams between joined wings
                mx = (ex0 + ex1) * 0.5 + nx * 0.6
                my = (ey0 + ey1) * 0.5 + ny * 0.6
                if point_in_floor_rects(mx, my, rects):
                    continue
                is_courtyard = (-39.5 <= mx <= 39.5) and (-37.5 <= my <= 37.5)
                facade_modules += build_facade_edge(
                    batcher, ex0, ey0, ex1, ey1, z0, fh, level, nx, ny, is_courtyard, cfg, rng, detail_high
                )

            # Exposed stepped roof terraces (areas not covered by level + 1)
            z_roof = z0 + fh
            step_x = 4.0
            step_y = 4.0
            nx_cells = max(1, int(round(w / step_x)))
            ny_cells = max(1, int(round(d / step_y)))
            cw = w / nx_cells
            cd = d / ny_cells
            for ix in range(nx_cells):
                for iy in range(ny_cells):
                    tx = r["x0"] + (ix + 0.5) * cw
                    ty = r["y0"] + (iy + 0.5) * cd
                    if point_in_floor_rects(tx, ty, next_rects):
                        continue
                    # Continuous seamless rooftop grass garden (no checkerboard grid!)
                    batcher.add_box("ROOFTOP_GARDENS", "concrete_white", (tx, ty, z_roof + 0.14), (cw + 0.06, cd + 0.06, 0.28))
                    is_border = (ix == 0 or iy == 0)
                    if is_border and (nx_cells > 2 and ny_cells > 2):
                        batcher.add_box("ROOFTOP_GARDENS", "pavement", (tx, ty, z_roof + 0.30), (cw + 0.02, cd + 0.02, 0.06))
                    else:
                        batcher.add_box("ROOFTOP_GARDENS", "grass_green", (tx, ty, z_roof + 0.32), (cw + 0.02, cd + 0.02, 0.10))

                    # Organic terrace planting (sparse realistic distribution, NOT 1 tree per tile!)
                    roll = rng.random()
                    if roll < (0.20 if detail_high else 0.11):
                        add_realistic_shade_tree(batcher, tx + rng.uniform(-0.8, 0.8), ty + rng.uniform(-0.8, 0.8), z_roof + 0.36, rng, height=rng.uniform(2.0, 3.5), detail_high=detail_high)
                    elif roll < (0.42 if detail_high else 0.22):
                        add_planter_shrub(batcher, tx + rng.uniform(-0.9, 0.9), ty + rng.uniform(-0.9, 0.9), z_roof + 0.36, rng, radius=rng.uniform(0.45, 0.78))

            # Clean continuous perimeter parapet around roof of top-most exposed edges
            if not next_rects or not point_in_floor_rects(cx, cy, next_rects):
                for ex0, ey0, ex1, ey1, nx, ny in edges:
                    mx = (ex0 + ex1) * 0.5 + nx * 0.6
                    my = (ey0 + ey1) * 0.5 + ny * 0.6
                    if point_in_floor_rects(mx, my, rects):
                        continue
                    in_next = point_in_floor_rects((ex0 + ex1) * 0.5 - nx * 0.6, (ey0 + ey1) * 0.5 - ny * 0.6, next_rects)
                    if in_next:
                        continue
                    elen = math.hypot(ex1 - ex0, ey1 - ey0)
                    erot = math.atan2(ey1 - ey0, ex1 - ex0)
                    batcher.add_box(
                        "ROOFTOP_GARDENS",
                        "concrete_white",
                        ((ex0 + ex1) * 0.5, (ey0 + ey1) * 0.5, z_roof + parapet_h * 0.5),
                        (elen, 0.28, parapet_h),
                        rot_z=erot,
                    )

        # Save clean per-floor validation polygon object (hidden visually, exact area source)
        f_mesh = bpy.data.meshes.new(f"FPT_FLOOR_AREA_L{level:02d}_MESH")
        bm_floor.to_mesh(f_mesh)
        bm_floor.free()
        f_obj = bpy.data.objects.new(f"FPT_FLOOR_AREA_L{level:02d}", f_mesh)
        f_obj["semantic_layer"] = "FLOOR_SLABS"
        f_obj["validation_role"] = "FLOOR_POLYGON"
        f_obj["floor_level"] = level
        f_obj.hide_render = True
        f_obj.hide_viewport = True
        collections["FLOOR_SLABS"].objects.link(f_obj)

    # Grand South Main Entrance Canopy & Wide-Span Columns (clear unobstructed view of signage)
    south_y = -56.0
    batcher.add_box("FACADES", "concrete_white", (0.0, south_y - 3.6, 4.55), (28.0, 7.4, 0.48))
    batcher.add_box("FACADES", "fpt_orange", (0.0, south_y - 7.25, 4.55), (28.2, 0.28, 0.52))
    for dx in (-12.5, -8.5, 8.5, 12.5):
        batcher.add_cylinder("CORRIDORS", "concrete_light_gray", (dx, south_y - 5.8, 2.25), 0.36, 0.38, 4.5, segments=10)

    return facade_modules


# ---------------------------------------------------------------------------
# Spacious Central Courtyard (78m x 74m) — Lawns, Terracotta/Ochre Paths, Pond
# ---------------------------------------------------------------------------
def create_courtyard_and_landscape(cfg: dict, batcher: MeshBatcher, rng: random.Random, detail_high: bool) -> None:
    cw = cfg["envelope"]["courtyard_width_m"]
    cl = cfg["envelope"]["courtyard_length_m"]

    # Central sunlit green lawn
    batcher.add_box("COURTYARD", "grass_green", (0.0, 0.0, 0.04), (cw - 0.5, cl - 0.5, 0.09))

    # Asymmetric organic curved promenade & geometric campus plaza (NOT a rigid radial star)
    promenade_pts = [
        (0.0, -35.0), (-4.0, -24.0), (-9.0, -12.0), (-6.0, 2.0),
        (2.0, 12.0), (8.0, 22.0), (4.0, 33.0),
    ]
    for i in range(len(promenade_pts) - 1):
        ax, ay = promenade_pts[i]
        bx, by = promenade_pts[i + 1]
        seg_len = math.hypot(bx - ax, by - ay) + 1.4
        seg_ang = math.atan2(by - ay, bx - ax)
        batcher.add_box("PATHWAYS", "pavement", ((ax + bx) * 0.5, (ay + by) * 0.5, 0.09), (seg_len, 4.4, 0.07), rot_z=seg_ang)

    # Secondary transverse garden path linking West amphitheater to East lotus pond
    batcher.add_box("PATHWAYS", "pavement", (-6.0, -4.0, 0.088), (48.0, 3.4, 0.065), rot_z=math.radians(11))

    # Asymmetric terracotta & ochre student gathering plaza (offset Southwest-Center)
    batcher.add_box("PATHWAYS", "pavement", (-5.5, -6.0, 0.105), (24.0, 16.5, 0.06), rot_z=math.radians(-6))
    batcher.add_box("PATHWAYS", "terracotta", (-6.2, -5.5, 0.12), (16.5, 10.5, 0.05), rot_z=math.radians(-6))
    batcher.add_box("PATHWAYS", "ochre", (-3.0, -7.2, 0.13), (8.5, 5.2, 0.04), rot_z=math.radians(-6))

    # Decorative lotus/reflection pond in East-Center courtyard
    px, py = 18.5, 11.5
    batcher.add_box("WATER_FEATURES", "concrete_light_gray", (px, py, 0.16), (17.5, 11.5, 0.32))
    batcher.add_box("WATER_FEATURES", "pond_water", (px, py, 0.25), (16.2, 10.2, 0.12))
    # Timber viewing deck along pond edge
    batcher.add_box("COURTYARD", "wood_bench", (px - 7.8, py, 0.34), (2.4, 8.8, 0.12))

    # Tiered outdoor student seating on West-Center courtyard lawn
    sx, sy = -19.5, -10.5
    for step in range(3):
        batcher.add_box("COURTYARD", "concrete_white", (sx - step * 1.15, sy, 0.24 + step * 0.36), (1.15, 13.0 - step * 1.4, 0.48 + step * 0.36))
        batcher.add_box("COURTYARD", "wood_bench", (sx - step * 1.15 + 0.08, sy, 0.50 + step * 0.72), (0.65, 12.6 - step * 1.4, 0.08))

    # Courtyard benches & raised planter islands
    for bx, by in [(-11.0, 13.0), (11.0, -13.0), (-11.0, -18.0), (12.0, 22.0)]:
        batcher.add_box("COURTYARD", "wood_bench", (bx, by, 0.46), (3.0, 0.65, 0.10))
        batcher.add_box("COURTYARD", "concrete_light_gray", (bx - 1.1, by, 0.22), (0.28, 0.56, 0.44))
        batcher.add_box("COURTYARD", "concrete_light_gray", (bx + 1.1, by, 0.22), (0.28, 0.56, 0.44))

    # Mature tropical courtyard shade trees (6-12m) & curated palms (7-14m)
    courtyard_trees = [
        (-24.0, 16.0, 10.5, False), (-14.0, 22.0, 8.8, False), (6.0, 23.0, 9.6, False),
        (26.0, 21.0, 8.2, False), (27.0, -12.0, 10.2, False), (15.0, -22.0, 9.0, False),
        (-25.0, -21.0, 9.4, False), (-9.0, -24.0, 10.5, True), (9.0, -24.0, 11.2, True),
        (-27.0, 4.0, 8.4, False), (26.0, -2.0, 7.8, False),
    ]
    for tx, ty, h, is_palm in courtyard_trees:
        if is_palm:
            add_tropical_palm(batcher, tx, ty, 0.08, rng, height=h, detail_high=detail_high)
        else:
            add_realistic_shade_tree(batcher, tx, ty, 0.08, rng, height=h, detail_high=detail_high)

    # Entrance boulevard tropical palms & perimeter green belt trees
    for px_in in (-26.0, -17.0, 17.0, 26.0):
        add_tropical_palm(batcher, px_in, -62.5, 0.04, rng, height=rng.uniform(9.5, 12.5), detail_high=detail_high)

    step = 18.0 if detail_high else 28.0
    for y in range(-48, 56, int(step)):
        add_realistic_shade_tree(batcher, -69.0 + rng.uniform(-2.0, 2.0), float(y), 0.05, rng, height=rng.uniform(7.5, 11.0), detail_high=detail_high)
        add_realistic_shade_tree(batcher, 69.0 + rng.uniform(-2.0, 2.0), float(y), 0.05, rng, height=rng.uniform(7.5, 11.0), detail_high=detail_high)
    for x in range(-56, 60, int(step)):
        add_realistic_shade_tree(batcher, float(x), 64.5 + rng.uniform(-1.5, 1.5), 0.05, rng, height=rng.uniform(8.0, 11.5), detail_high=detail_high)


# ---------------------------------------------------------------------------
# Entrance Monument & FPT UNIVERSITY Signage
# ---------------------------------------------------------------------------
def create_campus_signage(
    cfg: dict,
    batcher: MeshBatcher,
    collections: Dict[str, bpy.types.Collection],
    materials: Dict[str, bpy.types.Material],
) -> None:
    sl = cfg["site"]["length_m"]
    # Position entrance monument forward on the arrival island so canopy columns never block lettering
    sign_y = -sl / 2.0 + 9.2

    batcher.add_box("SIGNAGE", "concrete_off_white", (0.0, sign_y, 1.45), (17.5, 0.95, 2.7))
    batcher.add_box("SIGNAGE", "fpt_orange", (0.0, sign_y - 0.48, 2.65), (17.6, 0.14, 0.34))
    batcher.add_box("SIGNAGE", "concrete_light_gray", (0.0, sign_y, 0.16), (19.0, 1.9, 0.32))

    font_curve = bpy.data.curves.new(name="FPT_UNIVERSITY_TextCurve", type="FONT")
    font_curve.body = "FPT UNIVERSITY"
    font_curve.size = 1.38
    font_curve.extrude = 0.10
    font_curve.align_x = "CENTER"
    font_curve.align_y = "CENTER"
    font_curve.resolution_u = 3

    text_obj = bpy.data.objects.new("FPT_UNIVERSITY_Signage", font_curve)
    text_obj.location = (0.0, sign_y - 0.54, 1.32)
    text_obj.rotation_euler = (math.pi / 2.0, 0.0, 0.0)
    collections["SIGNAGE"].objects.link(text_obj)

    bpy.context.view_layer.objects.active = text_obj
    text_obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    text_obj = bpy.context.active_object
    text_obj.data.materials.append(materials["fpt_orange"])
    text_obj["semantic_layer"] = "SIGNAGE"
    text_obj.select_set(False)


def create_collision_and_scan_targets(
    cfg: dict,
    batcher: MeshBatcher,
    collections: Dict[str, bpy.types.Collection],
) -> Dict[str, List[float]]:
    targets: Dict[str, List[float]] = {}
    for p in cfg["scan_peaks"]:
        z_bot, fh = floor_z_bounds(cfg, p["floors"])
        top_z = z_bot + fh
        batcher.add_box("COLLISION_MESHES", "collision", (p["x"], p["y"], top_z * 0.5), (22.0, 20.0, top_z))

        empty = bpy.data.objects.new(p["id"], None)
        empty.empty_display_type = "SPHERE"
        empty.empty_display_size = 2.0
        empty.location = (p["x"], p["y"], top_z + 4.0)
        empty["semantic_layer"] = "SCAN_TARGETS"
        empty["peak_floors"] = p["floors"]
        collections["SCAN_TARGETS"].objects.link(empty)
        targets[p["id"]] = [round(p["x"], 2), round(p["y"], 2), round(top_z + 4.0, 2)]
    return targets


# ---------------------------------------------------------------------------
# Photorealistic Tropical Daylight & Multi-Angle High-Res Rendering
# ---------------------------------------------------------------------------
def setup_photorealistic_lighting() -> None:
    scene = bpy.context.scene
    # AgX color management for natural architectural contrast & highlight roll-off
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        scene.view_settings.view_transform = "Filmic"
    scene.view_settings.exposure = -1.25

    # Physical Tropical Sky (balanced exposure — crisp blue sky, no washed-out white concrete)
    world = bpy.data.worlds.new("FPT_Tropical_Sky")
    scene.world = world
    if not world.use_nodes:
        world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = 0.28
    sky = nt.nodes.new("ShaderNodeTexSky")
    sky_enums = {e.identifier for e in sky.bl_rna.properties["sky_type"].enum_items}
    if "MULTIPLE_SCATTERING" in sky_enums:
        sky.sky_type = "MULTIPLE_SCATTERING"
    elif "NISHITA" in sky_enums:
        sky.sky_type = "NISHITA"
    else:
        sky.sky_type = "HOSEK_WILKIE"
    if hasattr(sky, "sun_disc"):
        sky.sun_disc = True
    if hasattr(sky, "sun_elevation"):
        sky.sun_elevation = math.radians(44.0)
    if hasattr(sky, "sun_rotation"):
        sky.sun_rotation = math.radians(38.0)
    if hasattr(sky, "air_density"):
        sky.air_density = 1.15
    if hasattr(sky, "dust_density"):
        sky.dust_density = 1.2

    # Stamp provenance metadata (blender-staged-scene-construction skill)
    scene["Reference"] = "VTN Architects FPT University HCMC (22,500m2 site, 29,926m2 GFA, 6/9/11F peaks)"
    scene["Authoring"] = "scripts/generate_fpt_campus.py + scripts/fpt_campus_config.json"
    scene["Limitations"] = "Reference-driven architectural reconstruction; not survey-grade CAD/BIM"
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])

    # Warm crisp tropical sunlight matching sky azimuth
    sun_data = bpy.data.lights.new(name="Sun_Tropical", type="SUN")
    sun_data.energy = 2.6
    sun_data.color = (1.0, 0.95, 0.88)
    sun_data.angle = math.radians(1.2)
    sun_obj = bpy.data.objects.new("Sun_Tropical", sun_data)
    sun_obj.rotation_euler = (math.radians(46.0), math.radians(12.0), math.radians(-38.0))
    scene.collection.objects.link(sun_obj)


def render_architectural_previews() -> List[str]:
    if os.getenv("FPT_SKIP_RENDERS") == "1":
        return []
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene

    available_engines = {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    if "BLENDER_EEVEE_NEXT" in available_engines:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    elif "BLENDER_EEVEE" in available_engines:
        scene.render.engine = "BLENDER_EEVEE"
    else:
        scene.render.engine = "CYCLES"

    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    if hasattr(scene, "eevee"):
        if hasattr(scene.eevee, "taa_render_samples"):
            scene.eevee.taa_render_samples = int(os.getenv("FPT_RENDER_SAMPLES", "32"))
        if hasattr(scene.eevee, "use_gtao"):
            scene.eevee.use_gtao = True

    cam_data = bpy.data.cameras.new("Arch_Camera")
    cam_data.clip_end = 1200.0
    cam_obj = bpy.data.objects.new("Arch_Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    views = [
        ("aerial-view.png", "PERSP", 38.0, Vector((126.0, -132.0, 82.0)), Vector((-2.0, 2.0, 14.0)), 180.0),
        ("courtyard-view.png", "PERSP", 35.0, Vector((22.0, -30.0, 11.0)), Vector((-12.0, 22.0, 15.0)), 180.0),
        ("facade-view.png", "PERSP", 42.0, Vector((-22.0, -122.0, 18.0)), Vector((-4.0, -10.0, 15.0)), 180.0),
        ("entrance-view.png", "PERSP", 42.0, Vector((18.0, -96.0, 8.5)), Vector((0.0, -56.0, 5.5)), 180.0),
        ("top-view.png", "ORTHO", 50.0, Vector((0.0, 0.0, 190.0)), Vector((0.0, 0.0, 0.0)), 176.0),
        ("front-elevation.png", "ORTHO", 50.0, Vector((0.0, -170.0, 22.0)), Vector((0.0, 0.0, 22.0)), 156.0),
        ("rear-elevation.png", "ORTHO", 50.0, Vector((0.0, 170.0, 22.0)), Vector((0.0, 0.0, 22.0)), 156.0),
        ("left-elevation.png", "ORTHO", 50.0, Vector((-170.0, 0.0, 22.0)), Vector((0.0, 0.0, 22.0)), 156.0),
        ("right-elevation.png", "ORTHO", 50.0, Vector((170.0, 0.0, 22.0)), Vector((0.0, 0.0, 22.0)), 156.0),
    ]

    rendered: List[str] = []
    for filename, cam_type, lens, loc, target, ortho_scale in views:
        cam_data.type = cam_type
        cam_data.lens = lens
        cam_data.ortho_scale = ortho_scale
        cam_obj.location = loc
        direction = target - loc
        if cam_type == "ORTHO" and abs(direction.x) < 1e-4 and abs(direction.y) < 1e-4:
            cam_obj.rotation_euler = (0.0, 0.0, 0.0)
        else:
            cam_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        out_path = PREVIEW_DIR / filename
        scene.render.filepath = str(out_path)
        bpy.ops.render.render(write_still=True)
        rendered.append(str(out_path))

    bpy.data.objects.remove(cam_obj, do_unlink=True)
    return rendered


def optimize_geometry() -> Tuple[int, int]:
    total_tris = 0
    mesh_count = 0
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        if obj.get("semantic_layer") == "COLLISION_MESHES":
            obj.hide_render = True
            obj.hide_viewport = True
            continue
        if obj.get("validation_role") == "FLOOR_POLYGON":
            continue
        mesh_count += 1
        obj.data.calc_loop_triangles()
        total_tris += len(obj.data.loop_triangles)
    return mesh_count, total_tris


def export_glb(out_path: Path) -> int:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        if obj.type in ("MESH", "EMPTY") and not obj.hide_viewport:
            obj.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=str(out_path),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_extras=True,
    )
    return out_path.stat().st_size if out_path.exists() else 0


def build_campus(cfg: dict, detail_high: bool, web_mode: bool) -> Tuple[Dict[str, List[float]], int, int, int]:
    clear_scene()
    cols = setup_collections()
    mats = create_materials(cfg, web_mode=web_mode)
    rng = random.Random(cfg["site"]["seed"])
    batcher = MeshBatcher()

    create_campus_terrain(cfg, batcher, cols, mats)
    facade_modules = create_architecture_floors(cfg, batcher, cols, mats, rng, detail_high=detail_high)
    create_courtyard_and_landscape(cfg, batcher, rng, detail_high=detail_high)
    create_campus_signage(cfg, batcher, cols, mats)
    targets = create_collision_and_scan_targets(cfg, batcher, cols)
    batcher.flush(cols, mats)
    setup_photorealistic_lighting()
    mesh_count, total_tris = optimize_geometry()
    return targets, mesh_count, total_tris, facade_modules


def main() -> None:
    cfg = load_config()
    print("[FPT Campus V2] Building MASTER / HIGH-detail architectural reconstruction...")
    targets, high_meshes, high_tris, facade_modules = build_campus(cfg, detail_high=True, web_mode=False)

    BLEND_OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    print(f"[FPT Campus V2] Saved master .blend: {BLEND_OUT}")

    rendered = render_architectural_previews()
    if rendered:
        print(f"[FPT Campus V2] Rendered {len(rendered)} architectural previews.")

    # Export Web HIGH GLB (clean scalar PBR for consistent Blender <-> Three.js color)
    print("[FPT Campus V2] Building WEB HIGH GLB...")
    _, wh_meshes, wh_tris, _ = build_campus(cfg, detail_high=True, web_mode=True)
    high_bytes = export_glb(GLB_HIGH_OUT)
    print(f"[FPT Campus V2] Exported WEB HIGH GLB: {GLB_HIGH_OUT} ({high_bytes / 1024 / 1024:.2f} MB, {wh_tris} tris, {wh_meshes} meshes)")

    # Export Web LOW GLB (mobile-optimized vegetation & geometry)
    print("[FPT Campus V2] Building WEB LOW GLB...")
    _, wl_meshes, wl_tris, _ = build_campus(cfg, detail_high=False, web_mode=True)
    low_bytes = export_glb(GLB_LOW_OUT)
    print(f"[FPT Campus V2] Exported WEB LOW GLB: {GLB_LOW_OUT} ({low_bytes / 1024 / 1024:.2f} MB, {wl_tris} tris, {wl_meshes} meshes)")

    stats = {
        "version": "V2",
        "blender_version": bpy.app.version_string,
        "facade_modules": facade_modules,
        "high": {
            "path": str(GLB_HIGH_OUT.relative_to(PROJECT_ROOT)),
            "bytes": high_bytes,
            "triangles": wh_tris,
            "meshes": wh_meshes,
        },
        "low": {
            "path": str(GLB_LOW_OUT.relative_to(PROJECT_ROOT)),
            "bytes": low_bytes,
            "triangles": wl_tris,
            "meshes": wl_meshes,
        },
        "blend_source": str(BLEND_OUT.relative_to(PROJECT_ROOT)),
        "previews": [str(Path(p).relative_to(PROJECT_ROOT)) for p in rendered],
        "scan_targets_blender_xyz": targets,
    }
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    (PREVIEW_DIR / "model-stats.json").write_text(json.dumps(stats, indent=2), encoding="utf-8")
    print("[FPT Campus V2] Complete.")


if __name__ == "__main__":
    main()
