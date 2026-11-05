"""Configure the existing Blender scene for a transparent drone overlay export.

Run this script from Blender's Python console or through Blender MCP while
``cinematic-drone.blend`` is open, then render the active scene as an animation.
The script saves an overlay-specific .blend copy and writes source WebP frames
outside the frontend's public asset folder. ``compose_living_mission.ps1`` turns
those frames into the scroll-scrubbed desktop and mobile videos.
"""

from pathlib import Path

import bpy


def configure_overlay_render():
    asset_root = Path(bpy.data.filepath).resolve().parent
    repository_root = asset_root.parent.parent
    output_dir = asset_root / "overlay-frames"
    output_dir.mkdir(parents=True, exist_ok=True)

    drone = bpy.data.objects.get("Drone | six-rotor inspection aircraft")
    aim = bpy.data.objects.get("Camera aim | lags into transition")
    if drone is None or aim is None:
        raise RuntimeError("Could not find the animated aircraft and camera aim objects")

    # Blend from the authored camera path into an aircraft-relative aim. The
    # original aim keeps the opening composition; the follow constraint stops
    # the aircraft leaving frame during the final departure.
    helper_name = "Camera aim | aircraft framing"
    helper = bpy.data.objects.get(helper_name)
    if helper is None:
        helper = bpy.data.objects.new(helper_name, None)
        bpy.context.scene.collection.objects.link(helper)
    helper.parent = drone
    helper.location = (-0.25, 0.0, 0.0)
    helper.empty_display_type = "SPHERE"
    helper.empty_display_size = 0.06

    constraint_name = "Blend camera aim toward aircraft"
    previous_constraint = aim.constraints.get(constraint_name)
    if previous_constraint is not None:
        try:
            previous_constraint.driver_remove("influence")
        except (TypeError, RuntimeError):
            pass
        aim.constraints.remove(previous_constraint)

    follow_aim = aim.constraints.new("COPY_LOCATION")
    follow_aim.name = constraint_name
    follow_aim.target = helper
    follow_aim.owner_space = "WORLD"
    follow_aim.target_space = "WORLD"
    influence_curve = follow_aim.driver_add("influence")
    influence_curve.driver.type = "SCRIPTED"
    influence_curve.driver.expression = "min(max((frame - 24.0) / 48.0, 0.0), 1.0)"

    ground = bpy.data.objects.get("Infinite matte ground")
    if ground is None or not ground.users_collection:
        raise RuntimeError("Could not find the launch-set collection to hide for overlay rendering")

    for collection in ground.users_collection:
        collection.hide_render = True

    scene = bpy.context.scene
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.quality = 82
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.render.filepath = str(output_dir / "frame_")
    scene.render.use_file_extension = True
    scene.camera.data.dof.use_dof = False

    source_stem = Path(bpy.data.filepath).stem
    overlay_blend = asset_root / f"{source_stem}-overlay.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(overlay_blend), copy=True)
    scene.frame_set(scene.frame_start)

    print(f"Overlay scene copy: {overlay_blend}")
    print(f"Transparent WebP output: {output_dir / 'frame_0001.webp'} … frame_{scene.frame_end:04d}.webp")
    print(f"Frame range: {scene.frame_start}–{scene.frame_end} at {scene.render.fps} FPS")


if __name__ == "__main__":
    configure_overlay_render()
