"""Render the extended Blender scene to JPEG intermediates for review export."""

from pathlib import Path
import bpy


PROJECT_ROOT = Path(r"C:\Users\ACER\Documents\GitHub\doan\ondemand-monitoring-web")
ASSET_ROOT = PROJECT_ROOT / "assets" / "cinematic-drone"
RENDER_ROOT = ASSET_ROOT / "render-source"
RENDER_ROOT.mkdir(parents=True, exist_ok=True)

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 384
scene.render.fps = 24
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.quality = 88
scene.render.filepath = str(RENDER_ROOT / "frame_")
scene.frame_set(1)
bpy.ops.render.render(animation=True)

scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(PROJECT_ROOT / "public" / "assets" / "cinematic-drone" / "preview_")
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(ASSET_ROOT / "cinematic-drone-long.blend"))
print("RENDER_EXPORT_COMPLETE", len(list(RENDER_ROOT.glob("frame_*.jpg"))))
