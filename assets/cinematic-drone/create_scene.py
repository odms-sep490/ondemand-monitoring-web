"""Build a self-contained cinematic drone prototype in the connected Blender scene.

Run through Blender's Python console/MCP. The source file is saved separately from
the rendered web frames so the landing page never downloads the .blend project.
"""

from pathlib import Path
import bpy
import math
from mathutils import Vector


PROJECT_ROOT = Path(r"C:\Users\ACER\Documents\GitHub\doan\ondemand-monitoring-web")
ASSET_ROOT = PROJECT_ROOT / "assets" / "cinematic-drone"
WEB_ROOT = PROJECT_ROOT / "public" / "assets" / "cinematic-drone"
FRAME_END = 384
PREVIEW_ROOT = WEB_ROOT / "preview-frames"
ASSET_ROOT.mkdir(parents=True, exist_ok=True)
PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
WEB_ROOT.mkdir(parents=True, exist_ok=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.collections):
        if block.name != "Collection" and block.users == 0:
            bpy.data.collections.remove(block)


def collection(name):
    result = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(result)
    return result


def move_to(obj, target_collection):
    for item in list(obj.users_collection):
        item.objects.unlink(obj)
    target_collection.objects.link(obj)
    return obj


def material(name, color, metallic=0.0, roughness=0.4, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    shader = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    if emission is not None:
        emission_input = shader.inputs.get("Emission Color") or shader.inputs.get("Emission")
        if emission_input is not None:
            emission_input.default_value = (*emission, 1.0)
        strength_input = shader.inputs.get("Emission Strength")
        if strength_input is not None:
            strength_input.default_value = emission_strength
    return mat


def assign(obj, mat):
    obj.data.materials.append(mat)
    return obj


def smooth(obj):
    if obj.type == "MESH":
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    return obj


def cube(name, location, dimensions, mat, bevel=0.05, parent=None, rotation=(0, 0, 0), target=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Machined edge radii", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        modifier.limit_method = "ANGLE"
        normal = obj.modifiers.new("Corner normals", "WEIGHTED_NORMAL")
        normal.keep_sharp = True
    if mat:
        assign(obj, mat)
    if parent:
        obj.parent = parent
    if target:
        move_to(obj, target)
    return obj


def cylinder(name, location, radius, depth, mat, parent=None, rotation=(0, 0, 0), vertices=32, target=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = rotation
    bevel = obj.modifiers.new("Soft machined edge", "BEVEL")
    bevel.width = min(radius * 0.16, depth * 0.18)
    bevel.segments = 2
    obj.modifiers.new("Corner normals", "WEIGHTED_NORMAL")
    smooth(obj)
    if mat:
        assign(obj, mat)
    if parent:
        obj.parent = parent
    if target:
        move_to(obj, target)
    return obj


def sphere(name, location, scale, mat, parent=None, target=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    smooth(obj)
    if mat:
        assign(obj, mat)
    if parent:
        obj.parent = parent
    if target:
        move_to(obj, target)
    return obj


def ring(name, radius, bevel_depth, z, mat, target, segments=128):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 2
    data.bevel_depth = bevel_depth
    data.bevel_resolution = 2
    spline = data.splines.new("POLY")
    spline.points.add(segments - 1)
    for index, point in enumerate(spline.points):
        angle = math.tau * index / segments
        point.co = (math.cos(angle) * radius, math.sin(angle) * radius, z, 1.0)
    spline.use_cyclic_u = True
    obj = bpy.data.objects.new(name, data)
    target.objects.link(obj)
    assign(obj, mat)
    return obj


def area_light(name, location, target_point, color, power, size, target, shape="DISK"):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    data.shape = shape
    data.size = size
    obj = bpy.data.objects.new(name, data)
    target.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target_point) - obj.location).to_track_quat("-Z", "Y").to_euler()
    return obj


def key_location(obj, frame, point):
    obj.location = point
    obj.keyframe_insert(data_path="location", frame=frame)


def key_rotation(obj, frame, rotation):
    obj.rotation_euler = rotation
    obj.keyframe_insert(data_path="rotation_euler", frame=frame)


def smooth_keys(obj):
    # Blender 5 stores actions in channel bags rather than exposing action.fcurves.
    # Keyframes use Bezier interpolation by default; leave that native smoothing intact.
    return


def build_drone(model_collection, mats):
    root = bpy.data.objects.new("Drone | six-rotor inspection aircraft", None)
    model_collection.objects.link(root)
    root.empty_display_type = "PLAIN_AXES"
    root.empty_display_size = 0.4

    carbon = mats["graphite"]
    alloy = mats["titanium"]
    shell = mats["shell"]
    safety = mats["warm"]
    dark_glass = mats["glass"]

    # A longer central body and six radial arms give the aircraft a fresh silhouette.
    sphere("Upper monocoque shell", (0.0, 0.0, 0.06), (0.78, 0.48, 0.22), shell, root, model_collection)
    sphere("Nose fairing", (0.42, 0.0, 0.025), (0.43, 0.39, 0.18), shell, root, model_collection)
    cube("Lower carbon chassis", (-0.03, 0.0, -0.17), (1.1, 0.61, 0.13), carbon, 0.045, root, target=model_collection)
    cube("Quick-swap battery cassette", (-0.18, 0.0, 0.23), (0.77, 0.49, 0.15), alloy, 0.055, root, target=model_collection)
    cube("Safety latch", (-0.16, 0.0, 0.324), (0.31, 0.24, 0.045), safety, 0.018, root, target=model_collection)
    for vent_index, x in enumerate((-0.48, -0.34, -0.20), start=1):
        cube(f"Battery vent {vent_index}", (x, 0.0, 0.31), (0.045, 0.29, 0.014), carbon, 0.006, root, target=model_collection)

    # Forward range sensor and stabilized camera payload.
    cube("Forward lidar window", (0.79, 0.0, 0.06), (0.055, 0.34, 0.11), dark_glass, 0.025, root, target=model_collection)
    sphere("Forward sensor lens", (0.824, 0.0, 0.07), (0.026, 0.09, 0.065), mats["lens_blue"], root, model_collection)
    cube("Gimbal isolation bracket", (0.43, 0.0, -0.23), (0.18, 0.18, 0.11), alloy, 0.04, root, target=model_collection)
    sphere("Gimbal housing", (0.49, 0.0, -0.34), (0.22, 0.2, 0.17), carbon, root, model_collection)
    cylinder("Camera lens barrel", (0.69, 0.0, -0.34), 0.105, 0.22, alloy, root, (0.0, math.pi / 2, 0.0), target=model_collection)
    sphere("Camera optic", (0.807, 0.0, -0.34), (0.035, 0.075, 0.075), mats["lens_blue"], root, model_collection)

    motor_positions = [
        (1.82, 0.0),
        (0.91, 1.02),
        (-0.91, 1.02),
        (-1.82, 0.0),
        (-0.91, -1.02),
        (0.91, -1.02),
    ]
    rotors = []
    for index, (x, y) in enumerate(motor_positions, start=1):
        angle = math.atan2(y, x)
        span = math.hypot(x, y)
        cube(
            f"Carbon boom {index}",
            (x * 0.52, y * 0.52, -0.005),
            (span - 0.53, 0.12, 0.105),
            carbon,
            0.045,
            root,
            rotation=(0.0, 0.0, angle),
            target=model_collection,
        )
        cylinder(f"Motor can {index}", (x, y, 0.12), 0.165, 0.18, alloy, root, target=model_collection)
        cylinder(f"Motor cap {index}", (x, y, 0.235), 0.095, 0.055, carbon, root, target=model_collection)
        collar = sphere(f"Arm safety collar {index}", (x * 0.79, y * 0.79, 0.055), (0.12, 0.12, 0.075), safety, root, model_collection)
        collar.rotation_euler[2] = angle

        pivot = bpy.data.objects.new(f"Rotor spindle {index}", None)
        model_collection.objects.link(pivot)
        pivot.parent = root
        pivot.location = (x, y, 0.29)
        pivot.empty_display_type = "CIRCLE"
        pivot.empty_display_size = 0.17
        cube(f"Propeller blade pair {index}", (0.0, 0.0, 0.0), (0.88, 0.052, 0.018), carbon, 0.008, pivot, target=model_collection)
        cylinder(f"Rotor hub {index}", (0.0, 0.0, 0.02), 0.082, 0.055, safety, pivot, target=model_collection)
        for frame, revolutions in (
            (1, 0),
            (18, 3),
            (48, 10),
            (96, 26),
            (144, 46),
            (192, 70),
            (240, 88),
            (288, 106),
            (336, 124),
            (FRAME_END, 142),
        ):
            direction = 1 if index % 2 else -1
            pivot.rotation_euler[2] = direction * math.tau * revolutions
            pivot.keyframe_insert(data_path="rotation_euler", frame=frame)
        rotors.append(pivot)

    # Four short supports and two parallel skids make the final landing readable.
    for index, (x, y) in enumerate(((-0.34, -0.26), (-0.34, 0.26), (0.34, -0.26), (0.34, 0.26)), start=1):
        cube(
            f"Landing support {index}",
            (x, y, -0.30),
            (0.075, 0.075, 0.53),
            carbon,
            0.026,
            root,
            rotation=(0.0, -0.13 if x < 0 else 0.13, 0.0),
            target=model_collection,
        )
    cube("Left landing skid", (0.0, -0.27, -0.52), (1.55, 0.065, 0.065), carbon, 0.028, root, target=model_collection)
    cube("Right landing skid", (0.0, 0.27, -0.52), (1.55, 0.065, 0.065), carbon, 0.028, root, target=model_collection)

    sphere("Port position lamp", (0.55, -0.34, 0.10), (0.07, 0.045, 0.035), mats["cyan"], root, model_collection)
    sphere("Starboard position lamp", (0.55, 0.34, 0.10), (0.07, 0.045, 0.035), mats["amber"], root, model_collection)
    sphere("Tail position lamp", (-0.66, 0.0, 0.08), (0.065, 0.075, 0.035), mats["red"], root, model_collection)

    flight_keys = [
        (1, (0.0, 0.0, 1.06), (0.0, 0.0, 0.0), 0.0),
        (18, (0.0, 0.0, 1.06), (0.0, 0.0, 0.0), 0.0),
        (48, (0.0, 0.0, 1.95), (0.0, -0.025, 0.0), 0.06),
        (78, (0.32, 0.04, 2.15), (0.0, -0.045, 0.015), 0.09),
        (108, (1.18, 0.22, 2.28), (0.02, -0.07, -0.07), 0.15),
        (144, (2.55, 1.05, 2.55), (0.03, -0.11, -0.19), 0.245),
        (168, (4.2, 1.85, 2.85), (0.035, -0.08, -0.24), 0.36),
        (192, (6.35, 2.55, 3.22), (0.02, -0.035, -0.27), 0.5),
        (216, (7.65, 3.45, 3.52), (0.02, -0.055, -0.18), 0.5625),
        (240, (8.95, 4.75, 3.72), (0.025, -0.08, -0.05), 0.625),
        (264, (9.2, 5.75, 3.58), (0.035, -0.095, 0.12), 0.6875),
        (288, (8.45, 5.85, 3.34), (0.03, -0.08, 0.29), 0.75),
        (312, (6.15, 4.7, 3.0), (0.02, -0.06, 0.4), 0.8125),
        (336, (3.85, 3.05, 2.42), (0.01, -0.04, 0.34), 0.875),
        (360, (1.85, 1.25, 1.5), (0.0, -0.02, 0.18), 0.9375),
        (FRAME_END, (0.0, 0.0, 0.565), (0.0, 0.0, 0.0), 1.0),
    ]
    flight_curve = bpy.data.curves.new("Drone flight | takeoff, inspection, return and landing", "CURVE")
    flight_curve.dimensions = "3D"
    flight_curve.resolution_u = 64
    flight_curve.use_path = True
    flight_curve.path_duration = FRAME_END
    flight_spline = flight_curve.splines.new("BEZIER")
    route_points = [
        flight_keys[index][1] for index in (0, 2, 3, 4, 5, 6, 7)
    ] + [
        (8.0, 3.8, 3.6),
        (9.5, 5.3, 3.8),
        (8.1, 6.1, 3.4),
        (5.0, 4.8, 2.8),
        (2.0, 2.0, 1.8),
        (0.0, 0.0, 0.565),
    ]
    flight_spline.bezier_points.add(len(route_points) - 1)
    for point, coordinate in zip(flight_spline.bezier_points, route_points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    flight_path = bpy.data.objects.new("FLIGHT PATH | takeoff, inspection, return and landing", flight_curve)
    model_collection.objects.link(flight_path)
    flight_path.hide_render = True
    flight_constraint = root.constraints.new("FOLLOW_PATH")
    flight_constraint.name = "Follow Bezier flight path"
    flight_constraint.target = flight_path
    flight_constraint.use_fixed_location = True
    flight_constraint.use_curve_follow = False
    for frame, _, rotation, offset in flight_keys:
        flight_constraint.offset_factor = offset
        flight_constraint.keyframe_insert(data_path="offset_factor", frame=frame)
        key_rotation(root, frame, rotation)
    smooth_keys(root)
    for rotor in rotors:
        smooth_keys(rotor)
    return root


def build_stage(stage_collection, mats):
    cylinder("Circular launch deck", (0, 0, -0.66), 8.5, 0.32, mats["deck"], target=stage_collection, vertices=96)
    cylinder("Center pad", (0, 0, -0.47), 3.35, 0.06, mats["pad"], target=stage_collection, vertices=96)
    ring("Pad perimeter | outer", 3.42, 0.018, -0.43, mats["blue_line"], stage_collection)
    ring("Pad perimeter | inner", 3.18, 0.012, -0.43, mats["soft_line"], stage_collection)
    ring("Deck arc | near", 6.1, 0.012, -0.46, mats["soft_line"], stage_collection)
    ring("Deck arc | far", 7.65, 0.009, -0.46, mats["blue_line"], stage_collection)
    cube("Approach lane", (-4.5, 0, -0.445), (7.4, 0.035, 0.012), mats["soft_line"], 0.008, target=stage_collection)
    cube("Deck axis | left", (0, -2.32, -0.438), (0.035, 1.6, 0.012), mats["blue_line"], 0.008, target=stage_collection)
    cube("Deck axis | right", (0, 2.32, -0.438), (0.035, 1.6, 0.012), mats["amber_line"], 0.008, target=stage_collection)
    for index, (x, y) in enumerate(((-2.8, -2.8), (-2.8, 2.8), (2.8, -2.8), (2.8, 2.8)), start=1):
        cylinder(f"Deck marker {index}", (x, y, -0.42), 0.075, 0.018, mats["blue_line"], target=stage_collection, vertices=24)
    cube("Infinite matte ground", (0, 0, -0.92), (200, 200, 0.18), mats["ground"], 0.0, target=stage_collection)


def build_camera(camera_collection, drone_root):
    curve_data = bpy.data.curves.new("Camera choreography | bezier rail", "CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 48
    curve_data.bevel_depth = 0.0
    curve_data.use_path = True
    curve_data.path_duration = FRAME_END
    spline = curve_data.splines.new("BEZIER")
    points = [
        (-3.95, -6.65, 3.48),
        (-3.85, -6.0, 3.02),
        (-2.55, -5.45, 2.72),
        (-0.55, -4.95, 2.83),
        (1.5, -4.6, 3.16),
        (3.8, -4.55, 3.65),
        (5.5, -2.2, 4.15),
        (7.0, -1.7, 4.35),
        (2.7, -2.0, 3.7),
        (-0.4, -5.0, 3.0),
        (-3.2, -7.0, 2.4),
    ]
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    path = bpy.data.objects.new("CAMERA RAIL | takeoff orbit", curve_data)
    camera_collection.objects.link(path)
    path.hide_render = True

    camera_data = bpy.data.cameras.new("Cinematic camera | 40mm")
    camera = bpy.data.objects.new("CAMERA | living mission", camera_data)
    camera_collection.objects.link(camera)
    camera_data.lens = 42
    camera_data.dof.use_dof = True
    camera_data.dof.focus_distance = 7.0
    camera_data.dof.aperture_fstop = 5.6

    follow = camera.constraints.new("FOLLOW_PATH")
    follow.name = "Orbit and dolly along Bezier rail"
    follow.target = path
    follow.use_fixed_location = True
    follow.use_curve_follow = False
    follow.offset_factor = 0.0
    follow.keyframe_insert(data_path="offset_factor", frame=1)
    for frame, offset in (
        (18, 0.025),
        (48, 0.08),
        (78, 0.155),
        (108, 0.25),
        (144, 0.36),
        (168, 0.43),
        (192, 0.5),
        (216, 0.5625),
        (240, 0.625),
        (264, 0.6875),
        (288, 0.75),
        (312, 0.8125),
        (336, 0.875),
        (360, 0.9375),
        (FRAME_END, 1.0),
    ):
        follow.offset_factor = offset
        follow.keyframe_insert(data_path="offset_factor", frame=frame)
    target = bpy.data.objects.new("Camera aim | lags into transition", None)
    camera_collection.objects.link(target)
    target.empty_display_type = "SPHERE"
    target.empty_display_size = 0.08
    target_keys = [
        (1, (-0.9, 0.0, 1.0)),
        (18, (-0.9, 0.0, 1.08)),
        (48, (-0.85, 0.0, 1.7)),
        (78, (-0.6, 0.03, 2.05)),
        (108, (0.05, 0.2, 2.18)),
        (144, (1.3, 0.78, 2.45)),
        (168, (2.55, 1.05, 2.65)),
        (192, (3.2, 1.1, 2.8)),
        (216, (7.15, 3.1, 3.42)),
        (240, (8.45, 4.5, 3.62)),
        (264, (8.9, 5.45, 3.46)),
        (288, (8.15, 5.55, 3.24)),
        (312, (5.95, 4.5, 2.9)),
        (336, (3.65, 2.9, 2.32)),
        (360, (1.65, 1.1, 1.42)),
        (FRAME_END, (0.0, 0.0, 1.06)),
    ]
    for frame, point in target_keys:
        key_location(target, frame, point)
    smooth_keys(target)
    track = camera.constraints.new("TRACK_TO")
    track.name = "Keep the aircraft framed through the orbit"
    track.target = target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"
    bpy.context.scene.camera = camera
    return camera, path, target


def configure_scene(light_collection):
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = FRAME_END
    scene.render.fps = 24
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGB"
    scene.render.filepath = str(PREVIEW_ROOT / "preview_")
    scene.render.use_file_extension = True
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.25
    scene.view_settings.gamma = 1.0
    if hasattr(scene, "eevee") and hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = 48
    if hasattr(scene, "eevee") and hasattr(scene.eevee, "use_gtao"):
        scene.eevee.use_gtao = True
        scene.eevee.gtao_distance = 3.0
        scene.eevee.gtao_factor = 1.25
    scene.render.image_settings.color_mode = "RGB"
    scene.camera.data.lens = 42

    world = bpy.data.worlds.new("World | deep blue studio") if not bpy.data.worlds else bpy.data.worlds[0]
    scene.world = world
    world.use_nodes = True
    background = next(node for node in world.node_tree.nodes if node.type == "BACKGROUND")
    background.inputs["Color"].default_value = (0.012, 0.02, 0.038, 1.0)
    background.inputs["Strength"].default_value = 0.28

    area_light("KEY | soft coolbox", (-3.5, -4.0, 7.2), (0, 0, 1.1), (0.65, 0.78, 1.0), 1150, 5.0, light_collection)
    area_light("FILL | warm edge", (3.6, -0.4, 5.3), (0.1, 0, 1.1), (1.0, 0.56, 0.28), 820, 3.4, light_collection)
    area_light("RIM | cyan strip", (0.0, 4.4, 4.2), (0, 0, 1.1), (0.14, 0.66, 1.0), 1550, 3.8, light_collection)
    area_light("TOP | broad studio", (-0.8, 1.5, 8.0), (0, 0, 1.0), (0.72, 0.85, 1.0), 930, 5.5, light_collection)
    area_light("PAD | subtle pool", (-4.2, -1.0, 4.5), (-1, 0, -0.4), (0.18, 0.48, 0.86), 420, 4.2, light_collection)


def main():
    clear_scene()
    drone_collection = collection("01 | Drone airframe")
    stage_collection = collection("02 | Launch deck and set")
    camera_collection = collection("03 | Camera choreography")
    light_collection = collection("04 | Cinematic lighting")

    mats = {
        "graphite": material("Airframe | carbon graphite", (0.022, 0.035, 0.052), 0.62, 0.28),
        "shell": material("Airframe | polar ceramic", (0.72, 0.82, 0.87), 0.24, 0.27),
        "titanium": material("Airframe | brushed titanium", (0.36, 0.44, 0.48), 0.72, 0.24),
        "warm": material("Airframe | warm ceramic shell", (0.72, 0.48, 0.25), 0.35, 0.27),
        "glass": material("Optics | smoked glass", (0.004, 0.012, 0.026), 0.4, 0.12),
        "lens_blue": material("Optics | blue coated lens", (0.018, 0.16, 0.29), 0.45, 0.14, (0.01, 0.08, 0.19), 0.45),
        "cyan": material("Navigation | cyan", (0.02, 0.38, 0.52), 0.2, 0.25, (0.015, 0.52, 0.8), 2.2),
        "amber": material("Navigation | amber", (0.8, 0.24, 0.04), 0.1, 0.28, (1.0, 0.12, 0.015), 1.3),
        "red": material("Navigation | red", (0.35, 0.025, 0.04), 0.1, 0.28, (0.9, 0.015, 0.01), 1.0),
        "deck": material("Deck | deep slate alloy", (0.032, 0.052, 0.074), 0.5, 0.33),
        "pad": material("Pad | graphite rubber", (0.018, 0.027, 0.041), 0.18, 0.52),
        "blue_line": material("Set marks | signal blue", (0.014, 0.08, 0.16), 0.2, 0.32, (0.015, 0.18, 0.42), 0.65),
        "soft_line": material("Set marks | cool grey", (0.07, 0.1, 0.13), 0.25, 0.4),
        "amber_line": material("Set marks | amber", (0.2, 0.08, 0.025), 0.15, 0.35, (0.45, 0.13, 0.02), 0.45),
        "ground": material("Cyclorama | midnight blue", (0.009, 0.016, 0.029), 0.12, 0.48),
    }

    drone_root = build_drone(drone_collection, mats)
    build_stage(stage_collection, mats)
    camera, _, _ = build_camera(camera_collection, drone_root)
    configure_scene(light_collection)

    scene = bpy.context.scene
    scene.frame_set(1)
    scene.render.filepath = str(PREVIEW_ROOT / "preview_")
    blend_path = ASSET_ROOT / "cinematic-drone-long.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    print("CINEMATIC_SCENE_READY", {
        "blend": str(blend_path),
        "camera": camera.name,
        "frames": [scene.frame_start, scene.frame_end],
        "fps": scene.render.fps,
        "resolution": [scene.render.resolution_x, scene.render.resolution_y],
        "drone_root": drone_root.name,
        "collections": ["01 | Drone airframe", "02 | Launch deck and set", "03 | Camera choreography", "04 | Cinematic lighting"],
    })


main()
