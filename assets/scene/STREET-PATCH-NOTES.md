# Street railings and lamp schedule

The v11 day/night photographs remain the visual masters. The two street patch
images are generated source material, not replacement backgrounds.

At startup, street-scene.js composites only the railings, lamp heads and local
nighttime lamp reflections. A hard clip at x=400 keeps all three shophouses
outside the editable region. The original architecture pixels remain unchanged.
Lit variants retain the original lamp glow and remove only the railings.
Unlit variants replace the lamp region and its nighttime reflection.

Street lamps illuminate from 17:30 inclusive until 04:00 exclusive, according
to the time selected in the scene, independently of the day/night blend.
WebGL textures change only when that schedule state changes. The image and
Canvas water fallback select the same variants.

Generated with the built-in image tool at 1536×1024. Exports use JPEG quality 97;
no source resizing or sharpening. Prompts requested removal of the short black
railings at x145–326/y693–743, replacement with low plants and continuous paving,
and unlit street lanterns with no glow or local golden reflection. All other
scene content was requested unchanged. Runtime masking, rather than the prompt,
enforces architectural preservation.

Masters:
- Day: exec-b64199ad-87f4-4bb5-93e5-407d99fb97c0.png
- Night: exec-65f36545-79a3-410b-b77b-bcc96eeb29ed.png

Checks: live preview at noon, 03:59, 04:00, 17:29, 17:30, and 22:00;
regression checks cover schedule boundaries and both GPU texture transitions.
