# Scene artwork v4

## Deliverables

- `day-v4.jpg`: 1536 × 1024 RGB JPEG, quality 88, 845,669 bytes.
- `night-v4.jpg`: 1536 × 1024 RGB JPEG, quality 88, 794,705 bytes.
- Directory: `assets/scene`.
- Earlier scene assets and all site code remain unchanged.

## Final changes

The right foreground tree uses small golden-yellow Angsana sprays and glossy oval leaflets. Two bird's nest ferns grow from its branch forks. The inward rosette is centered approximately at (1320, 335), with fronds reaching approximately x1205–1390. Its final position is higher than initially requested; the accepted composition keeps the blue window hotspots and café opening clear. Responsive framing can include that center by extending the source crop beyond x1320.

The café-side hydrangea now has larger, distinct blue/lavender and blush mopheads with broad leaves, in its original ceramic pot around (1235, 800). The left pink trumpet tree, main green-only Tan Hua, architecture, red/green/white façade trim, skyline, shoreline and clean water remain. No characters, text, additional pots, or loose flowers were added.

## Verification and limits

Both final masters were visually inspected, JPEG dimensions were checked and JPEG decoding verified. An independent visual audit confirmed botanical clarity in the first day candidate; the inward-fern correction was then accepted before the night generation.

A local edge-correlation check used 40 × 40 patches and a ±6 px search radius. Day-v3 → final day-v4 sample offsets were (0, 0) at the green column, blue arch, café transom and left trumpet bloom, and (0, -1) at the pink door handle and Tan Hua pot base.

Day-v4 → night-v4 offsets:

| Anchor | Best-match offset (x, y) | Edge correlation |
| --- | --- | --- |
| Green column | (1, 0) | 0.775 |
| Pink door handle | (0, 0) | 0.652 |
| Blue arch | (0, 0) | 0.819 |
| Café transom | (0, 0) | 0.826 |
| Tan Hua pot base | (0, 0) | 0.804 |
| Left trumpet bloom | (0, 0) | 0.846 |
| Hydrangea mophead | (0, 0) | 0.699 |
| Inward fern | (0, 0) | 0.699 |

These are sampled alignment checks, not proof of pixel identity. Generative edits change local textures and illumination. No global image translation, resize, or crop was applied.

## Method and source paths

All artwork edits used built-in `image_gen.imagegen`. No CLI/API image generation was used. macOS `sips -s format jpeg -s formatOptions 88` converted the final masters without resizing or cropping.

Canonical inputs:

- `assets/scene/day-v3.jpg`
- `assets/scene/night-v3.jpg`

Botanical photo references:

- `user-provided botanical reference 1 (not bundled)`
- `user-provided botanical reference 2 (not bundled)`
- `user-provided botanical reference 3 (not bundled)`

Retained generated masters:

- Initial day botanical edit: `initial day-v4 botanical master (not bundled)`
- Final day, after inward-fern placement: `final day-v4 master (not bundled)`
- Final night: `night-v4 master (not bundled)`

## Day botanical prompt

Use case: precise-object-edit. IMAGE1 is the exact1536x1024 DAYTIME scene edit target. Images2–4 show the actual ANG SANA (Pterocarpus indicus) tree and small yellow blossoms to reproduce. Make TWO localized botanical edits only. (1) Convert the existing LARGE RIGHT FOREGROUND TREE, whose trunk occupies the far right aroundx1470–1535,y230–700 and whose canopy frames the upper-rightx1200–1536, into the reference Angsana. KEEP the exact main trunk location, branch structure, outer canopy footprint and scene framing. Replace this RIGHT tree's attached pink trumpet flowers with small dense golden-yellow Angsana sprays/racemes composed of MANY TINY yellow pea-like florets as in the close-up reference, and naturally pinnate foliage with glossy rounded oval green leaflets. No large yellow trumpet flowers. Retain airy green/yellow texture and natural flower scale. Convert the right foreground branches/flowers belonging to this tree consistently, but do not alter the LEFT PINK TRUMPET TREE or any left-side pink flower clusters. Add exactly TWO naturally growing BIRD'S NEST FERNS attached epiphytically at existing RIGHT trunk/branch forks roughly(1460,250) and(1490,510). Each is a modest radial rosette of fresh bright green broad STRAP FRONDS with wavy margins and strong dark central midribs; no feathery/palm fronds, no hanging pot or planter. Tuck their bases into bark forks, don't obscure the cafe or move the trunk. (2) Make the HYDRANGEA in the SAME existing ceramic pot centered around(1235,800), rimy775, unmistakable: a fuller compact bush with one dominant round dense55–65px mophead and two or three35–45px mopheads, made of many distinct tiny four-lobed florets, soft powder-blue/lavender with some blush pink; broad dark green veined SERRATED leaves below. The crown can rise toy655 and spanx1177–1290, reasonably larger than before, but its left edge must remain>=1175 to preserve cafe/seating visibility. Keep the original ceramic pot, its rim, dimensions, position and ground contact EXACTLY; no new pot. Hydrangea heads are rounded mopheads, NOT long tubular/trumpet flowers or loose scattered florets. HARD INVARIANTS: exact1536x1024camera/crop/perspective and original architecture/window/shutter/door geometry; all three facades incl red/green/white left trim, original roof/tilework, upper windows, cafe furniture, Tan Hua green-only plant and all other pots, skyline one skyscraper+twoHDB, shoreline/waterbank and water reflections. Preserve all LEFT-side pink trumpet blossoms unchanged. Preserve daytime sky/light. Do not add or change characters, animals/otters, signage, text/UI, or loose/floating/falling flowers anywhere: water stays clean. Edit only the specified right-tree botany/ferns and hydrangea crown. Keep all remaining pixels as closely as possible.

## Day fern-placement prompt

Use case: precise-object-edit. Edit IMAGE1, a1536x1024 scene, with ONE small positional correction only. There are TWO bright green bird's nest fern rosettes on the far-right trunk. Keep the UPPER fern aroundx1460,y170 exactly where it is. RELOCATE only the LOWER fern currently aroundx1500,y355 to a natural INWARD branch fork aroundx1325,y455. Its wavy broad undivided strap-fronds must extend visibly LEFT into x1220–1320 betweeny390–535, within the existing right-side foliage; its dark central nest attaches naturally to bark at the inward fork. Make this inward fern modest enough to preserve the cafe: DO NOT cover blue upper windows atx963–1135, and DO NOT cover cafe opening atx975–1195,y530–805. An approximately170px-wide fern occupyingx1220–1390,y375–535 is suitable. Restore the old lower-fern spot using the surrounding existing bark/Angsana foliage, leaving only TWO total fern rosettes. Change NO other elements: retain the exact yellow Angsana flower sprays and oval leaves, all LEFT pink trumpet flowers, the clear blue/lavender HYDRANGEA mopheads and original ceramic pot, main Tan Hua, architecture, red/green/white trim, roof/windows/shutters/doors, shoreline, clear water, skyline, and daytime lighting. Same1536x1024canvas and exact camera/pixel alignment. No new pots, animals, people, loose flowers or text. This is just moving the lower fern inward to make part of it visible in a portrait crop whose right edge isx1270.

## Night prompt

Use case: lighting-weather. IMAGE1 is the APPROVED NEW DAY scene and geometry edit target, exact1536x1024. IMAGE2 is the previous NIGHT scene, used ONLY as night-lighting/color reference. Turn IMAGE1 into NIGHT by changing lighting only. Preserve every object, outline, silhouette, scale, texture placement and architectural pixel position in IMAGE1 as closely as possible, including the new RIGHT ANG SANA canopy with small dense golden-yellow flower sprays and glossy oval pinnate leaflets; both bird's nest fern rosettes, one upper-right and the lower one on the inward branch around(1320,335), fronds reachingx1205–1390; the fuller blue/lavender/blush HYDRANGEA with large rounded dense mopheads in the original ceramic pot around(1235,800); all unchanged LEFT PINK TRUMPET blossoms, original tree branches/trunk locations, hydrangea leaf/flowerhead/pot shapes, and main green-only Tan Hua plant. The daytime and night images must crossfade with EXACT matching botanical silhouettes/positions. From IMAGE2 borrow ONLY its rich DEEP NAVY night sky, low cool blue ambient light, warm AMBER interior windows, glowing cafe/streetlamps and warm water reflections. No purple sky, no global magenta cast, no neon flowers. Keep yellow Angsana blooms warmly illuminated and blue/lavender hydrangea identifiable in night light. Retain every original facade/window/shutter/door/cafe furniture/roof/red-green-white trim geometry, shoreline and clear water footprint, one skyscraper and two HDB blocks, camera/perspective and1536x1024canvas fromIMAGE1. Do NOT bring back the old pink right-tree blossoms or smaller hydrangea fromIMAGE2. No new objects, pots, animals, otters, people, text, signage/UI, or loose/floating/falling flowers. The only change toIMAGE1 is faithful nighttime illumination usingIMAGE2.

Date: 2026-09-12.
