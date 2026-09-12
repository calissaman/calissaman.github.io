# Scene artwork v3

## Deliverables

- `day-v3.jpg`: 1536 × 1024 RGB JPEG, quality 88, 837,386 bytes.
- `night-v3.jpg`: 1536 × 1024 RGB JPEG, quality 88, 760,704 bytes.
- Output directory: `assets/scene`.
- Earlier scene assets remain unchanged. No HTML, CSS, JavaScript, or browser changes were made.

## Changes and verification

Only the attached trumpet blossoms were botanically revised: broad rounded papery lobes fused into a funnel, fine crinkles, cream/yellow throats, dusty pink-lilac color, and varied front/side/three-quarter views in branch clusters. The hydrangea, green-only Tan Hua, architecture, red/green/white façade, skyline and clear water remain.

The generated masters were visually inspected. The flower design follows the new botanical photographs rather than the pointed forms in the scene composition reference. No text, characters, otters, or loose water flowers are baked into these images.

A local edge-correlation check used seven 40 × 40 patches and a ±6 px search radius. Results are best-match (x, y) offsets, not proof of pixel identity:

| Anchor | Day v2 → v3 | Night v2 → v3 | Day v3 → night v3 |
| --- | --- | --- | --- |
| Green lower column | (0, 0) | (0, 0) | (0, 0) |
| Pink door handle | (0, 0) | (0, 0) | (0, 0) |
| Blue upper arch | (0, 0) | (0, 0) | (0, 0) |
| Café transom | (0, 0) | (0, 0) | (0, 0) |
| Main pot base | (0, 0) | (0, -1) | (0, 0) |
| Hydrangea pot | (0, 0) | (0, 0) | (0, 0) |
| Skyscraper | (0, 0) | (0, 0) | (1, 1) |

The day/night skyscraper patch had lower edge correlation (0.467), partly reflecting different lighting. Local generated texture and blossom detail differ; full pixel identity is not claimed. No global translation or crop was applied.

## Method and sources

Artwork edits used built-in `image_gen.imagegen`. No CLI/API image generation was used. Final masters were converted with macOS `sips -s format jpeg -s formatOptions 88`, with no resizing or cropping.

Canonical edit targets:

- `assets/scene/day-v2.jpg`
- `assets/scene/night-v2.jpg`

Botanical photo inputs used for the day generation:

- `user-provided trumpet-flower photograph 1 (not bundled)`
- `user-provided trumpet-flower photograph 2 (not bundled)`
- `user-provided trumpet-flower photograph 3 (not bundled)`

Additional references inspected:

- `user-provided scene reference 1 (not bundled)`
- `user-provided scene reference 2 (not bundled)`
- `user-provided scene composition reference (not bundled)` (composition only, not flower-shape reference).

Generated originals retained:

- Day: `day-v3 master (not bundled)`
- Night: `night-v3 master (not bundled)`

## Final day prompt

Use case: precise-object-edit. IMAGE1 is the exact1536x1024 DAYTIME scene edit target. Images2–4 are REAL BOTANICAL PHOTO REFERENCES for the flowers. Change ONLY the attached trumpet-tree blossoms already present in both framing trees, the canopy, edge vines and foreground corner foliage. Replace the current small pointed/splayed flowers with faithfully photographed Tabebuia rosea-style trumpet blossoms as shown in references: FIVE BROAD ROUNDED, slightly unequal, crinkled papery lobes MERGED INTO ONE CONTINUOUS FUNNEL COROLLA; a creamy pale-yellow throat; fine folded veining and softly rumpled scalloped petal rims. These are NOT separate pointed petals, stars, sakura or flat cherry/plum flowers. From the side a real curved tubular trumpet neck is visible; mix front-facing flower mouths, side-facing tubes, and three-quarter views. The color is subdued dusty pale pink-lilac with delicate warm cream throats, not bright magenta. Match references2–4 closely in shape, texture, translucency and botanically natural clustered growth. Render small loose clusters nestled among existing leaves at existing blossom locations: multiple little corollas facing different directions, not giant individual blooms or oversized bouquets. Keep the flower masses inside the existing canopy/foreground plant footprint and retain all original tree branches, trunk, foliage arrangement and open sky. Preserve EXACTLY all other imagery from IMAGE1: entire1536x1024canvas, camera/perspective, three facades, original red/green/white trim, doors/windows/shutters and their pixel positions, cafe furniture, hydrangea in original cafe-side pot, main Tan Hua green-only plant, all other pots, waterbank, clear water, one skyscraper and two HDB blocks, and daytime lighting. Do not touch the hydrangea blossoms. No extra plants/pots. NO loose/floating/falling flowers on water or ground, no otters/animals/characters, no text/UI. The only requested edit is realistic botanical correction of the existing attached trumpet flowers.

## Final night prompt

Use case: precise-object-edit. IMAGE1 is the exact1536x1024 NIGHT scene edit target. IMAGE2 is the corrected1536x1024 DAY scene whose botanical arrangement must be matched. Change ONLY image1's attached flowers on the LEFT and RIGHT framing trees/canopy/edge vines and foreground corner foliage to MATCH image2 exactly in flower positions, cluster sizes, silhouettes and orientation: dusty pale pink-lilac Tabebuia rosea trumpet blossoms, five BROAD ROUNDED unequal crinkled papery lobes fused into a continuous funnel corolla, cream/yellow throats, fine rumpled veining, loose clusters of front/side/three-quarter views, with tubular necks visible in side view. No pointed stars, no narrow separate petals, no flat sakura. Keep flowers natural and small within their existing foliage footprint; copy image2's botanical shapes precisely for day/night crossfade. Retain IMAGE1's original deep NAVY NIGHT SKY, low cool ambient light and warm AMBER windows/cafe/streetlamps/reflections. Illuminate new flowers naturally with image1's night lighting, no purple cast or neon saturation. Apart from the attached trumpet blossoms, preserve all image1 pixels as closely as possible: EXACT1536x1024 canvas and camera/perspective, all three buildings, red/green/white trim, ornate tilework, window/door/shutter geometry and positions, hydrangea flowers and plant in the cafe-side ceramic pot, main Tan Hua green-only plant, other plants/pots, furniture, waterbank, clean water, one skyscraper and two HDB blocks, tree trunks and all foliage arrangements. No composition changes, no new plants/pots, no animals/characters/otters, no loose/floating/falling flowers anywhere, no text/UI. One controlled matching botanical edit to the NIGHT scene only.

Date: 2026-09-12.
