# Scene v11: restored architectural detail

## Assets and method

- `assets/scene/day-v11.jpg`
- `assets/scene/night-v11.jpg`

Built-in image_gen edited each v10 background, with its v6 counterpart and the user's reference as architectural sharpness guides. Both outputs are native 1536 × 1024. The prompt requested 3072 × 2048 if supported, but that size was not returned. The originals were exported to JPEG at quality 97 using sips, without resizing or post-generation sharpening.

V10 fixes the composition, plants, geometry and empty tabletop. The restoration recovers individual shutter slats, lattice apertures, ceramic ornament, cornice edges and furniture detail. The old v10 assets remain available.

## Verification

Independent visual review found clearer architecture without material changes to plant silhouettes, the upper-crown-only Angsana blooms, grass, hydrangea, empty table or window positions. Thirteen sampled alignment landmarks differ by at most one source pixel per axis. This is sampled alignment, not pixel identity.

Read-only mean absolute Laplacian over the same facade crop (x410–1220, y180–730) supports the visual improvement:

| Artwork | v6    | v10   | v11 master |
| ------- | ----- | ----- | ---------- |
| Day     | 32.74 | 17.15 | 32.28      |
| Night   | 23.06 | 12.27 | 23.88      |

This metric describes fine edge content, not resolution or photographic authenticity. Both masters remain 1536 × 1024; this change restores fine detail rather than enlarging the source.

The browser now permits device-pixel ratio 3 on phones within the existing six-million-pixel budget. Adaptive rendering and its recovery behavior remain intact.

## Exact day prompt

Precise architectural detail restoration for an existing interactive website background.
Image 1 is the CURRENT artwork and is the exact composition, geometry, botany, color and object-position target. Preserve its entire 3:2 frame. Image 2 is an earlier version whose SHARPLY RESOLVED ARCHITECTURAL DETAIL should be restored, but do not copy its plants, flowers, tabletop objects or other content. Image 3 is the user's clarity reference ONLY: use its finely resolved crisp plaster cornices, lattice apertures, painted timber shutters and ceramic ornament as the optical sharpness standard. Do NOT copy its two-panel layout, UI, lettering, missing background, different architecture, extra Tan Hua flowers, extra floating flowers or controls.

Make the THREE SHOPHOUSES in image 1 markedly sharper and more precisely resolved, like a meticulously focused architectural photograph. Restore the detailed lattice apertures rather than soft smudges, individually separated thin shutter slats and window mullions, sharply resolved carved-stucco recesses and cornice edges, clear ceramic floral tile motifs and fine grout, straight crisp door panels, subtle painted timber grain, plaster microtexture, and chair cane weave. Use image 2 to recover the earlier fine detail of this SAME architecture. This is detail restoration, NOT a redesign. Match image 3's perceived sharpness without harsh outlines, white ringing, contrast halos, oversaturation, fake grain, painterly smoothing or plastic rendering. Retain balanced exposure and all original facade colors. Improve fine water reflection detail as appropriate but preserve the shoreline and broad reflection positions. No sharpening of deliberately defocused extreme foreground pink flowers.

CRITICAL GEOMETRY LOCK: don't shift, stretch, rotate, crop or reframe anything. Keep source1536x1024 logical coordinates exactly aligned. Keep green shutter geometry near x442–640/y273–434, otter opening near x1007–1036/y224–377, Merlion opening near x1100–1130/y218–357, pink door x795–879/y568–786, cafe table/chairs x975–1195/y530–807, all arch/window/column/tile boundaries and the shoreline in their current positions. These are invisible alignment constraints for existing interactive layers, not marks to draw.

CONTENT LOCK TO IMAGE1: preserve all the CURRENT pale pink-lilac ruffled trumpet flowers on the left and near foreground, with broad papery petals and cream throats. Keep exactly three shophouses, one skyscraper and two HDB blocks. Preserve the right Angsana tree with yellow blooms ONLY in the upper crown roughly y0–210, all lower canopy foliage green, bird's nest ferns in current positions, trunk and grass around its roots. NO low yellow blooms or ground bush. Keep hydrangea crown/flowers/pot exactly around x1175–1298/y667–824, current morning-glory vine and potted tie shu, and the separate large green Tan Hua plant unchanged. Front cafe tabletop MUST stay empty, as in image1; cups, cocktails, candles and steam are added by website code. No baked animals, plushies, silhouettes in windows, Tan Hua buds or blooms, falling/floating flowers, lettering or UI. Do not borrow the outdated plants or candles from image2.
Return one complete crisp photograph-style background only. Prefer genuine3072x2048 native detail at the identical3:2 composition if supported; otherwise keep1536x1024 with restored fine detail. Do not merely upscale blur.
DAY VERSION: preserve image1's daytime sky, daylight and color balance. Restore sharp detail with clean natural daytime exposure.

## Exact night prompt

Precise architectural detail restoration for an existing interactive website background.
Image 1 is the CURRENT artwork and is the exact composition, geometry, botany, color and object-position target. Preserve its entire 3:2 frame. Image 2 is an earlier version whose SHARPLY RESOLVED ARCHITECTURAL DETAIL should be restored, but do not copy its plants, flowers, tabletop objects or other content. Image 3 is the user's clarity reference ONLY: use its finely resolved crisp plaster cornices, lattice apertures, painted timber shutters and ceramic ornament as the optical sharpness standard. Do NOT copy its two-panel layout, UI, lettering, missing background, different architecture, extra Tan Hua flowers, extra floating flowers or controls.

Make the THREE SHOPHOUSES in image 1 markedly sharper and more precisely resolved, like a meticulously focused architectural photograph. Restore the detailed lattice apertures rather than soft smudges, individually separated thin shutter slats and window mullions, sharply resolved carved-stucco recesses and cornice edges, clear ceramic floral tile motifs and fine grout, straight crisp door panels, subtle painted timber grain, plaster microtexture, and chair cane weave. Use image 2 to recover the earlier fine detail of this SAME architecture. This is detail restoration, NOT a redesign. Match image 3's perceived sharpness without harsh outlines, white ringing, contrast halos, oversaturation, fake grain, painterly smoothing or plastic rendering. Retain balanced exposure and all original facade colors. Improve fine water reflection detail as appropriate but preserve the shoreline and broad reflection positions. No sharpening of deliberately defocused extreme foreground pink flowers.

CRITICAL GEOMETRY LOCK: don't shift, stretch, rotate, crop or reframe anything. Keep source1536x1024 logical coordinates exactly aligned. Keep green shutter geometry near x442–640/y273–434, otter opening near x1007–1036/y224–377, Merlion opening near x1100–1130/y218–357, pink door x795–879/y568–786, cafe table/chairs x975–1195/y530–807, all arch/window/column/tile boundaries and the shoreline in their current positions. These are invisible alignment constraints for existing interactive layers, not marks to draw.

CONTENT LOCK TO IMAGE1: preserve all the CURRENT pale pink-lilac ruffled trumpet flowers on the left and near foreground, with broad papery petals and cream throats. Keep exactly three shophouses, one skyscraper and two HDB blocks. Preserve the right Angsana tree with yellow blooms ONLY in the upper crown roughly y0–210, all lower canopy foliage green, bird's nest ferns in current positions, trunk and grass around its roots. NO low yellow blooms or ground bush. Keep hydrangea crown/flowers/pot exactly around x1175–1298/y667–824, current morning-glory vine and potted tie shu, and the separate large green Tan Hua plant unchanged. Front cafe tabletop MUST stay empty, as in image1; cups, cocktails, candles and steam are added by website code. No baked animals, plushies, silhouettes in windows, Tan Hua buds or blooms, falling/floating flowers, lettering or UI. Do not borrow the outdated plants or candles from image2.
Return one complete crisp photograph-style background only. Prefer genuine3072x2048 native detail at the identical3:2 composition if supported; otherwise keep1536x1024 with restored fine detail. Do not merely upscale blur.
NIGHT VERSION: preserve image1's deep navy night sky, restrained amber window illumination and night color balance. Restore fine detail visible in the shadows and in lit trim. No purple night palette or glowing edge bloom.
