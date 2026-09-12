# Scene artwork v2

## Deliverables

- `day-v2.jpg`: 1536 × 1024, RGB JPEG, quality 88, 839,963 bytes.
- `night-v2.jpg`: 1536 × 1024, RGB JPEG, quality 88, 792,429 bytes.
- The prior `day.jpg` and `night.jpg` remain unchanged.

## Final changes

- Existing canopy, vine, and foreground flowers use detailed pale blush trumpet forms with funnel throats and irregular translucent petals.
- The small flowering plant immediately right of the blue café is a compact pale pink/lilac hydrangea in its existing ceramic pot.
- The left shophouse retains its red, green, and white scheme with clean red trim borders. Floral mosaic colors and the terracotta roof remain.
- Both scenes retain three shophouses, one skyscraper, two HDB blocks, clear water, the main green-only Tan Hua plant, and the existing scene composition. The night scene retains navy ambient light and warm amber practical lights.
- No characters, loose flowers, additional pots, or interface elements are baked into these images.

## Sources and generation

Built-in `image_gen.imagegen` was used for all artwork edits. macOS `sips` converted the final PNGs to JPEG quality 88 without resizing or cropping.

Canonical inputs:

- `assets/scene/day.jpg`
- `assets/scene/night.jpg`
- Botanical reference: `user-provided shophouse and botanical reference (not bundled)`

Final generated masters:

- Day: `day-v2 master (not bundled)`
- Night: `night-v2 master (not bundled)`

Prompt set: precisely refine only the existing attached blossoms into natural pale blush trumpet flowers; replace only the café-side potted flowering plant with a compact hydrangea while retaining its ceramic pot; tidy and preserve the original red/green/white left façade. Preserve the full 1536 × 1024 canvas, architecture, camera, skyline, waterbank, window/pot positions and other plants. Use the corrected day artwork to match night botany and trim, retaining original navy/amber night lighting. Exclude animals, characters, new pots, loose flowers and interface elements.

## Verification and limits

The final JPEGs were inspected visually. Their principal architectural positions appear preserved. A small local edge-correlation check compared five 40 × 40 patches at the green lower column, pink door handle, blue upper arch, café transom and main pot base. Original day → day-v2 had a best-match displacement of (0, 0) at all five anchors. Day-v2 → night-v2 had (0, 0) at four anchors and (0, 1) at the green lower column. Search radius was ±6 pixels.

This checks sampled anchors, not every pixel. Generative edits introduce local texture and flower-shape differences; pixel identity is not claimed. The hydrangea and flower silhouettes intentionally changed.

Date: 2026-09-12.

## Closed green shutters

`green-shutters-closed.jpg` is a 212 × 170 crop from a built-in image-generation edit of the existing day scene. Final prompt: preserve the full original scene, camera, architecture, facade colours, red trim and surrounding detail; close only the four upstairs green louvred shutters, with natural painted wood detail and correct perspective. The generated master is `closed green-shutter master (not bundled)`. Crop origin (434,267) aligns with the source artwork. The runtime clips this patch to the upstairs windows and darkens it with the environmental night setting.

The flower breakup reuses five clipped regions of `trumpet-flower-v2.png` during canvas drawing, preserving the original photographic petal texture. No separate artificial particle artwork is used.
