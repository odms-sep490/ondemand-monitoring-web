import bpy
import re
import sys
from pathlib import Path
from mathutils import Matrix

ROOT = Path(__file__).resolve().parent
TARGET_BLEND = ROOT / 'cinematic-drone-long-overlay.blend'
SOURCE_BLEND = ROOT / 'cinematic-drone-industrial.blend'
OUTPUT_BLEND = ROOT / 'cinematic-drone-industrial-overlay-v5.blend'
FRAME_DIR = ROOT / 'overlay-frames-industrial'

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg_value(flag, default=None):
    try:
        return args[args.index(flag) + 1]
    except (ValueError, IndexError):
        return default

frames_text = arg_value('--frames', '1,192,384')
frames = []
for part in frames_text.split(','):
    if '-' in part:
        start, end = [int(x) for x in part.split('-', 1)]
        frames.extend(range(start, end + 1))
    else:
        frames.append(int(part))

scene = bpy.context.scene
if bpy.data.filepath != str(TARGET_BLEND):
    raise RuntimeError(f'Open the expected long overlay scene first: {TARGET_BLEND}')
if scene.frame_end != 384 or scene.render.fps != 24:
    raise RuntimeError(f'Unexpected source sequence timing: {scene.frame_end} frames at {scene.render.fps} fps')

old_root = bpy.data.objects.get('Drone | animated airframe')
if old_root is None:
    raise RuntimeError('Could not find the long-sequence drone root')

with bpy.data.libraries.load(str(SOURCE_BLEND), link=False) as (source, destination):
    required = {'ODM | Industrial Detailing', '01 | Drone airframe.002'}
    missing = required.difference(source.collections)
    if missing:
        raise RuntimeError(f'Missing source collections: {sorted(missing)}')
    destination.collections = sorted(required)

appended = {collection.name: collection for collection in destination.collections if collection}
source_detail = appended.get('ODM | Industrial Detailing')
source_airframe = appended.get('01 | Drone airframe.002')
if not source_detail or not source_airframe:
    raise RuntimeError('Blender could not append the industrial drone collections')

imported_airframe_objects = list(source_airframe.objects)
replaced = []
missing_base = []
for source_object in imported_airframe_objects:
    if source_object.type not in {'MESH', 'CURVE', 'FONT', 'SURFACE', 'META'} or source_object.data is None:
        continue
    if source_object.name.startswith('FLIGHT PATH |'):
        continue

    original_name = re.sub(r'\.\d{3}$', '', source_object.name)
    target_object = bpy.data.objects.get(original_name)
    if target_object is None or target_object.type != source_object.type:
        missing_base.append(original_name)
        continue

    target_object.data = source_object.data.copy()
    replaced.append(original_name)

if len(replaced) < 30:
    raise RuntimeError(f'Only replaced {len(replaced)} existing model objects; refusing to render')

scene.collection.children.link(source_detail)
source_detail.hide_render = False
source_detail.hide_viewport = False

added = 0
for detail_object in list(source_detail.objects):
    if detail_object.type == 'EMPTY' and detail_object.name.startswith('Drone | animated airframe'):
        continue
    if detail_object.type == 'CURVE' and detail_object.name.startswith('FLIGHT PATH'):
        continue
    local_basis = detail_object.matrix_basis.copy()
    detail_object.parent = old_root
    detail_object.matrix_parent_inverse = Matrix.Identity(4)
    detail_object.matrix_basis = local_basis
    added += 1

# The appended airframe collection has its own animated root and flight path.
# Keep the 384-frame website root/camera animation and use only its model data.
for imported_object in imported_airframe_objects:
    bpy.data.objects.remove(imported_object, do_unlink=True)
bpy.data.collections.remove(source_airframe)

FRAME_DIR.mkdir(parents=True, exist_ok=True)
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.quality = 82
scene.render.film_transparent = True
scene.render.filepath = str(FRAME_DIR / 'frame_')
scene.frame_set(1)

bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
print(f'Industrial drone geometry replaced on {len(replaced)} website model objects; added {added} detailing objects.')
print(f'Unmatched model objects: {missing_base}')
print(f'Overlay file: {OUTPUT_BLEND}')
print(f'Rendering frames: {frames}')
for frame in frames:
    if not scene.frame_start <= frame <= scene.frame_end:
        raise ValueError(f'Frame {frame} is outside the website sequence')
    scene.frame_set(frame)
    scene.render.filepath = str(FRAME_DIR / f'frame_{frame:04d}')
    bpy.ops.render.render(write_still=True)
    print(f'Rendered {frame:04d}: {FRAME_DIR / f"frame_{frame:04d}.webp"}')
