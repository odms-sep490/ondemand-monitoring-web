"""Build and export the live office environment for the Manager 3D workspace.

The source scene is generated from Blender geometry, saved as an editable .blend,
and exported as a compact, Y-up GLB for Three.js. No external models are needed.
Run with Blender 5.2:
  blender -b --python tools/blender/build_office_environment.py -- --repo <repo-root>
"""

from __future__ import annotations

import argparse
from array import array
import bmesh
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Matrix, Vector


ROOM_SIZE = (3.48, 2.92)
ROOM_SCALE = 1.25
ROOMS = [
    {"id": "meeting", "x": -5.5, "z": -4.7, "yaw": 0.0, "kind": "meeting"},
    {"id": "planning", "x": 0.0, "z": -4.7, "yaw": 0.0, "kind": "planning"},
    {"id": "pantry", "x": 5.5, "z": -4.7, "yaw": 0.0, "kind": "pantry"},
    {"id": "lounge", "x": -5.5, "z": 0.0, "yaw": math.pi / 2, "kind": "lounge"},
    {"id": "dispatch", "x": 0.0, "z": 0.0, "yaw": 0.0, "kind": "dispatch"},
    {"id": "inspection", "x": 5.5, "z": 0.0, "yaw": -math.pi / 2, "kind": "inspection"},
    {"id": "shared", "x": -5.5, "z": 4.7, "yaw": math.pi, "kind": "shared"},
    {"id": "technical", "x": 0.0, "z": 4.7, "yaw": math.pi, "kind": "technical"},
    {"id": "storage", "x": 5.5, "z": 4.7, "yaw": math.pi, "kind": "storage"},
]

HEX = {
    "stone": "C3D9F1", "stone_light": "F3F7FC", "stone_edge": "A9C9EA",
    "oak": "B8CCE5", "oak_light": "DDE9F6", "oak_dark": "6F839A",
    "navy": "275C96", "navy_dark": "153F6B", "steel": "879CB4",
    "steel_light": "D5E4F3", "glass": "DAF0FC", "blue": "2782D2",
    "blue_dark": "164F84", "screen": "071D2D", "cyan": "31C4DE",
    "teal": "34A9A0", "amber": "D6A34E", "white": "F8FBFF",
    "chair_blue": "4D7DAF", "chair_orange": "72A4DF", "leaf": "426B48",
    "leaf_light": "6E955B", "leaf_dark": "294D39", "pot": "91A9C2",
    "soil": "58687B", "case_blue": "4B81BB", "case_dark": "355D86",
    "warning": "D5AA37", "cable": "3C628B", "wall": "EEF4FB",
}

MATERIALS = {}
TEXTURES = {}
STATIC_OBJECTS = []


def rgba(hex_value: str, alpha: float = 1.0):
    value = hex_value.lstrip("#")
    srgb = (int(value[0:2], 16) / 255, int(value[2:4], 16) / 255, int(value[4:6], 16) / 255)
    return tuple(srgb_channel_to_linear(channel) for channel in srgb) + (alpha,)


def principled(name: str, hex_value: str, roughness: float, metallic: float = 0.0,
               alpha: float = 1.0, emission: float = 0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba(hex_value, alpha)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = rgba(hex_value)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if "Alpha" in shader.inputs:
        shader.inputs["Alpha"].default_value = alpha
    emission_socket = shader.inputs.get("Emission Color") or shader.inputs.get("Emission")
    if emission_socket is not None:
        emission_socket.default_value = rgba(hex_value)
    if "Emission Strength" in shader.inputs:
        shader.inputs["Emission Strength"].default_value = emission
    if alpha < 1.0:
        try:
            mat.surface_render_method = "BLENDED"
        except (AttributeError, TypeError, ValueError):
            pass
    return mat


def srgb_channel_to_linear(value: float) -> float:
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def create_wood_image(name: str, base_hex: str, path: Path, roughness=False):
    width = height = 256
    hex_value = base_hex.lstrip("#")
    base = tuple(int(hex_value[index:index + 2], 16) / 255 for index in (0, 2, 4))
    if not roughness:
        base = tuple(srgb_channel_to_linear(channel) for channel in base)
    pixels = array("f")
    for py in range(height):
        v = py / (height - 1)
        for px in range(width):
            u = px / (width - 1)
            wave = math.sin(math.tau * (v * 44.0 + 0.075 * math.sin(math.tau * u * 2.0) + 0.018 * math.sin(math.tau * u * 11.0)))
            broad = math.sin(math.tau * (v * 9.0 + 0.13 * math.sin(math.tau * u * 1.5)))
            fine = math.sin(math.tau * (v * 79.0 + u * 3.0))
            if roughness:
                value = max(0.32, min(0.63, 0.46 + 0.045 * wave + 0.025 * broad + 0.01 * fine))
                pixels.extend((value, value, value, 1.0))
            else:
                factor = 1.0 + 0.055 * wave + 0.022 * broad + 0.008 * fine
                pixels.extend(tuple(max(0.0, min(1.0, channel * factor)) for channel in base) + (1.0,))

    image = bpy.data.images.new(name, width=width, height=height, alpha=False, float_buffer=False)
    image.pixels.foreach_set(pixels)
    image.filepath_raw = str(path)
    image.file_format = "PNG"
    if roughness:
        image.colorspace_settings.name = "Non-Color"
    image.save()
    bpy.data.images.remove(image)
    image = bpy.data.images.load(str(path), check_existing=True)
    if roughness:
        image.colorspace_settings.name = "Non-Color"
    image.pack()
    return image


def create_stone_tile_image(name: str, path: Path, roughness=False):
    width = height = 512
    columns, rows = 6, 5
    tile_w, tile_h = width / columns, height / rows
    base = rgba("F3F7FC")[:3]
    grout = rgba("D0DFEF")[:3]
    pixels = array("f")
    for py in range(height):
        for px in range(width):
            col, row = int(px / tile_w), int(py / tile_h)
            local_x, local_y = (px % tile_w) / tile_w, (py % tile_h) / tile_h
            is_grout = local_x < 0.025 or local_y < 0.025 or local_x > 0.975 or local_y > 0.975
            grain = 0.012 * math.sin(px * 0.091 + math.sin(py * 0.037) * 1.7) + 0.007 * math.sin(py * 0.31 + px * 0.017)
            tile_variation = 0.018 * math.sin(col * 7.1 + row * 4.7)
            if roughness:
                value = 0.90 if is_grout else max(0.70, min(0.86, 0.78 + grain + tile_variation))
                pixels.extend((value, value, value, 1.0))
            else:
                color = grout if is_grout else base
                variation = 1.0 + (grain + tile_variation)
                pixels.extend(tuple(max(0.0, min(1.0, channel * variation)) for channel in color) + (1.0,))

    image = bpy.data.images.new(name, width, height, alpha=False, float_buffer=False)
    image.pixels.foreach_set(pixels)
    image.filepath_raw = str(path)
    image.file_format = "PNG"
    if roughness:
        image.colorspace_settings.name = "Non-Color"
    image.save()
    bpy.data.images.remove(image)
    image = bpy.data.images.load(str(path), check_existing=True)
    image.colorspace_settings.name = "Non-Color" if roughness else "sRGB"
    image.pack()
    return image


def wire_wood_images(texture_dir: Path):
    texture_dir.mkdir(parents=True, exist_ok=True)
    for key, base in (("oak", "B8CCE5"), ("oak_light", "DDE9F6")):
        color_path = texture_dir / f"office_{key}_albedo.png"
        roughness_path = texture_dir / f"office_{key}_roughness.png"
        TEXTURES[f"{key}_albedo"] = create_wood_image(f"T_Office_{key}_Albedo", base, color_path)
        TEXTURES[f"{key}_roughness"] = create_wood_image(f"T_Office_{key}_Roughness", "777777", roughness_path, roughness=True)
        material = MATERIALS[key]
        shader = material.node_tree.nodes.get("Principled BSDF")
        color_node = material.node_tree.nodes.new("ShaderNodeTexImage")
        color_node.name = f"TX_{key}_albedo"
        color_node.label = "Subtle open-pore wood grain | sRGB"
        color_node.image = TEXTURES[f"{key}_albedo"]
        rough_node = material.node_tree.nodes.new("ShaderNodeTexImage")
        rough_node.name = f"TX_{key}_roughness"
        rough_node.label = "Fine roughness variation | Non-Color"
        rough_node.image = TEXTURES[f"{key}_roughness"]
        material.node_tree.links.new(color_node.outputs["Color"], shader.inputs["Base Color"])
        material.node_tree.links.new(rough_node.outputs["Color"], shader.inputs["Roughness"])

    tile_color = create_stone_tile_image("T_Office_Floor_Stone_Albedo", texture_dir / "office_floor_stone_albedo.png")
    tile_roughness = create_stone_tile_image("T_Office_Floor_Stone_Roughness", texture_dir / "office_floor_stone_roughness.png", roughness=True)
    floor_material = MATERIALS["floor"]
    floor_shader = floor_material.node_tree.nodes.get("Principled BSDF")
    color_node = floor_material.node_tree.nodes.new("ShaderNodeTexImage")
    color_node.name = "TX_floor_stone_albedo"
    color_node.label = "Subtle stone tile variation | sRGB"
    color_node.image = tile_color
    rough_node = floor_material.node_tree.nodes.new("ShaderNodeTexImage")
    rough_node.name = "TX_floor_stone_roughness"
    rough_node.label = "Stone tile roughness | Non-Color"
    rough_node.image = tile_roughness
    floor_material.node_tree.links.new(color_node.outputs["Color"], floor_shader.inputs["Base Color"])
    floor_material.node_tree.links.new(rough_node.outputs["Color"], floor_shader.inputs["Roughness"])


def create_materials(texture_dir: Path):
    recipes = {
        "stone": ("stone", 0.78, 0.0, 1.0, 0.0),
        "stone_light": ("stone_light", 0.83, 0.0, 1.0, 0.0),
        "stone_edge": ("stone_edge", 0.78, 0.02, 1.0, 0.0),
        "floor": ("stone", 0.78, 0.0, 1.0, 0.0),
        "oak": ("oak", 0.44, 0.0, 1.0, 0.0),
        "oak_light": ("oak_light", 0.42, 0.0, 1.0, 0.0),
        "oak_dark": ("oak_dark", 0.51, 0.0, 1.0, 0.0),
        "navy": ("navy", 0.38, 0.16, 1.0, 0.0),
        "navy_dark": ("navy_dark", 0.42, 0.14, 1.0, 0.0),
        "steel": ("steel", 0.3, 0.78, 1.0, 0.0),
        "steel_light": ("steel_light", 0.28, 0.68, 1.0, 0.0),
        "glass": ("glass", 0.16, 0.08, 0.23, 0.0),
        "blue": ("blue", 0.36, 0.16, 1.0, 0.0),
        "blue_dark": ("blue_dark", 0.42, 0.18, 1.0, 0.0),
        "screen": ("screen", 0.2, 0.04, 1.0, 0.0),
        "cyan": ("cyan", 0.3, 0.0, 1.0, 1.15),
        "teal": ("teal", 0.34, 0.04, 1.0, 0.65),
        "amber": ("amber", 0.42, 0.04, 1.0, 0.25),
        "white": ("white", 0.43, 0.0, 1.0, 0.0),
        "chair_blue": ("chair_blue", 0.58, 0.0, 1.0, 0.0),
        "chair_orange": ("chair_orange", 0.55, 0.0, 1.0, 0.0),
        "leaf": ("leaf", 0.82, 0.0, 1.0, 0.0),
        "leaf_light": ("leaf_light", 0.8, 0.0, 1.0, 0.0),
        "leaf_dark": ("leaf_dark", 0.83, 0.0, 1.0, 0.0),
        "pot": ("pot", 0.76, 0.0, 1.0, 0.0),
        "soil": ("soil", 0.93, 0.0, 1.0, 0.0),
        "case_blue": ("case_blue", 0.54, 0.12, 1.0, 0.0),
        "case_dark": ("case_dark", 0.54, 0.16, 1.0, 0.0),
        "warning": ("warning", 0.56, 0.12, 1.0, 0.0),
        "cable": ("cable", 0.62, 0.2, 1.0, 0.0),
        "wall": ("wall", 0.8, 0.0, 1.0, 0.0),
    }
    for key, (color, roughness, metallic, alpha, emission) in recipes.items():
        MATERIALS[key] = principled(f"PBR | {key.replace('_', ' ').title()}", HEX[color], roughness, metallic, alpha, emission)
    wire_wood_images(texture_dir)


def three_to_blender(point):
    """Map Three.js (X,Y-up,Z) coordinates to Blender (X,Y,Z-up)."""
    x, y, z = point
    return (x, -z, y)


def bevel_bmesh_edges(bm, width: float, size_hint):
    if width <= 0 or min(size_hint) < 0.05:
        return
    safe_width = min(width, max(min(size_hint) * 0.16, 0.0005))
    edges = list(bm.edges)
    if edges:
        bmesh.ops.bevel(
            bm, geom=edges, offset=safe_width, segments=3, profile=0.5,
            clamp_overlap=True, loop_slide=True,
        )
    if bm.faces:
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))


def make_cube_mesh(name: str, size, bevel=0.0):
    sx, sy, sz = size
    hx, hy, hz = sx / 2, sz / 2, sy / 2
    vertices = [
        (-hx, -hy, -hz), (hx, -hy, -hz), (hx, hy, -hz), (-hx, hy, -hz),
        (-hx, -hy, hz), (hx, -hy, hz), (hx, hy, hz), (-hx, hy, hz),
    ]
    faces = [
        (0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
        (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7),
    ]
    bm = bmesh.new()
    bm.verts.ensure_lookup_table()
    created = bmesh.ops.create_cube(bm, size=1.0)
    for vert in created["verts"]:
        vert.co.x *= hx
        vert.co.y *= hy
        vert.co.z *= hz
    bevel_bmesh_edges(bm, bevel, (sx, sy, sz))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    add_planar_uv(mesh)
    return mesh


def add_planar_uv(mesh):
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for polygon in mesh.polygons:
        normal = polygon.normal
        if abs(normal.z) >= abs(normal.x) and abs(normal.z) >= abs(normal.y):
            axes = (0, 1)
        elif abs(normal.y) >= abs(normal.x):
            axes = (0, 2)
        else:
            axes = (1, 2)
        coords = [mesh.vertices[index].co for index in polygon.vertices]
        min_u = min(co[axes[0]] for co in coords)
        max_u = max(co[axes[0]] for co in coords)
        min_v = min(co[axes[1]] for co in coords)
        max_v = max(co[axes[1]] for co in coords)
        span_u = max(max_u - min_u, 1e-5)
        span_v = max(max_v - min_v, 1e-5)
        for loop_index, vertex_index in zip(polygon.loop_indices, polygon.vertices):
            co = mesh.vertices[vertex_index].co
            uv_layer.data[loop_index].uv = ((co[axes[0]] - min_u) / span_u, (co[axes[1]] - min_v) / span_v)


def add_cube_atlas_uv(mesh):
    """Unwrap a flat-sided cube without stacking its six faces over each other."""
    uv_layer = mesh.uv_layers.active or mesh.uv_layers.new(name="UVMap")
    for polygon in mesh.polygons:
        normal = polygon.normal
        if abs(normal.z) > 0.5:
            axes = (0, 1)
            region = (0.16, 0.16, 0.84, 0.84) if normal.z > 0 else (0.85, 0.85, 0.98, 0.98)
        elif abs(normal.x) > 0.5:
            axes = (1, 2)
            region = (0.84, 0.16, 0.98, 0.84) if normal.x > 0 else (0.02, 0.16, 0.16, 0.84)
        else:
            axes = (0, 2)
            region = (0.16, 0.84, 0.84, 0.98) if normal.y > 0 else (0.16, 0.02, 0.84, 0.16)
        coords = [mesh.vertices[index].co for index in polygon.vertices]
        min_u = min(co[axes[0]] for co in coords)
        max_u = max(co[axes[0]] for co in coords)
        min_v = min(co[axes[1]] for co in coords)
        max_v = max(co[axes[1]] for co in coords)
        span_u = max(max_u - min_u, 1e-5)
        span_v = max(max_v - min_v, 1e-5)
        for loop_index, vertex_index in zip(polygon.loop_indices, polygon.vertices):
            co = mesh.vertices[vertex_index].co
            u = (co[axes[0]] - min_u) / span_u
            v = (co[axes[1]] - min_v) / span_v
            uv_layer.data[loop_index].uv = (
                region[0] + u * (region[2] - region[0]),
                region[1] + v * (region[3] - region[1]),
            )


def new_room_root(room):
    root = bpy.data.objects.new(f"ROOM_ROOT__{room['id']}", None)
    bpy.context.scene.collection.objects.link(root)
    root.empty_display_type = "PLAIN_AXES"
    root.location = three_to_blender((room["x"], 0, room["z"]))
    root.rotation_euler.z = room["yaw"]
    root.scale = (ROOM_SCALE, ROOM_SCALE, 1.0)
    return root


def add_box(name: str, size, center, material: str, parent=None, bevel=0.02, yaw=0.0, keep=False):
    mesh = make_cube_mesh(name, size, bevel)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = three_to_blender(center)
    obj.rotation_euler.z = yaw
    obj.data.materials.append(MATERIALS[material])
    if parent is not None:
        obj.parent = parent
    if bevel > 0:
        obj["bevel_width"] = float(bevel)
    obj["static_office_asset"] = True
    if keep:
        obj["keep_separate"] = True
    STATIC_OBJECTS.append(obj)
    return obj


def add_cylinder(name: str, radius: float, depth: float, center, material: str,
                 parent=None, radius_top=None, segments=20, bevel=0.008):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, segments=segments,
        radius1=radius, radius2=radius if radius_top is None else radius_top,
        depth=depth,
    )
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    add_planar_uv(mesh)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = three_to_blender(center)
    obj.data.materials.append(MATERIALS[material])
    if parent is not None:
        obj.parent = parent
    if bevel > 0:
        obj["bevel_width"] = float(bevel)
    obj["static_office_asset"] = True
    STATIC_OBJECTS.append(obj)
    return obj


def add_branch(name: str, start, end, radius: float, material: str, parent=None):
    start_b = Vector(three_to_blender(start))
    end_b = Vector(three_to_blender(end))
    direction = end_b - start_b
    if direction.length < 0.001:
        return None
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, segments=10, radius1=radius,
        radius2=radius * 0.72, depth=direction.length,
    )
    bevel_bmesh_edges(bm, radius * 0.28, (radius * 2, direction.length, radius * 2))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = (start_b + end_b) * 0.5
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    obj.data.materials.append(MATERIALS[material])
    if parent is not None:
        obj.parent = parent
    obj["static_office_asset"] = True
    STATIC_OBJECTS.append(obj)
    return obj


def add_ellipsoid(name: str, size, center, material: str, parent=None, yaw=0.0):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1)
    sx, sy, sz = size
    for vert in bm.verts:
        vert.co.x *= sx / 2
        vert.co.y *= sz / 2
        vert.co.z *= sy / 2
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = three_to_blender(center)
    obj.rotation_euler.z = yaw
    obj.data.materials.append(MATERIALS[material])
    if parent is not None:
        obj.parent = parent
    obj["static_office_asset"] = True
    STATIC_OBJECTS.append(obj)
    return obj


def add_anchor(name: str, center, parent=None):
    anchor = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(anchor)
    anchor.empty_display_type = "SPHERE"
    anchor.empty_display_size = 0.08
    anchor.location = three_to_blender(center)
    if parent is not None:
        anchor.parent = parent
    anchor["office_anchor"] = True
    return anchor


def room_box(root, room_id, name, size, center, material, bevel=0.02, yaw=0.0, keep=False):
    return add_box(f"{room_id.upper()}__{name}", size, center, material, root, bevel, yaw, keep)


def add_floor(root, room):
    room_id = room["id"]
    floor = add_box(f"ROOM_FLOOR__{room_id}", (ROOM_SIZE[0], 0.08, ROOM_SIZE[1]),
                    (0, -0.015, 0), "floor", root, 0, keep=True)
    add_cube_atlas_uv(floor.data)
    floor["room_id"] = room_id
    # A restrained perimeter inlay catches the light and separates room materials.
    for z in (-ROOM_SIZE[1] / 2 + 0.12, ROOM_SIZE[1] / 2 - 0.12):
        room_box(root, room_id, "FLOOR_INLAY", (ROOM_SIZE[0] - 0.12, 0.012, 0.012), (0, 0.032, z), "stone_edge", 0.003)
    for x in (-ROOM_SIZE[0] / 2 + 0.12, ROOM_SIZE[0] / 2 - 0.12):
        room_box(root, room_id, "FLOOR_INLAY", (0.012, 0.012, ROOM_SIZE[1] - 0.12), (x, 0.032, 0), "stone_edge", 0.003)
    return floor


def add_architecture(root, room_id):
    width, depth = ROOM_SIZE
    # Clear, open-top cutaway rooms with slim anodized frames.
    room_box(root, room_id, "BACK_GLASS", (width, 1.47, 0.035), (0, 0.96, -depth / 2 + 0.01), "glass", 0.004)
    room_box(root, room_id, "LEFT_GLASS", (0.035, 1.47, depth), (-width / 2 + 0.01, 0.96, 0), "glass", 0.004)
    room_box(root, room_id, "RIGHT_GLASS", (0.035, 1.47, depth), (width / 2 - 0.01, 0.96, 0), "glass", 0.004)
    # Low front returns preserve the entrance and the open isometric view.
    for x in (-1.30, 1.30):
        room_box(root, room_id, "FRONT_GLASS_RETURN", (0.88, 0.58, 0.035), (x, 0.32, depth / 2 - 0.01), "glass", 0.004)
    for z in (-depth / 2 + 0.08, depth / 2 - 0.05):
        for x in (-width / 2 + 0.06, width / 2 - 0.06):
            room_box(root, room_id, "FRAME_POST", (0.055, 1.62, 0.055), (x, 0.83, z), "steel", 0.008)
    for x in (-0.88, 0, 0.88):
        room_box(root, room_id, "BACK_MULLION", (0.035, 1.5, 0.045), (x, 0.95, -depth / 2 + 0.035), "steel_light", 0.006)
    for side in (-1, 1):
        x = side * (width / 2 - 0.035)
        for z in (-0.54, 0.43):
            room_box(root, room_id, "SIDE_MULLION", (0.045, 1.5, 0.035), (x, 0.95, z), "steel_light", 0.006)
    room_box(root, room_id, "BACK_SILL", (width, 0.06, 0.08), (0, 0.18, -depth / 2 + 0.02), "oak_light", 0.012)
    # Floating sign plate for the bilingual, app-generated label.
    room_box(root, room_id, "ROOM_SIGN_PLATE", (1.66, 0.40, 0.045), (0, 1.63, -depth / 2 + 0.12), "navy", 0.035)
    add_anchor(f"ROOM_SIGN__{room_id}", (0, 1.63, -depth / 2 + 0.145), root)
    # A slim top rail makes the glass frames read as architectural rather than screen-like.
    for z in (-depth / 2 + 0.02, depth / 2 - 0.02):
        room_box(root, room_id, "TOP_RAIL", (width, 0.045, 0.055), (0, 1.72, z), "steel", 0.012)
    for x in (-width / 2 + 0.02, width / 2 - 0.02):
        room_box(root, room_id, "TOP_RAIL", (0.055, 0.045, depth), (x, 1.72, 0), "steel", 0.012)


def add_monitor(root, room_id, x, y, z, width=0.58, height=0.36, pattern=0):
    room_box(root, room_id, "MONITOR_HOUSING", (width + 0.075, height + 0.075, 0.07),
             (x, y, z), "navy_dark", 0.025)
    room_box(root, room_id, "MONITOR_GLASS", (width, height, 0.012),
             (x, y, z + 0.042), "screen", 0.008)
    room_box(root, room_id, "MONITOR_STAND", (0.07, 0.16, 0.06),
             (x, y - height / 2 - 0.105, z - 0.018), "steel", 0.01)
    room_box(root, room_id, "MONITOR_FOOT", (0.24, 0.025, 0.14),
             (x, y - height - 0.107, z + 0.008), "steel", 0.009)
    # Abstract cartography and instrument marks: illustrative only, with no live values.
    line_color = "cyan" if pattern % 2 == 0 else "teal"
    for row in range(3):
        line_width = width * (0.48 + 0.1 * ((row + pattern) % 3))
        line_y = y + height * (0.27 - row * 0.22)
        room_box(root, room_id, "SCREEN_MAP_LINE", (line_width, 0.009, 0.004),
                 (x - width * 0.17, line_y, z + 0.051), line_color, 0.001)
    # Small map/telemetry blocks, kept deliberately non-textual.
    for idx in range(3):
        block_w = width * (0.12 + idx * 0.02)
        block_h = height * (0.14 + (idx % 2) * 0.05)
        block_x = x + width * (0.28 - idx * 0.18)
        room_box(root, room_id, "SCREEN_DATA_BLOCK", (block_w, block_h, 0.004),
                 (block_x, y + height * 0.22, z + 0.052), "blue" if idx == 1 else "teal", 0.002)
    # A faint horizon/map contour drawn as short connected bars.
    for idx, (dx, dy, span) in enumerate(((-0.22, -0.20, 0.12), (-0.12, -0.13, 0.16), (0.02, -0.10, 0.17), (0.17, -0.18, 0.12))):
        room_box(root, room_id, "SCREEN_ROUTE", (width * span, 0.009, 0.004),
                 (x + width * dx, y + height * dy, z + 0.054), "amber" if idx == 3 else "cyan", 0.001,
                 yaw=(-0.06 if idx % 2 else 0.04))


def add_desk(root, room_id, x, z, width=1.28, depth=0.66, top=0.76, monitor=True, pattern=0):
    room_box(root, room_id, "DESK_TOP", (width, 0.075, depth), (x, top, z), "oak_light", 0.032)
    room_box(root, room_id, "DESK_EDGE", (width - 0.06, 0.022, 0.018),
             (x, top - 0.029, z + depth / 2 - 0.018), "oak", 0.006)
    leg_y = (top - 0.075) / 2
    leg_h = top - 0.075
    for dx in (-width / 2 + 0.09, width / 2 - 0.09):
        for dz in (-depth / 2 + 0.08, depth / 2 - 0.08):
            room_box(root, room_id, "DESK_LEG", (0.052, leg_h, 0.052), (x + dx, leg_y, z + dz), "steel", 0.012)
    room_box(root, room_id, "DESK_CABLE_TRAY", (width * 0.54, 0.06, 0.13),
             (x, top - 0.10, z - depth * 0.30), "navy", 0.012)
    if monitor:
        add_monitor(root, room_id, x, top + 0.30, z - depth * 0.29,
                    width=min(0.58, width * 0.48), height=0.34, pattern=pattern)


def add_chair(root, room_id, x, z, upholstery="chair_blue", scale=1.0, seat_top=0.36):
    # Five-spoke task chair, with a padded shell and simple, legible silhouette.
    seat_top *= scale
    add_cylinder(f"{room_id.upper()}__CHAIR_COLUMN", 0.043 * scale, max(seat_top - 0.10 * scale, 0.1),
                 (x, max((seat_top - 0.10 * scale) / 2, 0.05), z), "steel", root, segments=16, bevel=0.007)
    add_cylinder(f"{room_id.upper()}__CHAIR_SEAT", 0.27 * scale, 0.30 * scale,
                 (x, seat_top - 0.07 * scale, z), upholstery, root, radius_top=0.28 * scale, segments=24, bevel=0.015)
    room_box(root, room_id, "CHAIR_BACK", (0.49 * scale, 0.48 * scale, 0.115 * scale),
             (x, seat_top + 0.25 * scale, z + 0.22 * scale), upholstery, 0.055)
    room_box(root, room_id, "CHAIR_BACK_SHELL", (0.43 * scale, 0.41 * scale, 0.025 * scale),
             (x, seat_top + 0.25 * scale, z + 0.282 * scale), "navy", 0.035)
    for idx in range(5):
        angle = idx * math.tau / 5
        dx, dz = math.cos(angle) * 0.20 * scale, math.sin(angle) * 0.20 * scale
        room_box(root, room_id, "CHAIR_SPOKE", (0.30 * scale, 0.035 * scale, 0.035 * scale),
                 (x + dx / 2, 0.07 * scale, z + dz / 2), "steel", 0.012,
                 yaw=math.atan2(dz, dx))
        add_cylinder(f"{room_id.upper()}__CHAIR_CASTOR", 0.035 * scale, 0.075 * scale,
                     (x + dx, 0.04 * scale, z + dz), "navy_dark", root, segments=12, bevel=0.004)


def add_meeting_room(root, room):
    rid = room["id"]
    # Six-seat oak board table and wall display.
    room_box(root, rid, "CONFERENCE_TABLE", (2.05, 0.105, 0.92), (0, 0.77, -0.12), "oak", 0.055)
    for x in (-0.72, 0.72):
        room_box(root, rid, "TABLE_PEDESTAL", (0.14, 0.69, 0.15), (x, 0.36, -0.12), "steel", 0.025)
    for x in (-0.72, 0, 0.72):
        add_chair(root, rid, x, -1.02, "chair_orange", 0.88, 0.50)
        add_chair(root, rid, x, 0.82, "chair_orange", 0.88, 0.50)
    add_monitor(root, rid, 0, 1.18, -1.36, 1.08, 0.48, 1)
    for x in (-1.4, 1.4):
        add_plant(root, rid, x, -0.78, 0.78)


def add_manager_room(root, room):
    rid = room["id"]
    # Executive team table with one reserved model anchor for the current manager.
    room_box(root, rid, "TEAM_TABLE", (2.18, 0.095, 0.88), (0, 0.77, -0.35), "oak_light", 0.05)
    for x in (-0.76, 0.76):
        room_box(root, rid, "TABLE_LEG", (0.10, 0.70, 0.10), (x, 0.37, -0.35), "steel", 0.018)
    for x in (-0.72, 0, 0.72):
        add_chair(root, rid, x, -1.02, "chair_blue", 0.84, 0.50)
        add_chair(root, rid, x, 0.74, "chair_blue", 0.84, 0.50)
    room_box(root, rid, "WALL_SHELF", (0.45, 1.17, 0.38), (1.43, 0.64, -1.03), "oak", 0.025)
    for y in (0.30, 0.59, 0.88):
        room_box(root, rid, "SHELF_BOARD", (0.40, 0.035, 0.34), (1.43, y, -1.03), "oak_light", 0.008)
    for idx, x in enumerate((1.29, 1.44, 1.58)):
        room_box(root, rid, "BOOK_SPINE", (0.07, 0.23 + (idx % 2) * 0.04, 0.08),
                 (x, 0.44, -0.92), "blue" if idx == 1 else "amber", 0.009)
    add_plant(root, rid, -1.42, -0.92, 0.8)
    add_anchor("WORKSTATION__planning__0", (0, 0.025, 0.76), root)


def add_pantry(root, room):
    rid = room["id"]
    room_box(root, rid, "KITCHEN_BASE", (1.95, 0.77, 0.48), (0, 0.43, -1.05), "oak", 0.035)
    room_box(root, rid, "KITCHEN_COUNTER", (2.02, 0.075, 0.56), (0, 0.85, -1.02), "stone_light", 0.02)
    room_box(root, rid, "BACKSPLASH", (1.9, 0.42, 0.04), (0, 1.10, -1.29), "wall", 0.012)
    room_box(root, rid, "FRIDGE", (0.52, 1.40, 0.60), (1.26, 0.72, -1.00), "steel_light", 0.055)
    room_box(root, rid, "FRIDGE_DOOR", (0.43, 1.19, 0.035), (1.26, 0.74, -0.68), "white", 0.035)
    add_cylinder(f"{rid.upper()}__CAFE_TABLE", 0.47, 0.075, (0.10, 0.77, 0.48), "oak_light", root, segments=32, bevel=0.02)
    add_cylinder(f"{rid.upper()}__CAFE_PEDESTAL", 0.09, 0.62, (0.10, 0.42, 0.48), "steel", root, segments=20, bevel=0.012)
    for x, z in ((-0.62, 0.42), (0.82, 0.42), (0.10, 1.15)):
        add_chair(root, rid, x, z, "chair_orange", 0.9, 0.48)
    # The room-wide plant added in build_rooms() already fills this corner.


def add_planning_room(root, room):
    rid = room["id"]
    # Mission planning work tables and a pin-up wall; the boards are illustrative.
    for x in (-0.77, 0.74):
        add_desk(root, rid, x, -0.18, 1.18, 0.62, 0.75, True, 2)
        add_chair(root, rid, x, 0.69, "chair_blue", 0.95)
    room_box(root, rid, "PLANNING_BOARD", (2.12, 0.90, 0.055), (0, 1.10, -1.36), "navy", 0.03)
    for idx, (x, y, w, color) in enumerate(((-0.63, 1.24, 0.38, "teal"), (-0.12, 1.20, 0.47, "blue"), (0.45, 0.91, 0.55, "amber"))):
        room_box(root, rid, "PLANNING_PIN", (w, 0.20 if idx != 1 else 0.30, 0.018),
                 (x, y, -1.322), color, 0.008)
    add_plant(root, rid, -1.42, 1.08, 0.76)


def add_dispatch(root, room):
    rid = room["id"]
    # Three joined flight desks point toward the panoramic operations wall.
    room_box(root, rid, "OPS_CONSOLE_BASE", (3.10, 0.30, 0.49), (0, 0.20, -0.13), "navy", 0.07)
    room_box(root, rid, "OPS_CONSOLE_COUNTER", (3.18, 0.12, 0.58), (0, 0.79, -0.13), "oak", 0.045)
    for index, x in enumerate((-1.10, 0.0, 1.10)):
        room_box(root, rid, "CONSOLE_PEDESTAL", (0.76, 0.56, 0.40), (x, 0.44, -0.20), "navy_dark", 0.045)
        add_monitor(root, rid, x, 1.12, -1.16, 0.77, 0.49, index)
        add_anchor(f"WORKSTATION__dispatch__{index}", (x, 0.025, 0.82), root)
    # Panoramic route/map wall, built from clean abstract relief panels.
    room_box(root, rid, "OPERATIONS_WALL", (3.12, 0.84, 0.09), (0, 1.04, -1.40), "navy_dark", 0.045)
    for idx, x in enumerate((-1.04, 0.0, 1.04)):
        room_box(root, rid, "WALL_MONITOR_HOUSING", (0.91, 0.66, 0.045), (x, 1.08, -1.343), "screen", 0.014)
        room_box(root, rid, "WALL_MAP_PANEL", (0.84, 0.58, 0.012), (x, 1.08, -1.315), "blue_dark", 0.01)
        for row in range(4):
            room_box(root, rid, "WALL_MAP_CONTOUR", (0.56 - 0.05 * (row % 2), 0.012, 0.006),
                     (x - 0.03, 1.27 - row * 0.13, -1.304), "cyan" if row % 2 else "teal", 0.002,
                     yaw=(0.04 if row % 2 else -0.03))
        for col in range(3):
            room_box(root, rid, "WALL_DATA_STRIP", (0.10, 0.035 + col * 0.008, 0.006),
                     (x - 0.29 + col * 0.13, 0.82, -1.303), "amber" if col == 2 else "cyan", 0.003)
    # A small central relief table visually links control and mapping.
    room_box(root, rid, "MAP_TABLE", (1.12, 0.08, 0.46), (0, 0.78, 0.54), "oak_light", 0.03)
    room_box(root, rid, "MAP_TABLE_LEG", (0.10, 0.72, 0.10), (0, 0.38, 0.54), "steel", 0.018)


def add_shared_workspace(root, room):
    rid = room["id"]
    for index, x in enumerate((-0.78, 0.78)):
        add_desk(root, rid, x, -0.30, 1.20, 0.66, 0.75, True, index)
        add_chair(root, rid, x, 0.67, "chair_blue", 0.95)
        add_anchor(f"WORKSTATION__shared__{index}", (x, 0.025, 0.78), root)
    room_box(root, rid, "COLLABORATION_SHELF", (1.34, 0.75, 0.34), (0, 0.40, -1.13), "oak", 0.03)
    for y in (0.18, 0.40, 0.62):
        room_box(root, rid, "SHELF_BOARD", (1.30, 0.025, 0.30), (0, y, -1.13), "oak_light", 0.008)
    for x in (-0.46, -0.19, 0.15, 0.42):
        room_box(root, rid, "BOOK_SPINE", (0.11, 0.20, 0.14), (x, 0.28, -0.94), "blue" if x < 0 else "amber", 0.008)
    add_plant(root, rid, -1.45, -0.84, 0.70)


def add_drone_prop(root, room_id, x, z, size=0.68):
    # A compact quadcopter maintenance prop, assembled from rounded hard-surface parts.
    y = 0.99
    room_box(root, room_id, "DRONE_BATTERY", (0.33 * size, 0.17 * size, 0.34 * size), (x, y, z), "case_blue", 0.045)
    room_box(root, room_id, "DRONE_TOP_SHELL", (0.46 * size, 0.10 * size, 0.38 * size), (x, y + 0.11 * size, z), "white", 0.04)
    room_box(root, room_id, "DRONE_CAMERA", (0.16 * size, 0.13 * size, 0.13 * size), (x, y - 0.08 * size, z + 0.24 * size), "navy_dark", 0.035)
    add_cylinder(f"{room_id.upper()}__DRONE_LENS", 0.052 * size, 0.025 * size,
                 (x, y - 0.08 * size, z + 0.31 * size), "cyan", root, segments=16, bevel=0.004)
    for dx, dz, yaw in ((-0.40, -0.28, -0.22), (0.40, -0.28, 0.22), (-0.40, 0.28, 0.22), (0.40, 0.28, -0.22)):
        arm_x, arm_z = dx * size * 0.72, dz * size * 0.72
        room_box(root, room_id, "DRONE_ARM", (0.42 * size, 0.065 * size, 0.075 * size),
                 (x + arm_x, y + 0.025 * size, z + arm_z), "steel", 0.025, yaw=math.atan2(arm_z, arm_x))
        add_cylinder(f"{room_id.upper()}__DRONE_MOTOR", 0.09 * size, 0.12 * size,
                     (x + dx * size, y + 0.07 * size, z + dz * size), "case_blue", root, segments=16, bevel=0.012)
        # Propeller blades are slender, readable, and kept under the clear inspection canopy.
        room_box(root, room_id, "DRONE_PROPELLER", (0.52 * size, 0.018 * size, 0.055 * size),
                 (x + dx * size, y + 0.15 * size, z + dz * size), "navy", 0.008, yaw=(yaw + 0.4))
    for dx, dz in ((-0.20, -0.15), (0.20, -0.15), (-0.20, 0.15), (0.20, 0.15)):
        room_box(root, room_id, "DRONE_LANDING_LEG", (0.045 * size, 0.18 * size, 0.045 * size),
                 (x + dx * size, y - 0.115 * size, z + dz * size), "steel", 0.009)


def add_inspection(root, room):
    rid = room["id"]
    room_box(root, rid, "CALIBRATION_BENCH", (2.42, 0.12, 0.76), (0, 0.76, -0.37), "oak", 0.045)
    for x in (-0.94, 0, 0.94):
        room_box(root, rid, "BENCH_CABINET", (0.70, 0.57, 0.58), (x, 0.32, -0.37), "steel_light", 0.035)
        room_box(root, rid, "CABINET_DRAWER", (0.61, 0.11, 0.025), (x, 0.42, -0.064), "white", 0.008)
        room_box(root, rid, "DRAWER_PULL", (0.19, 0.018, 0.02), (x, 0.42, -0.039), "steel", 0.006)
    # A raised calibration pad with a small quadcopter specimen.
    room_box(root, rid, "CALIBRATION_PAD", (0.86, 0.065, 0.74), (0.12, 0.88, -0.42), "navy", 0.035)
    room_box(root, rid, "CALIBRATION_MARK", (0.60, 0.012, 0.018), (0.12, 0.921, -0.42), "warning", 0.002)
    add_drone_prop(root, rid, 0.12, -0.42, 0.72)
    room_box(root, rid, "TOOL_WALL", (2.02, 0.88, 0.055), (0, 1.12, -1.36), "wall", 0.025)
    for idx, x in enumerate((-0.73, -0.36, 0.02, 0.40, 0.77)):
        room_box(root, rid, "TOOL_HOOK", (0.026, 0.21 + (idx % 2) * 0.08, 0.04),
                 (x, 1.17, -1.318), "steel", 0.012, yaw=(0.06 if idx % 2 else -0.06))
    for index, x in enumerate((-0.78, 0.78)):
        add_chair(root, rid, x, 0.86, "chair_blue", 1.0)
        add_anchor(f"WORKSTATION__inspection__{index}", (x, 0.025, 0.88), root)


def add_technical(root, room):
    rid = room["id"]
    for x in (-0.76, 0.76):
        room_box(root, rid, "REPAIR_BENCH", (1.34, 0.105, 0.66), (x, 0.76, -0.23), "oak", 0.035)
        room_box(root, rid, "BENCH_DRAWER", (0.76, 0.19, 0.46), (x, 0.59, -0.23), "steel_light", 0.025)
        add_monitor(root, rid, x, 1.18, -1.08, 0.56, 0.34, 0)
    # Tool rack and wall mounted test instruments.
    room_box(root, rid, "TOOL_BOARD", (2.18, 0.84, 0.06), (0, 1.13, -1.36), "navy", 0.03)
    for idx, x in enumerate((-0.78, -0.39, 0, 0.39, 0.78)):
        room_box(root, rid, "TOOL_CASE", (0.22, 0.28 + (idx % 2) * 0.08, 0.08),
                 (x, 1.13, -1.30), "steel_light" if idx % 2 else "amber", 0.025)
    room_box(root, rid, "TEST_INSTRUMENT", (0.56, 0.42, 0.33), (1.12, 0.32, 0.89), "navy_dark", 0.04)
    add_monitor(root, rid, 1.12, 0.57, 0.71, 0.36, 0.23, 1)
    room_box(root, rid, "TEST_BENCH_TOP", (1.35, 0.07, 0.54), (1.10, 0.76, 0.90), "stone_light", 0.028)
    add_drone_prop(root, rid, -0.56, 0.88, 0.53)
    for index, x in enumerate((-0.76, 0.76)):
        add_chair(root, rid, x, 0.91, "chair_blue", 1.0)
        add_anchor(f"WORKSTATION__technical__{index}", (x, 0.025, 0.92), root)


def add_storage(root, room):
    rid = room["id"]
    for x in (-1.24, 0, 1.24):
        room_box(root, rid, "STORAGE_RACK_SIDE", (0.055, 1.60, 0.46), (x - 0.34, 0.80, -0.94), "steel", 0.012)
        for y in (0.18, 0.66, 1.14, 1.59):
            room_box(root, rid, "STORAGE_SHELF", (0.78, 0.065, 0.56), (x, y, -0.94), "oak_light", 0.015)
        for row, y in enumerate((0.39, 0.88, 1.35)):
            color = ("case_blue", "case_dark", "oak")[(int(abs(x) * 10) + row) % 3]
            room_box(root, rid, "EQUIPMENT_CASE", (0.54, 0.31, 0.38), (x, y, -0.94), color, 0.035)
            room_box(root, rid, "CASE_LABEL", (0.16, 0.035, 0.025), (x, y + 0.03, -0.735), "white", 0.01)
    room_box(root, rid, "PACKING_TABLE", (1.56, 0.095, 0.70), (0.12, 0.75, 0.54), "oak", 0.035)
    for x in (-0.48, 0.72):
        room_box(root, rid, "TABLE_LEG", (0.08, 0.68, 0.08), (x, 0.35, 0.54), "steel", 0.015)
    room_box(root, rid, "ROLLING_CASE", (0.56, 0.58, 0.42), (0.18, 0.36, 0.60), "case_blue", 0.04)
    for x in (-0.02, 0.38):
        add_cylinder(f"{rid.upper()}__CASE_WHEEL", 0.06, 0.065, (x, 0.08, 0.67), "navy_dark", root, segments=14, bevel=0.008)


def add_plant(root, room_id, x, z, scale=1.0):
    height = 0.48 * scale
    add_cylinder(f"{room_id.upper()}__PLANT_POT", 0.21 * scale, height,
                 (x, height / 2 + 0.004, z), "pot", root, radius_top=0.26 * scale, segments=20, bevel=0.012)
    add_cylinder(f"{room_id.upper()}__PLANT_TRUNK", 0.035 * scale, 0.62 * scale,
                 (x, height + 0.29 * scale, z), "oak_dark", root, radius_top=0.022 * scale,
                 segments=12, bevel=0.004)
    crown = height + 0.72 * scale
    for idx, (dx, dz, dyaw, size) in enumerate((
        (0.00, 0.00, 0.0, 0.82), (0.28, 0.00, 0.35, 0.68),
        (-0.28, 0.02, -0.25, 0.68), (0.04, 0.31, 0.42, 0.62),
        (-0.04, -0.31, -0.48, 0.62),
    )):
        leaf_y = crown + (0.20 if idx == 0 else 0.0) * scale
        leaf_material = "leaf_light" if idx % 3 == 0 else ("leaf" if idx % 2 else "leaf_dark")
        add_branch(f"{room_id.upper()}__PLANT_BRANCH", (x, height + 0.42 * scale, z),
                   (x + dx * scale, leaf_y - 0.05 * scale, z + dz * scale),
                   0.018 * scale, leaf_material, root)
        add_ellipsoid(f"{room_id.upper()}__PLANT_LEAF", (0.12 * scale * size, 0.24 * scale * size, 0.075 * scale),
                      (x + dx * scale, leaf_y, z + dz * scale),
                      leaf_material, root, dyaw)


def build_rooms():
    for room in ROOMS:
        root = new_room_root(room)
        add_floor(root, room)
        add_architecture(root, room["id"])
        kind = room["kind"]
        if kind == "meeting":
            add_meeting_room(root, room)
        elif kind == "planning":
            add_manager_room(root, room)
        elif kind == "pantry":
            add_pantry(root, room)
        elif kind == "lounge":
            add_planning_room(root, room)
        elif kind == "dispatch":
            add_dispatch(root, room)
        elif kind == "inspection":
            add_inspection(root, room)
        elif kind == "shared":
            add_shared_workspace(root, room)
        elif kind == "technical":
            add_technical(root, room)
        elif kind == "storage":
            add_storage(root, room)
        if kind != "lounge":
            add_plant(root, room["id"], -1.44, 1.02, 0.62)


def build_platform():
    add_box("PLATFORM__dark_base", (17.1, 0.28, 14.6), (0, -0.24, 0), "navy_dark", bevel=0.08)
    add_box("PLATFORM__stone_cap", (16.96, 0.10, 14.44), (0, -0.09, 0), "stone", bevel=0.035)
    # Raise the corridors to the room-floor datum so the cutaway reads as one connected office.
    for x in (-2.75, 2.75):
        add_box("PLATFORM__corridor_floor", (1.18, 0.08, 14.2), (x, -0.015, 0), "floor", bevel=0)
    horizontal_segments = ((-5.91, 5.14), (0, 4.32), (5.91, 5.14))
    for z in (-2.35, 2.35):
        for x, width in horizontal_segments:
            add_box("PLATFORM__corridor_floor", (width, 0.08, 1.08), (x, -0.015, z), "floor", bevel=0)

    # Fine blue inlays mark the main circulation lanes.
    for z in (-7.22, 7.22):
        add_box("PLATFORM__edge_trim", (17.0, 0.028, 0.035), (0, 0.012, z), "steel_light", bevel=0.009)
    for x in (-8.48, 8.48):
        add_box("PLATFORM__edge_trim", (0.035, 0.028, 14.30), (x, 0.012, 0), "steel_light", bevel=0.009)
    for x in (-2.8, 2.8):
        add_box("PLATFORM__corridor_inlay", (0.024, 0.012, 9.55), (x, 0.034, 0), "blue", bevel=0.003)
    for z in (-2.4, 2.4):
        add_box("PLATFORM__corridor_inlay", (11.0, 0.012, 0.024), (0, 0.034, z), "blue", bevel=0.003)
    for x, z in ((-8.08, -6.78), (8.08, -6.78), (-8.08, 6.78), (8.08, 6.78)):
        add_plant(None, "platform", x, z, 0.72)


def flatten_and_join():
    # Preserve Blender's editability, but collapse object transforms for a stable GLB.
    bpy.context.view_layer.update()
    floor_objects = [obj for obj in STATIC_OBJECTS if obj.name.startswith("ROOM_FLOOR__")]
    normal_objects = [obj for obj in STATIC_OBJECTS if obj not in floor_objects and not obj.get("keep_separate")]
    for obj in STATIC_OBJECTS:
        world = obj.matrix_world.copy()
        if obj.data and obj.data.vertices:
            obj.data.transform(world)
        obj.parent = None
        obj.location = (0, 0, 0)
        obj.rotation_euler = (0, 0, 0)
        obj.scale = (1, 1, 1)
        obj.matrix_world = Matrix.Identity(4)

    for obj in bpy.data.objects:
        if obj.type == "EMPTY" and (obj.name.startswith("WORKSTATION__") or obj.name.startswith("ROOM_SIGN__")):
            world = obj.matrix_world.copy()
            obj.parent = None
            obj.matrix_world = world

    # Each static material becomes a few combined meshes instead of hundreds of draw calls.
    buckets = {}
    for obj in normal_objects:
        material = obj.data.materials[0] if obj.data.materials else None
        if material is None:
            continue
        buckets.setdefault(material.name, []).append(obj)

    for material_name, objects in buckets.items():
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        active = objects[0]
        bpy.context.view_layer.objects.active = active
        if len(objects) > 1:
            bpy.ops.object.join()
        merged = bpy.context.view_layer.objects.active
        merged.name = f"STATIC__{material_name.replace(' ', '_')}"
        merged["static_office_asset"] = True
        merged_bm = bmesh.new()
        merged_bm.from_mesh(merged.data)
        if merged_bm.faces:
            bmesh.ops.recalc_face_normals(merged_bm, faces=list(merged_bm.faces))
        merged_bm.to_mesh(merged.data)
        merged_bm.free()
        normal = merged.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
        normal.keep_sharp = True
        normal.weight = 40
        for polygon in merged.data.polygons:
            polygon.use_smooth = False

    # Avoid saving thousands of hidden per-object construction remnants.
    for root in [obj for obj in bpy.data.objects if obj.name.startswith("ROOM_ROOT__")]:
        bpy.data.objects.remove(root, do_unlink=True)
    for obj in bpy.data.objects:
        if obj.type == "EMPTY" and not (obj.name.startswith("WORKSTATION__") or obj.name.startswith("ROOM_SIGN__")):
            bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")


def add_preview_scene():
    scene = bpy.context.scene
    # This Blender 5.2 build exposes the stable CYCLES engine in background mode.
    scene.render.engine = "CYCLES"
    try:
        scene.cycles.samples = 24
        scene.cycles.use_denoising = True
        scene.cycles.device = "CPU"
    except (AttributeError, TypeError):
        pass
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 820
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.filepath = "//office_environment_preview.png"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.1
    scene.view_settings.gamma = 1.0
    scene.render.image_settings.color_depth = "8"
    scene.render.resolution_percentage = 72
    if scene.world is None:
        scene.world = bpy.data.worlds.new("Office Studio World")
    scene.world.use_nodes = True
    world_bg = scene.world.node_tree.nodes.get("Background")
    world_bg.inputs["Color"].default_value = rgba("F3F8FF")
    world_bg.inputs["Strength"].default_value = 0.48

    camera_data = bpy.data.cameras.new("Office | isometric review camera")
    camera = bpy.data.objects.new("Office | isometric review camera", camera_data)
    scene.collection.objects.link(camera)
    camera.location = three_to_blender((19, 22, 26))
    camera.rotation_euler = (Vector(three_to_blender((0, 0.7, 0))) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 24.2
    camera_data.lens = 58
    scene.camera = camera
    camera_data.dof.use_dof = False

    def area_light(name, position, energy, color, size, shape="DISK", size_y=None):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.color = rgba(color)[:3]
        data.shape = shape
        data.size = size
        if size_y is not None and hasattr(data, "size_y"):
            data.size_y = size_y
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = three_to_blender(position)
        obj.rotation_euler = (Vector(three_to_blender((0, 0.6, 0))) - obj.location).to_track_quat("-Z", "Y").to_euler()
        return obj

    area_light("Key | warm north window", (-7, 9, 16), 1900, "FFF0D7", 11, "DISK")
    area_light("Fill | soft cool", (10, -7, 12), 1150, "D8E9FF", 10, "DISK")
    area_light("Rim | warm ceiling", (1, -3, 17), 850, "FFD39A", 8, "RECTANGLE", 5)

    ground_mat = principled("Studio | cool white floor", "E4EDF7", 0.88, 0.0)
    MATERIALS["studio_ground"] = ground_mat
    ground = add_box("Studio floor", (200, 0.08, 200), (0, -0.48, 0), "studio_ground", bevel=0)
    ground["preview_only"] = True
    scene.render.filepath = "//office_environment_preview.png"
    scene.render.resolution_percentage = 80


def clean_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.cameras, bpy.data.lights, bpy.data.materials, bpy.data.images):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)
    STATIC_OBJECTS.clear()
    MATERIALS.clear()


def parse_args():
    raw = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True, help="Frontend repository root")
    parser.add_argument("--skip-render", action="store_true")
    return parser.parse_args(raw)


def main():
    args = parse_args()
    repo = Path(args.repo).resolve()
    blend_path = repo / "assets" / "office3d" / "office_environment.blend"
    glb_path = repo / "public" / "models" / "office" / "office_environment.glb"
    preview_path = repo / "assets" / "office3d" / "office_environment_preview.png"
    manifest_path = repo / "public" / "models" / "office" / "office_anchors.json"
    texture_dir = repo / "assets" / "office3d" / "textures"
    blend_path.parent.mkdir(parents=True, exist_ok=True)
    glb_path.parent.mkdir(parents=True, exist_ok=True)

    clean_scene()
    create_materials(texture_dir)
    build_platform()
    build_rooms()
    flatten_and_join()
    add_preview_scene()
    bpy.context.scene.render.filepath = str(preview_path)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

    bpy.ops.object.select_all(action="DESELECT")
    export_objects = [
        obj for obj in bpy.data.objects
        if (obj.get("static_office_asset") and not obj.get("preview_only")) or obj.get("office_anchor")
    ]
    for obj in export_objects:
        obj.select_set(True)
    if export_objects:
        bpy.context.view_layer.objects.active = export_objects[0]
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_extras=True,
        export_materials="EXPORT",
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_texcoords=True,
        export_normals=True,
    )
    manifest = {
        "asset": "office_environment.glb",
        "source": "assets/office3d/office_environment.blend",
        "coordinateSystem": "Three.js X/Y-up/Z coordinates; GLB is exported Y-up",
        "dimensions": {"width": 17.1, "depth": 14.6, "roomWidth": ROOM_SIZE[0] * ROOM_SCALE, "roomDepth": ROOM_SIZE[1] * ROOM_SCALE},
        "rooms": [room["id"] for room in ROOMS],
        "floorNodes": [f"ROOM_FLOOR__{room['id']}" for room in ROOMS],
        "signAnchors": [f"ROOM_SIGN__{room['id']}" for room in ROOMS],
        "workstations": sorted(obj.name for obj in bpy.data.objects if obj.name.startswith("WORKSTATION__")),
        "visualDisclosure": "Room contents and displays are illustrative; staffing and mission data remain application-driven.",
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    if not args.skip_render:
        bpy.context.scene.render.filepath = str(preview_path)
        bpy.ops.render.render()
        bpy.data.images["Render Result"].save_render(filepath=str(preview_path))

    print(f"OFFICE_BLEND={blend_path}")
    print(f"OFFICE_GLB={glb_path}")
    print(f"OFFICE_PREVIEW={preview_path if not args.skip_render else 'skipped'}")
    print(f"OFFICE_MANIFEST={manifest_path}")
    print(f"OFFICE_OBJECTS={len(bpy.data.objects)}")
    print(f"OFFICE_STATIC_PARTS={len([obj for obj in bpy.data.objects if obj.name.startswith('STATIC__')])}")


if __name__ == "__main__":
    main()
