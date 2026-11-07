"""Build the web-ready drone assignment room and its source Blender scene."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
ASSET_DIR = ROOT / "assets" / "drone-assignment"
WEB_DIR = ROOT / "public" / "models" / "drone-assignment"
BLEND_PATH = ASSET_DIR / "drone_assignment_room.blend"
GLB_PATH = WEB_DIR / "drone-assignment-room.glb"
PREVIEW_PATH = ASSET_DIR / "drone_assignment_room_preview.png"


def srgb_channel_to_linear(value: int) -> float:
    value = value / 255.0
    if value <= 0.04045:
        return value / 12.92
    return ((value + 0.055) / 1.055) ** 2.4


def color_from_hex(value: str) -> tuple[float, float, float, float]:
    value = value.lstrip("#")
    return (
        srgb_channel_to_linear(int(value[0:2], 16)),
        srgb_channel_to_linear(int(value[2:4], 16)),
        srgb_channel_to_linear(int(value[4:6], 16)),
        1.0,
    )


def make_material(name: str, hex_color: str, roughness: float, metallic: bool = False,
                  emission: float = 0.0) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.diffuse_color = color_from_hex(hex_color)
    shader = next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = color_from_hex(hex_color)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = 1.0 if metallic else 0.0
    if emission > 0:
        emission_socket = shader.inputs.get("Emission Color") or shader.inputs.get("Emission")
        if emission_socket:
            emission_socket.default_value = color_from_hex(hex_color)
        strength_socket = shader.inputs.get("Emission Strength")
        if strength_socket:
            strength_socket.default_value = emission
    return material


class MeshBuilder:
    """Accumulate low-mid poly parts into a single named mesh and material set."""

    def __init__(self, name: str, collection: bpy.types.Collection, location=(0, 0, 0)):
        self.name = name
        self.collection = collection
        self.location = Vector(location)
        self.vertices: list[tuple[float, float, float]] = []
        self.faces: list[tuple[int, ...]] = []
        self.material_indices: list[int] = []
        self.materials: list[bpy.types.Material] = []
        self._material_index: dict[str, int] = {}

    def _mat_index(self, material: bpy.types.Material) -> int:
        if material.name not in self._material_index:
            self._material_index[material.name] = len(self.materials)
            self.materials.append(material)
        return self._material_index[material.name]

    def _append(self, vertices, faces, material: bpy.types.Material):
        offset = len(self.vertices)
        self.vertices.extend(tuple(vertex) for vertex in vertices)
        self.faces.extend(tuple(offset + index for index in face) for face in faces)
        self.material_indices.extend([self._mat_index(material)] * len(faces))

    def box(self, center, size, material: bpy.types.Material):
        x, y, z = center
        sx, sy, sz = (dimension / 2 for dimension in size)
        vertices = [
            (x - sx, y - sy, z - sz), (x + sx, y - sy, z - sz),
            (x + sx, y + sy, z - sz), (x - sx, y + sy, z - sz),
            (x - sx, y - sy, z + sz), (x + sx, y - sy, z + sz),
            (x + sx, y + sy, z + sz), (x - sx, y + sy, z + sz),
        ]
        faces = [
            (0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
            (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7),
        ]
        self._append(vertices, faces, material)

    def cylinder(self, center, radius: float, depth: float, material: bpy.types.Material,
                 segments: int = 32):
        x, y, z = center
        vertices = []
        for height in (z - depth / 2, z + depth / 2):
            for index in range(segments):
                angle = math.tau * index / segments
                vertices.append((x + math.cos(angle) * radius, y + math.sin(angle) * radius, height))
        faces = []
        faces.append(tuple(reversed(range(segments))))
        faces.append(tuple(range(segments, segments * 2)))
        for index in range(segments):
            nxt = (index + 1) % segments
            faces.append((index, nxt, segments + nxt, segments + index))
        self._append(vertices, faces, material)

    def torus(self, center, major: float, minor: float, material: bpy.types.Material,
             rings: int = 48, sides: int = 8):
        cx, cy, cz = center
        vertices = []
        for ring in range(rings):
            u = math.tau * ring / rings
            for side in range(sides):
                v = math.tau * side / sides
                radial = major + minor * math.cos(v)
                vertices.append((cx + radial * math.cos(u), cy + radial * math.sin(u),
                                 cz + minor * math.sin(v)))
        faces = []
        for ring in range(rings):
            next_ring = (ring + 1) % rings
            for side in range(sides):
                next_side = (side + 1) % sides
                faces.append((
                    ring * sides + side,
                    next_ring * sides + side,
                    next_ring * sides + next_side,
                    ring * sides + next_side,
                ))
        self._append(vertices, faces, material)

    def sphere(self, center, radius: float, material: bpy.types.Material,
               rings: int = 10, segments: int = 16):
        cx, cy, cz = center
        vertices = []
        for ring in range(rings + 1):
            phi = math.pi * ring / rings
            for segment in range(segments):
                theta = math.tau * segment / segments
                vertices.append((
                    cx + radius * math.sin(phi) * math.cos(theta),
                    cy + radius * math.sin(phi) * math.sin(theta),
                    cz + radius * math.cos(phi),
                ))
        faces = []
        for ring in range(rings):
            for segment in range(segments):
                next_segment = (segment + 1) % segments
                faces.append((
                    ring * segments + segment,
                    ring * segments + next_segment,
                    (ring + 1) * segments + next_segment,
                    (ring + 1) * segments + segment,
                ))
        self._append(vertices, faces, material)

    def finish(self, smooth=False):
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.vertices, [], self.faces)
        for material in self.materials:
            mesh.materials.append(material)
        for polygon, material_index in zip(mesh.polygons, self.material_indices):
            polygon.material_index = material_index
            polygon.use_smooth = smooth
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(mesh)
        bm.free()
        mesh.update()
        obj = bpy.data.objects.new(self.name, mesh)
        self.collection.objects.link(obj)
        obj.location = self.location
        return obj


def create_empty(name, collection, location, rotation=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "ARROWS"
    obj.empty_display_size = 0.35
    obj.location = location
    obj.rotation_euler = rotation
    collection.objects.link(obj)
    return obj


def point_camera(camera, target):
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()


def build():
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    WEB_DIR.mkdir(parents=True, exist_ok=True)

    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)

    scene = bpy.context.scene
    scene.name = "Drone Assignment Room"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1440
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 78
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "AgX"
    scene.render.film_transparent = False
    world = scene.world
    world.use_nodes = True
    background = next(node for node in world.node_tree.nodes if node.type == "BACKGROUND")
    background.inputs["Color"].default_value = color_from_hex("#dbe7f5")
    background.inputs["Strength"].default_value = 0.65

    root = scene.collection
    shell_collection = bpy.data.collections.new("Room Architecture")
    pads_collection = bpy.data.collections.new("Drone Docking Pads")
    drone_collection = bpy.data.collections.new("Reusable Drone Model")
    rig_collection = bpy.data.collections.new("Preview Camera and Lighting")
    for collection in (shell_collection, pads_collection, drone_collection, rig_collection):
        root.children.link(collection)

    porcelain = make_material("Porcelain | cool white", "#e9f1fb", 0.58)
    floor_mat = make_material("Floor | pale blue concrete", "#c7d6e8", 0.74)
    steel = make_material("Frame | satin titanium", "#607891", 0.34, True)
    dark = make_material("Graphite | equipment", "#263b52", 0.4, True)
    blue = make_material("OnDemand blue", "#1473e6", 0.32)
    cyan = make_material("Telemetry cyan", "#65c8e4", 0.28)
    screen = make_material("Display glass", "#0b223b", 0.22)
    screen_light = make_material("Display signal", "#52bfe6", 0.3, emission=1.5)
    safety = make_material("Safety amber", "#e9b448", 0.5)
    rubber = make_material("Rubber", "#283746", 0.72)
    floor_seam = make_material("Floor joint | blue gray", "#9fb1c7", 0.82)
    materials = (porcelain, floor_mat, steel, dark, blue, cyan, screen, screen_light, safety, rubber, floor_seam)

    # A 13.2 m open-front hangar with clear sight lines to every docking pad.
    shell = MeshBuilder("ROOM_SHELL", shell_collection)
    # Stop the floor and rear wall at the side-wall inner faces. Coplanar
    # exterior faces shimmer in real-time renderers at the room corners.
    shell.box((0, 0, 0.025), (12.92, 10.4, 0.05), floor_mat)
    shell.box((0, 5.08, 2.22), (12.72, 0.22, 4.4), porcelain)
    shell.box((-6.48, 0.0, 2.13), (0.24, 10.0, 4.25), porcelain)
    shell.box((6.48, 0.0, 2.13), (0.24, 10.0, 4.25), porcelain)
    shell.box((-4.0, -5.08, 0.34), (4.8, 0.20, 0.56), porcelain)
    shell.box((4.0, -5.08, 0.34), (4.8, 0.20, 0.56), porcelain)
    # Blue-tinted side windows and their aluminum frames.
    shell.box((-6.30, 0.1, 2.7), (0.045, 7.75, 2.35), cyan)
    shell.box((6.30, 0.1, 2.7), (0.045, 7.75, 2.35), cyan)
    for side in (-1, 1):
        x = side * 6.22
        for y in (-3.75, -1.2, 1.35, 3.9):
            shell.box((x, y, 2.18), (0.09, 0.10, 4.25), steel)
        shell.box((x, 0.05, 0.98), (0.10, 8.0, 0.09), steel)
        shell.box((x, 0.05, 4.04), (0.10, 8.0, 0.10), steel)
    # Overhead gantry beams, kept open so the drone room remains visible.
    # Floor markings guide movement without competing with the selected aircraft.
    for x in (-5.8, 5.8):
        shell.box((x, -0.9, 0.058), (0.055, 7.1, 0.010), blue)
    shell.box((0, -4.72, 0.058), (3.0, 0.055, 0.010), cyan)
    shell.finish()

    joints = MeshBuilder("FLOOR_JOINTS", shell_collection)
    for y in (-3.75, -0.45, 2.80):
        joints.box((0, y, 0.056), (12.6, 0.018, 0.008), floor_seam)
    for x in (-5.65, -1.90, 1.90):
        joints.box((x, 0, 0.056), (0.018, 9.9, 0.008), floor_seam)
    joints.box((5.65, -1.0, 0.056), (0.018, 7.8, 0.008), floor_seam)
    joints.finish()

    # Front workbench and flight-control screens.
    console = MeshBuilder("FLIGHT_OPERATIONS_CONSOLE", shell_collection)
    console.box((0, 4.48, 1.08), (4.9, 0.92, 0.14), steel)
    for x in (-1.95, 1.95):
        console.box((x, 4.51, 0.55), (0.62, 0.70, 0.94), porcelain)
        console.box((x, 4.14, 0.64), (0.44, 0.025, 0.42), dark)
    for index, x in enumerate((-1.52, 0.0, 1.52), start=1):
        console.box((x, 4.82, 2.32), (1.32, 0.10, 0.76), screen)
        console.box((x, 4.755, 2.32), (1.18, 0.018, 0.61), screen_light)
        console.box((x, 4.75, 1.91), (0.08, 0.12, 0.30), steel)
        console.box((x, 4.72, 1.72), (0.48, 0.32, 0.08), dark)
    for x in (-2.05, 2.05):
        console.box((x, 4.78, 0.86), (0.13, 0.18, 0.42), blue)
    console.finish()

    charging = MeshBuilder("CHARGING_BANK", shell_collection)
    charging.box((-5.20, 4.30, 1.10), (1.42, 1.14, 2.16), porcelain)
    charging.box((-5.20, 3.715, 1.05), (1.18, 0.04, 1.82), steel)
    for index in range(4):
        z = 0.43 + index * 0.39
        charging.box((-5.20, 3.68, z), (0.82, 0.045, 0.27), dark)
        charging.box((-4.80, 3.65, z), (0.08, 0.025, 0.075), cyan)
    charging.box((-5.20, 3.66, 2.06), (0.52, 0.035, 0.12), blue)
    charging.finish()

    maintenance = MeshBuilder("MAINTENANCE_BENCH", shell_collection)
    maintenance.box((5.15, 4.22, 0.66), (1.95, 1.18, 1.20), dark)
    maintenance.box((5.15, 4.18, 1.34), (2.05, 1.26, 0.10), steel)
    maintenance.box((5.15, 4.93, 1.92), (1.95, 0.16, 0.98), porcelain)
    for x in (4.58, 5.15, 5.72):
        maintenance.box((x, 4.82, 1.90), (0.045, 0.025, 0.72), blue)
    for x in (4.45, 5.85):
        maintenance.box((x, 3.60, 0.15), (0.12, 0.12, 0.20), rubber)
    maintenance.box((5.15, 3.60, 0.19), (1.70, 0.10, 0.08), steel)
    maintenance.finish()

    # Small status/display panels on the back wall.
    wall_detail = MeshBuilder("WALL_STATUS_PANELS", shell_collection)
    wall_detail.box((-2.55, 4.91, 3.45), (1.85, 0.12, 0.72), screen)
    wall_detail.box((-2.55, 4.835, 3.45), (1.68, 0.015, 0.54), screen_light)
    wall_detail.box((2.55, 4.91, 3.45), (1.85, 0.12, 0.72), screen)
    wall_detail.box((2.55, 4.835, 3.45), (1.68, 0.015, 0.54), screen_light)
    for x in (-5.2, 5.2):
        wall_detail.box((x, 4.90, 3.55), (0.34, 0.10, 0.72), blue)
        for i in range(3):
            wall_detail.box((x, 4.84, 3.37 + i * 0.16), (0.20, 0.014, 0.035), cyan)
    wall_detail.finish()

    # Six named, reusable docking anchors for the live candidate models.
    pad_positions = [
        (-3.9, -2.05), (0.0, -2.05), (3.9, -2.05),
        (-3.9, 1.12), (0.0, 1.12), (3.9, 1.12),
    ]
    for index, (x, y) in enumerate(pad_positions, start=1):
        pad = MeshBuilder(f"PAD_{index:02d}", pads_collection, (x, y, 0.14))
        pad.cylinder((0, 0, 0.0), 1.32, 0.18, dark, 48)
        pad.cylinder((0, 0, 0.1275), 1.24, 0.055, porcelain, 48)
        pad.torus((0, 0, 0.187), 1.16, 0.026, blue, 56, 8)
        pad.torus((0, 0, 0.177), 0.45, 0.012, cyan, 40, 8)
        # Helipad markings stay modelled; bay numbers are rendered from live slot IDs in the browser.
        pad.box((-0.25, 0, 0.17), (0.07, 0.46, 0.012), blue)
        pad.box((0.25, 0, 0.17), (0.07, 0.46, 0.012), blue)
        pad.box((0, 0, 0.17), (0.43, 0.07, 0.012), blue)
        for marker_x in (-0.88, 0.88):
            pad.cylinder((marker_x, 0, 0.151), 0.055, 0.02, cyan, 16)
        pad.finish()

    # A compact four-rotor survey drone is the shared visual model for live API rows.
    drone = MeshBuilder("DRONE_TEMPLATE", drone_collection)
    drone.box((0, 0.02, 0.02), (0.78, 0.66, 0.22), porcelain)
    drone.box((0, 0.10, 0.145), (0.42, 0.37, 0.06), blue)
    drone.box((0, 0.02, -0.125), (0.20, 0.19, 0.11), dark)
    # Cross arms, motors, rotor guards, and blades.
    drone.box((0, 0.0, 0.03), (2.92, 0.105, 0.13), steel)
    drone.box((0, 0.0, 0.03), (0.105, 2.48, 0.13), steel)
    for x in (-1.12, 1.12):
        for y in (-0.90, 0.90):
            drone.cylinder((x, y, 0.10), 0.18, 0.18, dark, 20)
            drone.torus((x, y, 0.215), 0.31, 0.018, blue, 32, 6)
            drone.box((x, y, 0.235), (0.64, 0.055, 0.024), cyan)
            drone.box((x, y, 0.238), (0.055, 0.64, 0.024), steel)
            drone.sphere((x * 0.90, y * 0.90, -0.01), 0.06, cyan, 8, 12)
    # Landing gear and forward-facing stabilized camera.
    for x in (-0.34, 0.34):
        for y in (-0.22, 0.27):
            drone.box((x, y, -0.26), (0.045, 0.05, 0.30), steel)
    for y in (-0.22, 0.27):
        drone.box((0, y, -0.41), (0.88, 0.055, 0.055), dark)
    drone.box((0, -0.42, -0.17), (0.28, 0.22, 0.20), dark)
    drone.cylinder((0, -0.55, -0.17), 0.095, 0.08, screen, 20)
    drone.sphere((0, -0.605, -0.17), 0.054, cyan, 10, 16)
    drone.box((-0.52, 0.05, 0.04), (0.20, 0.13, 0.055), safety)
    drone.box((0.52, 0.05, 0.04), (0.20, 0.13, 0.055), safety)
    template = drone.finish()
    template.location = (0, 0, 0.55)
    template["asset_role"] = "clone for each available drone returned by the API"

    # Camera anchors are saved with the source; the web viewer currently uses a fixed overview.
    overview = bpy.data.cameras.new("CAMERA_OVERVIEW")
    overview_obj = bpy.data.objects.new("CAMERA_OVERVIEW", overview)
    overview_obj.location = (0.8, -15.4, 12.8)
    overview.lens = 34
    point_camera(overview_obj, (0, 0, 1.1))
    rig_collection.objects.link(overview_obj)
    detail = bpy.data.cameras.new("CAMERA_DETAIL")
    detail_obj = bpy.data.objects.new("CAMERA_DETAIL", detail)
    detail_obj.location = (8.6, -9.5, 7.4)
    detail.lens = 48
    point_camera(detail_obj, (0, 0, 0.6))
    rig_collection.objects.link(detail_obj)
    scene.camera = overview_obj
    overview_obj.data.type = "ORTHO"
    overview_obj.data.ortho_scale = 17.0

    for name, location, energy, size in (
        ("Key softbox", (0, -3.5, 9.5), 1700, 8.0),
        ("Left fill", (-8, -1, 6.5), 850, 6.0),
        ("Back rim", (4, 6.5, 8.0), 1200, 5.0),
    ):
        light_data = bpy.data.lights.new(name, "AREA")
        light_data.energy = energy
        light_data.shape = "DISK"
        light_data.size = size
        light_obj = bpy.data.objects.new(name, light_data)
        light_obj.location = location
        point_camera(light_obj, (0, 0.4, 0.7))
        rig_collection.objects.link(light_obj)

    template.hide_render = True
    scene.render.filepath = str(PREVIEW_PATH)
    bpy.context.view_layer.update()
    if "--skip-render" not in sys.argv:
        bpy.ops.render.render(write_still=True)

    bpy.ops.object.select_all(action="DESELECT")
    export_objects = []
    for obj in list(shell_collection.objects) + list(pads_collection.objects) + [template]:
        obj.select_set(True)
        export_objects.append(obj)
    bpy.context.view_layer.objects.active = template
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
    )
    for obj in export_objects:
        obj.select_set(False)
    template.hide_render = True
    template.hide_set(True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))

    mesh_objects = [obj for obj in export_objects if obj.type == "MESH"]
    depsgraph = bpy.context.evaluated_depsgraph_get()
    triangle_count = 0
    for obj in mesh_objects:
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        triangle_count += sum(max(0, len(poly.vertices) - 2) for poly in mesh.polygons)
        evaluated.to_mesh_clear()
    world_points = [
        obj.matrix_world @ Vector(corner)
        for obj in mesh_objects
        for corner in obj.bound_box
    ]
    dimensions = (
        round(max(p.x for p in world_points) - min(p.x for p in world_points), 2),
        round(max(p.y for p in world_points) - min(p.y for p in world_points), 2),
        round(max(p.z for p in world_points) - min(p.z for p in world_points), 2),
    )
    print("DRONE_ROOM_RESULT", {
        "blend": str(BLEND_PATH),
        "glb": str(GLB_PATH),
        "preview": str(PREVIEW_PATH),
        "meshes": len(mesh_objects),
        "materials": len(materials),
        "triangles": triangle_count,
        "dimensions_m": dimensions,
        "pads": [f"PAD_{index:02d}" for index in range(1, 7)],
        "drone_template": template.name,
    })


if __name__ == "__main__":
    build()
