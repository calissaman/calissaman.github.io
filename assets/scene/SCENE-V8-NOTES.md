# Scene v8 — morning glory and tie shu

Built-in image_gen edits replaced the thin column vine with morning glory and the small plant at its foot with tie shu (Cycas revoluta). The separate large Tan Hua plant remains unchanged. Day/night assets remain native1536×1024, exported as quality97 JPEG without resizing. The flower sprite retains the generated transparent PNG alpha.

Runtime schedule, as an artistic time interaction: opening06:00–07:00, fully open07:00–10:00, closing10:00–12:00, closed thereafter. It follows the selected scene time, including SG/SF exploration. Reduced motion settles directly. Five photo blooms attach to the vine; no new click interaction.

Assets:
- assets/scene/day-v8.jpg
- assets/scene/night-v8.jpg
- assets/scene/morning-glory.png

Masters:
- day-v8 master (not bundled)
- night-v8 master (not bundled)
- morning-glory sprite master (not bundled)

Botanical identification reference: [NParks Cycas revoluta](https://www.nparks.gov.sg/florafaunaweb/flora/5/1/5108).

## Exact day prompt

Use case: precise-object-edit. Edit the supplied 1536x1024 DAY scene with two localized botanical changes ONLY, at the narrow column dividing the PINK shophouse door and BLUE shophouse.
1. Replace the thin climber running vertically up that dividing column (approximately x866–940, y425–758) with a delicate MORNING GLORY vine: slender twining stems, a modest number of botanically natural heart-shaped green leaves, small side stems where flowers can attach. At this base-image moment all flowers are CLOSED, so show green leaves/stems only and a few inconspicuous slim green buds. NO open flowers; we will animate separate blooms on top at morning hours. Keep similar narrow sparse coverage, do not cover facade tile decoration or spread onto the door.
2. Replace the plant rooted in the SMALL white-and-blue ceramic pot at the FOOT of this same vine, at center x908,y787, with a small realistic TIE SHU (Cycas revoluta/sago cycad): short textured woody caudex with a compact symmetrical arching crown of rigid narrow pinnate dark green fronds. Crown about 95–125px across, rising no higher than y665. Keep exact same pot shape, glaze, size and place. The morning-glory vine climbs separately along the column behind this cycad; it is not the trunk of the cycad.
Keep the LARGE other potted plant LEFT of the pink door at x720 unchanged: it has separate night-blooming animation and must NOT become a cycad. Preserve all other pixels and composition as closely as possible: the three exact shophouses/facades/windows/doors/tiles, furniture, all other plants, blue/lavender hydrangea, grass around right tree roots, yellow Angsana canopy, both bird's-nest ferns, pale ruffled pink trumpet flowers, skyline, shoreline and crisp water/reflections. Same daylight, camera, size, crop and photorealistic detail. No added pots, flowers elsewhere, animals, text or UI. Full DAY scene only.

## Exact night prompt

Use case: precise-object-edit. Input1 is the existing NIGHT scene and exact full-scene edit target. Input2 is the approved DAY scene showing new morning-glory vine and small potted tie shu, and is a geometry reference ONLY for those two plants.
Change only the thin vine and small potted plant on the narrow column between the pink door and the blue shophouse, approximately x852–959,y395–805, to match Input2 exactly: sparse morning glory with heart-shaped green leaves, slender twining stems and only inconspicuous CLOSED slim buds; no open flowers at night. At its base, in the same small ceramic pot centered908,787, the same compact tie shu/Cycas revoluta with short woody caudex and arching rigid pinnate fronds. Match the leaf silhouettes and placements closely across day/night. The vine climbs independently behind the tie shu. Relight only those replacement plants to match Input1's existing restrained amber highlights and navy shadows.
Preserve every other part of Input1: exact1536x1024canvas, camera/crop, all3shophouses/windows/doors/tilepatterns, furniture/potgeometry, LARGE separate potted plant LEFT of pinkdoor unchanged, grass around right tree roots, yellowAngsana canopy,bothbird'snestferns,blue/lavenderhydrangea,pale ruffled pinktrumpetflowers,skyline,shoreline,clearwater/reflections. Do not change original night lighting elsewhere. No new objects,flowers,animals,text,UI. One full NIGHT image only.

## Exact sprite prompt

Use case: photorealistic-natural. Asset: one isolated realistic morning-glory bloom for a small botanical website animation. Produce a genuinely transparent RGBA background, not white, not a checkerboard baked into pixels. One single Ipomoea purpurea flower viewed almost front-on at a very slight three-quarter angle. Its corolla is a continuous delicate round funnel with five subtle fused lobes, softly scalloped edge, natural radial pleats and fine translucent veins. Muted periwinkle blue-violet petals, subtle violet radial lines, a pale cream-white central throat with believable depth. Small tapered green calyx visible behind the lower edge, NO long stem, NO leaves. The flower head occupies 82–88% of a square canvas, centered with safe transparent margins. Photographic, fine sharp botanical detail and gentle diffuse daylight matching a tropical outdoor architectural photo; restrained saturation, no rim glow, no oversharpening, no cartoon outlines, no stylized flat star petals, no text, no shadow on a background. It will be displayed 20–30pixels wide on the vine, so give it a clear natural silhouette and pale throat. Exactly one flower, no collage or other objects.
