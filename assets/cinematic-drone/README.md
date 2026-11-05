# Living Mission Scroll Video

The landing page uses a sixteen-second background video across all sixteen story scenes. It uses unique chapter photos, gentle camera motion, and short crossfades. ScrollTrigger seeks the video across the full journey in both directions; it never autoplays and contains no audio.

Desktop and mobile load separate 16:9 and 9:16 background videos. The page loads only the version matching the viewport. Reduced-motion mode keeps the still photo and route treatment without loading the video.

The visible landing drone is the supplied Lottie animation at `src/features/landing/assets/drone-animation.json` (the same file as the attached `Drone.json`). React renders it over the background video and moves it along the flight path as the user scrolls. The industrial Blender model and its transparent frames remain available as alternate assets; they are no longer baked into the landing video. The photos are illustrative, not mission footage or telemetry. Stock image credits and licenses are listed in `public/images/landing/credits.json`.

## Files

- `cinematic-drone-long.blend` — editable sixteen-second scene with the six-rotor aircraft, extended flight path, camera rail, lights, and launch set.
- `cinematic-drone-long-overlay.blend` — render profile copy with the set hidden and transparent output enabled.
- `cinematic-drone-industrial.blend` — alternate detailed industrial drone model and its Blender source scene.
- `cinematic-drone-industrial-overlay-v5.blend` — alternate v5 transparent overlay scene using the industrial model.
- `build_industrial_landing_overlay.py` — transfers the industrial model into a copy of the web overlay scene and can render selected frames.
- `render_industrial_overlay_frames.py` — renders selected frame ranges from the prepared v5 overlay scene.
- `overlay-frames-industrial/frame_0001.webp` through `frame_0384.webp` — v5 RGBA WebP frames at 960×540 and 24 FPS.
- `configure_overlay_render.py` — configures and saves the overlay profile copy from the original scene.
- `compose_living_mission.ps1` — composites the transparent Blender frames with all sixteen chapter photos and writes both videos and their posters.
- `compose_living_mission_industrial_v5.ps1` — writes the active background-only desktop/mobile composites with short GOPs for scroll seeking.
- `preview.mp4` — standalone reference preview; it is not used by the landing page.
- `overlay-frames/frame_0001.webp` through `frame_0384.webp` — 384 RGBA WebP source frames at 960×540 and 24 FPS.
- `../../public/assets/cinematic-drone/living-mission.mp4` — 1280×720 desktop composite.
- `../../public/assets/cinematic-drone/living-mission-mobile.mp4` — 720×1280 mobile composite.
- `../../public/assets/cinematic-drone/living-mission-industrial-v5.mp4` and `living-mission-mobile-industrial-v5.mp4` — active background-only landing videos; React layers the Lottie drone above them.
- `../../public/assets/cinematic-drone/living-mission-industrial-v5-poster.webp` and `living-mission-mobile-industrial-v5-poster.webp` — matching poster images.
- `create_scene.py` — rebuilds the Blender scene.
- `render_export.py` — legacy opaque JPEG render export for the standalone preview.

The browser seeks the selected video at up to 24 FPS, with a short keyframe interval for responsive seeking. The video is synchronized to the entire landing journey and remains paused while its current frame is updated.

## Regenerate the scroll videos

1. Run `create_scene.py` with Blender 5.2 to rebuild `cinematic-drone-long.blend`.
2. Run `configure_overlay_render.py` with the long scene open. It hides the launch set from render, enables transparent RGBA WebP output, saves `cinematic-drone-long-overlay.blend`, and targets `overlay-frames/`.
3. Render the animation from frame 1 through 384 at 24 FPS.
4. Run `compose_living_mission.ps1` from the web project with FFmpeg available on `PATH` to rebuild the desktop and mobile videos and posters.

To rebuild the active background videos, run `compose_living_mission_industrial_v5.ps1` with FFmpeg available on `PATH`. The Drone.json animation is loaded by `FlightMissionExperience.tsx` and remains synchronized with scroll progress. The industrial Blender overlay pipeline is available for alternate renders.

## Change backgrounds

The chapter photo choices live in `copyByLanguage` in `src/features/landing/showcase/FlightMissionExperience.tsx`; the video compositor uses the same sixteen photos in the same order. Update both when changing chapter imagery, retain the attribution and license in `public/images/landing/credits.json`, and keep the construction photo's visible credit matched to the selected image.

## Adjust the flight

- Edit `CAMERA | living mission` and its `Orbit and dolly along Bezier rail` constraint for the rendered camera move.
- Edit `CAMERA RAIL | takeoff orbit` to reframe the aircraft.
- Edit `Camera aim | lags into transition` to change the aircraft's framing.
- Edit `FLIGHT PATH | takeoff and mission departure` for the aircraft route; rotor spindles have their own rotation keys.
- After a change, regenerate the transparent frames and run `compose_living_mission.ps1` so the scroll videos include the updated flight.
