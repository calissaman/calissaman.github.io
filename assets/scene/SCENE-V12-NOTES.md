# Scene v12 and café dinner

The day and night masters are exact copies of the user's sharpened 1536 × 1024 PNGs supplied on 2026-09-13.

- `day-v12.png`: `codex-clipboard-acf8a437-e41f-4bda-8ce6-34da05e5c0ff.png`, SHA-256 `2ce5cd9463e806919d68a29f5f6821a4d822ecaeac40161e5d05fb813986664a`.
- `night-v12.png`: `codex-clipboard-95fb0717-25f0-455a-afc9-064722d9fb0d.png`, SHA-256 `f590a5bcdc04e9672d9a16a1a8cb55152a30a83954c5593f9799313b85a6a4a4`.

Do not regenerate the architecture when editing props. Existing local street masks still remove the railings and follow the 17:30–04:00 lamp schedule.

## Dinner artwork

The two dinner patches use the user's ruby cocktail, yellow/teal highball, and Peranakan meal references. The arrangement has a shallow rattan tray, small ceramic dishes, and two tea lights. The table, chairs, and camera angle determine the object scale.

Generated with the imagegen tool. JPEG exports at quality 95:

- `dinner-day-patch.jpg` from `exec-e62d9e49-c47e-422a-be99-8509f5b3adc3.png`.
- `dinner-night-patch.jpg` from `exec-481ce32d-9193-43a4-9218-f797a5740aaa.png`.

The renderer crops only x=1008, y=662, width=160, height=56 from these aligned source images. Generated pixels outside this rectangle never enter the scene. A 3-pixel edge feather blends the surrounding background; the drinks and dishes remain fully opaque.

Dinner appears from 18:00 to 06:00. Scene lighting selects a single day-lit or night-lit patch, with no crossfade that could double the glassware. Morning coffee and steam keep their existing 06:00–12:00 schedule. The table is empty from 12:00 to 18:00.

The café light control selects a darkened day patch at night. Its RGB multipliers, 0.22, 0.29, and 0.37, match the café's existing renderer lighting. Object alpha stays at one.

## Day generation prompt

LOCAL TABLETOP EDIT to IMAGE 1. Return the same full 1536x1024 image with identical composition, camera, architecture, object positions and lighting. Modify ONLY the small FRONT cafe tabletop in the open blue shophouse, around x1008–1175,y660–723. All other pixels unchanged. IMAGE 2 is a FOOD/DRINK DESIGN reference, NOT a background: absolutely do not copy its checkerboard.

Set the table for two, fitted naturally to this exact tiny tabletop:
- Left, a short modest ruby-red rocks cocktail with pale foam, a delicate SMALL red lace garnish and thin pick, inspired by the left drink in image2.
- Right, one slender highball with a subtle teal base and pale yellow pineapple drink, light foam and SMALL dried pineapple garnish, inspired by the right drink.
- A shallow rattan tray between them, containing a small rice bowl and three small blue-and-white glazed ceramic dishes with curry, braised meat and prawns.
- Two tiny ivory tea lights toward the back center, with small warm flames.
Use REALISTIC RESTAURANT SCALE. The actual scene's table is about 170 image-pixels wide. The food setting must stay between x1020 and x1155; highest garnish about y679; all bases REST naturally on the existing table at y712–717. Glass widths about 12–17 image pixels, tallest highball about 30–35 pixels including garnish. Tray about 75 pixels wide and only 10–14 pixels deep in this low-camera perspective. Bowls small. Do not enlarge or move the table, chairs, table legs, nearby plants or architecture. Keep the tabletop front edge visible. No oversized goblets, stems or neon colors.

Crucial: correctly match the scene's LOW viewpoint, foreshortening and warm cafe illumination. Objects must sit IN the scene with subtle occlusion and contact shadows on the actual wood, never hover like a sticker. Fine credible material details, opaque food and liquids, thick glass contours with restrained highlights. Day version: same daytime scene and warmly lit cafe as image1; retain its existing interior light and daytime exposure exactly.

Preserve ALL existing artwork beyond this tiny table area. No changes to facades, windows, trim, tile patterns, skyline, trees, pink flowers, water, pots, railings, lamps, furniture or image sharpness. Do not add labels, text, UI, people or animals. Return one full aligned opaque scene image; NOT a transparent cutout, no checkerboard. This output will be used ONLY as a small masked tabletop patch, so preserve the original background around the objects exactly.

## Night generation prompt

LOCAL TABLETOP EDIT to IMAGE 1. Return the same full 1536x1024 image with identical composition, camera, architecture, object positions and lighting. Modify ONLY the small FRONT cafe tabletop in the open blue shophouse, around x1008–1175,y660–723. All other pixels unchanged. IMAGE 2 is a FOOD/DRINK DESIGN reference, NOT a background: absolutely do not copy its checkerboard.

Set the table for two, fitted naturally to this exact tiny tabletop:
- Left, a short modest ruby-red rocks cocktail with pale foam, a delicate SMALL red lace garnish and thin pick, inspired by the left drink in image2.
- Right, one slender highball with a subtle teal base and pale yellow pineapple drink, light foam and SMALL dried pineapple garnish, inspired by the right drink.
- A shallow rattan tray between them, containing a small rice bowl and three small blue-and-white glazed ceramic dishes with curry, braised meat and prawns.
- Two tiny ivory tea lights toward the back center, with small warm flames.
Use REALISTIC RESTAURANT SCALE. The actual scene's table is about 170 image-pixels wide. The food setting must stay between x1020 and x1155; highest garnish about y679; all bases REST naturally on the existing table at y712–717. Glass widths about 12–17 image pixels, tallest highball about 30–35 pixels including garnish. Tray about 75 pixels wide and only 10–14 pixels deep in this low-camera perspective. Bowls small. Do not enlarge or move the table, chairs, table legs, nearby plants or architecture. Keep the tabletop front edge visible. No oversized goblets, stems or neon colors.

Crucial: correctly match the scene's LOW viewpoint, foreshortening and warm cafe illumination. Objects must sit IN the scene with subtle occlusion and contact shadows on the actual wood, never hover like a sticker. Fine credible material details, opaque food and liquids, thick glass contours with restrained highlights. Night version: same deep navy surroundings and warm amber cafe light as image1, naturally subdued red and yellow cocktails; no glowing turquoise liquid or blown-out highlights.

Preserve ALL existing artwork beyond this tiny table area. No changes to facades, windows, trim, tile patterns, skyline, trees, pink flowers, water, pots, railings, lamps, furniture or image sharpness. Do not add labels, text, UI, people or animals. Return one full aligned opaque scene image; NOT a transparent cutout, no checkerboard. This output will be used ONLY as a small masked tabletop patch, so preserve the original background around the objects exactly.
