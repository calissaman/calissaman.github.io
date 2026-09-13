# Bistro plants, ornaments and dinner

Generated with the built-in image editor. The user's approved local background-removal workflow cleans the isolated dinner artwork; its original RGB colours remain intact inside the objects. The mask repairs the carrier handle, one tealight and the small openings in the red garnish after foreground segmentation.

## Published artwork

- `bistro-day-patch.png`: aligned full-frame source. Only x842/y639/w127/h176 (the small outdoor pot) and x1030/y555/w171/h148 (the cafe interior) enter the rendered scene.
- `bistro-night-patch.png`: matching night source, using the same two masks.
- `tiffin-cocktails.png`: transparent two-tier turquoise floral tiffin with a gold four-leaf clover, two cocktails and two tealights.

The sharpened `day-v12.png` and `night-v12.png` remain unchanged. Two-pixel local edge feathers preserve every pixel outside the edit regions. The original street-patch and lamp schedule continue after the bistro composition.

The rear counter holds the fern kokedama and marimo bowl. The shelves contain a dragon-playground miniature, a Peranakan ornament and varied colourful tiles, with warm lights. The playground design reference is the [National Heritage Board's Toa Payoh trail](https://www.roots.gov.sg/places/places-landing/trails/Toa-Payoh-Heritage-Trail----Of-Public-Housing-and-Shared-Spaces).

Nanyang kopi remains from 06:00 to 18:00. The tiffin, cocktails and tabletop candles appear from 18:00 to 06:00. A single transparent arrangement keeps all objects aligned through room-light and day/night changes; colour changes preserve alpha. No rectangular room background is included in the tabletop sprite.

## Verification

- Full Node test suite: 109 checks passed.
- Actual raster composition: zero modified pixels outside the two approved bistro masks in both day and night; full scene alpha remains opaque.
- All three dinner lighting variants retain identical alpha, with 2,239 fully opaque object pixels and 3,817 fully transparent pixels at scene resolution.
- Desktop/mobile and room-light checks recorded during implementation.

## Daytime bistro and pot removal prompt

Precise local object edit of the supplied daytime scene. Return the same full aligned 1536 x 1024 composition, identical sharpness, camera, buildings, windows, water, trees, flowers, furniture and warm daylight. This will be used as masked source artwork; only the specified two small areas may change.

1. At the blue/pink shophouse boundary, remove the SMALL outdoor potted cycad entirely: broad radial leaves and blue-and-white pot around x850–965,y650–805. Continue the original blue wall, door jamb, step and paving naturally behind it. Keep the climbing vine on the column, the much larger plant in front of the cream house at x720, the hydrangeas at x1240, and every other outdoor plant.

2. Inside the open blue shophouse, restyle ONLY the objects on the rear counter and the three existing wood shelves, approximately x1034–1200,y558–693.
Replace the rear-counter potted plants with ONE fern kokedama: a textured green moss ball wound with delicate thread, with a small airy fern, resting on a shallow pale ceramic dish. Beside it put ONE round clear glass marimo bowl holding two velvety green moss balls underwater, a few tiny pale pebbles and a readable waterline. These belong on the BACK counter, not the front dining table.
Replace the anonymous brown pots and knickknacks on the existing wall shelves with a carefully spaced Singapore collection: a small recognizable orange mosaic Toa Payoh dragon PLAYGROUND model with angular terrazzo dragon head and curved ringed climbing body (not a fantasy dragon); a small colourful Peranakan beadwork ornament; and four miniature ceramic display tiles leaning against the wall, each with a different relief or floral pattern, in turquoise, cobalt/white, pink/green and lilac/cream. Keep the shelf boards themselves wood. Colours remain clear under warm room light, not brown or sepia.
Preserve ALL existing pendant and shelf lights in their exact positions and preserve their glow. Leave breathing room between the objects. No extra plants on the shelves.
The FRONT wooden bistro table must stay EMPTY and unchanged, as must both chairs. No food or cups in this base artwork. No text, logos, UI, animals or people added. No scene-wide restyling or softening. Only the removed outdoor plant and the rear-counter/shelf objects change.

## Daytime shelf lights prompt

Precise local edit to this daytime image. Preserve the full 1536x1024 image exactly: all geometry, architecture, plants, crispness, lighting, new kokedama and marimo, dragon-playground miniature, all colourful tile objects and the empty front table. Add ONLY three very small warm ivory candle lights INSIDE the blue shophouse: one tiny lit candle beside the tile on the middle shelf around x1185,y608; one tiny glowing candle beside the display tiles on the lower shelf around x1168,y637; one tiny candle on the rear counter to the right of the marimo bowl around x1157,y675. Each candle is realistically miniature, about 4–6 pixels tall plus a small warm flame, with restrained amber glow, does not cover the tile patterns. Keep the main hanging pendant unchanged. No other change, no additional objects, no text. Return the same fully aligned opaque daytime image.

## Night bistro prompt

Use case: precise-object-edit. IMAGE 1 is the exact original NIGHT scene and is the edit target. IMAGE 2 shows the approved new small prop arrangement in daylight and is a reference ONLY for the props. Return the full 1536x1024 image at the same camera, geometry and night exposure as Image 1. Modify only these areas to match Image 2 exactly: remove the small outdoor cycad and blue-white pot x842–969,y639–815, naturally restoring the blue wall/step/paving and keeping the climbing vine. Inside the blue shophouse x1030–1201,y555–703, copy the Image 2 arrangement: fern kokedama moss ball on shallow dish; round glass marimo bowl with two green moss balls on the rear counter; a miniature orange mosaic Toa Payoh dragon playground model with angular head and ringed body on the top shelf; small Peranakan beadwork ornament and miniature display tiles with varied turquoise, cobalt, pink/green and lilac patterns on existing wooden shelves. Keep the new object positions, shapes and scale identical to Image 2. All their materials remain clearly coloured, under warm amber night lighting. Retain the main hanging pendant and the tiny warm candle lights visible in Image 2 on the shelves and rear counter, with realistic small glow. The front bistro table stays EMPTY, no dinner, no cups. Every pixel outside the two specified edit areas must preserve Image 1, especially glowing upstairs windows, doors, flowers, hydrangeas, trees, furniture and water. No restyling, no loss of sharpness, no text. One full aligned opaque night scene.

## Night remaining-pot cleanup prompt

Precise object removal in this night scene. Preserve the full 1536x1024 composition and all pixels except the following tiny remaining plants INSIDE the blue-shophouse cafe. Remove the small leafy plant at the far right of the top shelf, approximately x1185–1200,y552–582, behind the dragon miniature. Remove the two small generic potted plants at the far right of the rear counter, approximately x1169–1200,y655–691. Restore the same warm wall and wood countertop naturally behind those removed plants. KEEP the kokedama fern on its moss ball and the marimo glass bowl to the LEFT of these plants. KEEP ALL warm lights and candles including the light immediately left of these pots. Keep the dragon playground model, colourful miniature tile display, shelves, pendant, the empty dining table, chairs and outdoor climbing vine exactly unchanged. Do not add replacement objects. No other change, no extra pots, no text. Full aligned opaque image, identical night exposure and sharpness.

## Tiffin and cocktail asset prompt

Use case: compositing. Create one high-resolution isolated tabletop still life for the small wooden cafe table in Image 4. Image 1 supplies the TURQUOISE TIFFIN DESIGN, Image 2 the RED COCKTAIL, Image 3 the YELLOW COCKTAIL. These are object references only; do not copy their backgrounds or text.
EXACTLY THREE main objects, arranged left to right: (1) one short ruby red rocks cocktail with level pale foam and one small delicate red lace garnish, (2) one closed TWO-TIER turquoise enamel Peranakan tiffin carrier decorated with fine pink peonies, green leaves and a few yellow flowers, thin ivory seams between tiers, and a clearly four-leaf-clover-shaped polished GOLD finial on the lid, and (3) one narrow pale-yellow highball with a restrained blue-teal base, thin foam, and a small dried pineapple garnish. No blue dish or plates. No branding or lettering on the tiffin. Tiffin is squat, slightly wider than tall, the yellow highball is a little taller than the tiffin lid; the gold clover sits just above it. Two VERY small ivory tea lights behind the arrangement, tiny flames.
Photorealistic still-life style, warm cafe side lighting, crisp realistic enamel and glass, opaque liquids, level smooth rims. LOW frontal camera, only 8 degrees above the tabletop, very shallow symmetrical ellipses at the glass rims and bases; parallel vertical axes, no tilted or floating objects. The left glass sits slightly forward, the right slightly behind, all bases resting on the same horizontal table plane. Natural spacing, a small visible gap between each of the three main objects. The tiffin fits naturally between the glasses, no overlap hiding its floral design. Restrained highlights, no neon glow.
Canvas landscape 1536x1024; all three objects fully visible together as a centered compact arrangement with small margins. Match proportions and perspective of Image 4's existing cafe table. Output GENUINE transparent PNG alpha outside the objects and through clear glass above the liquids. No table surface, no backdrop, no room, no checkerboard pixels, no large cast shadow, no extra drinks, no food dishes, no text. Objects will be placed on the existing wooden table at runtime.

