# Scene v6 — photographic material and water restoration

## Deliverables

| File | Native/output dimensions | Format | Export | Bytes |
| --- | --- | --- | --- | --- |
| `assets/scene/day-v6.jpg` | 1536 × 1024 | RGB JPEG | sips quality 97, no resizing | 1,013,898 |
| `assets/scene/night-v6.jpg` | 1536 × 1024 | RGB JPEG | sips quality 97, no resizing | 892,068 |

The day prompt requested a genuine 3072 × 2048 render if supported. The built-in tool returned 1536 × 1024. No upscaling, sharpening filter, image compositing or pixel editing was performed after generation. These assets improve material rendering and water detail at the existing native resolution; they are not higher-resolution originals.

## Sources and generation method

Built-in `image_gen.imagegen`, following the built-in imagegen skill. One daytime style-transfer edit and one nighttime relighting edit were made. Image targets and results were inspected with `view_image`. Read-only Pillow analysis checked dimensions and sampled edge alignment; sips performed format conversion only.

Day edit target:
`assets/scene/day-v5.jpg`

Approved day master:
`day-v6 master (not bundled)`

Night input 1, exact geometry/material target:
`day-v6 master (not bundled)`

Night input 2, lighting reference only:
`assets/scene/night-v5.jpg`

Night master:
`night-v6 master (not bundled)`

Original generated PNG masters and v5 assets remain untouched. Only these new v6 JPEG assets and this note were written within the staged project. No application code or sprite assets were changed.

## Visual review and limits

The v6 day has finer, more natural small wavelets and broken reflections, less glossy plaster and timber, and clearer recessed architectural ornament. The approved night retains these material and water changes with deep navy ambient light and restrained amber illumination. The source water patch at normalized x 0.36–0.72 and y 0.925–0.995 contains clean ripples with no floating blossoms or objects. Extreme foreground flower blur remains intentional.

The existing pink trumpet species, broad ruffled forms, colors and cluster placements appear preserved, as do the right Angsana, both bird's-nest ferns, hydrangea, existing green potted plants, three shophouses and skyline. No new loose water flowers or animals were found. The existing pots acquired more explicit blue floral glaze decoration in the day edit. This was disclosed and accepted by the parent reviewer; pot shapes and locations remain unchanged. That is a visible material-detail change, not exact pixel preservation.

Independent visual QA found a meaningful improvement beyond contrast and no additional concrete blocker. This remains generated imagery; photographic realism and perceived sharpness are visual assessments, not a claim that the scene is a real photograph.

## Alignment checks

Read-only grayscale edge-patch comparison searched integer shifts from −6 to +6 pixels around 13 landmarks. This is a local alignment sample, not proof of pixel identity. Relighting and redrawn fine textures affect correlation.

v5 day → v6 day:
- 9 of 13 sampled anchors had best match at (0, 0).
- Blue opening top/bottom and blue arch had best match at (0, +1).
- Inward fern had best match at (+1, 0).
- Pink door handle, café chair, pot base, shoreline stone seam, both sampled pink blooms and hydrangea remained at (0, 0).

v6 day → v6 night:
- Green shutter corner: (+1, +1).
- Green lower frame, blue opening top/bottom, pink door handle and café chair: (+1, 0).
- Tan Hua pot base: (0, −1).
- Blue arch, shoreline seam, both sampled pink blooms, hydrangea and inward fern: (0, 0).

All sampled best-match displacements were at most one pixel per axis. Day/night are closely aligned, not guaranteed pixel identical; fine water texture and illumination naturally differ.

## Exact day prompt

```text
Use case: style-transfer with strict geometric preservation. Edit the supplied1536x1024 DAY hero into a genuinely PHOTOREALISTIC architectural photograph, with markedly clearer shophouse materials and water. The supplied image is the EXACT scene, camera, composition, object-position and botanical target. Produce3072x2048native detail if supported, keeping the identical3:2framing and exact2xlogical coordinates; if that size is unavailable, keep1536x1024and improve real fine detail without merely upscaling. Treat this as the real place photographed with a high-quality full-frame camera on a tripod, carefully focused on the shophouses and near water, atf/8with a fast exposure freezing the small ripples. Replace the current polished plastic-CG/soft illustration material rendering with believable physical surfaces: fine matte lime-plaster grain with subtle microvariation, clean sharply resolved carved stucco edges and tiny recess shadows, glazed ceramic tiles with real glaze reflections and visible fine grout joints, restrained glaze crazing, painted timber with delicate wood grain and natural paint texture, individually resolved thin shutter slats and lattice openings, realistic metal/cane cafe furniture, leaf veins and bark. These are MICROTEXTURE changes only, never weather/damage/remodel the architecture or change ornament patterns. Restore material separation and small-scale detail rather than boosting contrast or adding fake sharpening halos. Water is a PRIMARY focus: render physically credible sharply captured small capillary wavelets and tiny ripples at varied scales, with delicate broken reflections of the same facades, restrained sun glints and natural transparent teal water. Preserve the bank contour, broad reflection locations and perspective, but replace smeared/oily broad white ribbon strokes with finely resolved photographic water texture. Do not add foam, splashes, objects, flowers or debris. Keep natural tropical daytime light, subtle realistic exposure and current color identities; no artificial golden filter, bloom, airbrushed surfaces, painterly strokes, plastic sheen, HDR halos or cartoon outlines. ABSOLUTE CONTENT LOCK: preserve every house/window/shutter/door/roof/column/cafe/pot/shoreline position; all three original shophouses including current red/green/white trim; one skyscraper plus two HDB blocks; right yellow Angsana blooms and exactly two bird's nest ferns; blue/lavender hydrangea in the same ceramic pot; existing green-only plants near the pink door. Most importantly preserve the CURRENT PINK RUFFLED TRUMPET FLOWERS EXACTLY: same species, pale pink-lilac colors and cream throats, broad rounded crinkled papery funnel forms, front/side silhouettes, cluster sizes and positions throughout upper-left/lower-left and existing near-foreground pink blur. No pink-flower redesign, no pointed-star reversion, no increased flower count. Retain intentional very-near-foreground defocus; the buildings and water must be sharply resolved. No new architectural details or objects, no animals/otters/people, no Tan Hua buds/blooms, no loose water flowers, no signs/text/UI. Same scene and same geometry, materially more photographic and finely detailed.
```

## Exact night prompt

```text
Use case: lighting-weather. Asset: aligned night counterpart of the approved photographic website hero.

Input image 1 is the approved DAY v6 image and is the EXACT edit target for geometry, botany, materials, detail and framing. Input image 2 is the previous NIGHT v5 and is ONLY a guide for the deep navy ambient sky, lit windows and warm amber illumination. Do not copy its softer CG rendering or its coarse water reflection strokes.

Change only the lighting of image 1 to a believable nighttime photograph. Keep the exact same 1536×1024 canvas and 3:2 crop; no scaling, recentering, zoom, re-layout or camera change. Preserve every architectural edge, window/shutter/slat/lattice opening, door, tile pattern, cornice, pot shape and glaze detail, café furniture, bank stone and shoreline position. Preserve the exact silhouette and position of every leaf and flower cluster. All geometry and botanical pixels must remain as closely aligned to image 1 as possible for an interactive day/night crossfade.

Retain image 1's photographic material quality: crisp clean carved-stucco recesses and fine edges, restrained lime-plaster grain, tile glaze and fine grout, painted wood grain and resolved thin shutter slats, natural bark and leaf detail. Avoid softened illustration, oil-painted smears, plastic surfaces, halos or fake oversharpening.

Relight with a natural deep navy sky, subdued cool blue ambient light and restrained warm amber light through the EXISTING windows, café and existing street lamps. Maintain visible fine material texture in shadow. No purple cast. No excessive bloom or washed-out luminous edges. Reflection colors should respond to these same existing lights. The water must retain image 1's fine, sharply resolved small wavelets and delicate broken reflections, changing only their illumination; do not return to the broad glowing ribbon strokes in image 2. Keep clean ripple-only water at normalized x0.36–0.72 and y0.925–0.995. Do not put anything on the water.

Absolute content lock to image 1: all three existing shophouses including the red/green/white façade; one skyscraper and two HDB blocks; pale pink-lilac ruffled trumpet flowers with broad rounded papery corollas, cream throats, front and side silhouettes in the exact current places; right yellow Angsana flower sprays; exactly two bird's nest ferns; blue/lavender hydrangea in the existing ceramic pot; existing green-only potted plants by the pink door. Preserve the intentional extreme foreground blur while keeping buildings and water sharply photographed. No animals, otters, people, silhouettes in windows, new objects, extra pots, extra blossoms, Tan Hua buds/blooms, loose water flowers, text, signs, UI or added light fixtures. One aligned NIGHT image only.
```

## Conversion commands

The source filenames below stand for the original generated PNG masters, which are not bundled.

```sh
sips -s format jpeg -s formatOptions 97 'day-v6-master.png' --out 'assets/scene/day-v6.jpg'
sips -s format jpeg -s formatOptions 97 'night-v6-master.png' --out 'assets/scene/night-v6.jpg'
```
