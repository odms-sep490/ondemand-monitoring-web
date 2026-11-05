import bpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OVERLAY_BLEND = ROOT / 'cinematic-drone-industrial-overlay-v5.blend'
FRAME_DIR = ROOT / 'overlay-frames-industrial'

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
try:
    frames_text = args[args.index('--frames') + 1]
except (ValueError, IndexError):
    frames_text = '1-384'

frames = []
for part in frames_text.split(','):
    if '-' in part:
        start, end = [int(value) for value in part.split('-', 1)]
        frames.extend(range(start, end + 1))
    else:
        frames.append(int(part))

scene = bpy.context.scene
if bpy.data.filepath != str(OVERLAY_BLEND):
    raise RuntimeError(f'Open the prepared overlay scene first: {OVERLAY_BLEND}')
if scene.frame_end != 384 or scene.render.fps != 24:
    raise RuntimeError('The prepared scene no longer matches the 384-frame web sequence')

FRAME_DIR.mkdir(parents=True, exist_ok=True)
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.quality = 82
scene.render.film_transparent = True

for frame in frames:
    if not scene.frame_start <= frame <= scene.frame_end:
        raise ValueError(f'Frame {frame} is outside the website sequence')
    scene.frame_set(frame)
    scene.render.filepath = str(FRAME_DIR / f'frame_{frame:04d}')
    bpy.ops.render.render(write_still=True)
    print(f'Rendered {frame:04d}: {FRAME_DIR / f"frame_{frame:04d}.webp"}')
