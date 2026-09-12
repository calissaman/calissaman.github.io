# Scene v9: table for two

Generated with built-in image_gen. The day/night images have an empty front bistro table. Separate photographic RGBA sprites provide exactly two Nanyang kopi cups, each with a matching saucer and orange plastic spoon, or two neon cocktails and two candles. Steam is animated in Canvas from simulation time; solid table objects switch without crossfading.

The schedule follows the explored scene time: coffee 06:00–12:00; empty 12:00–18:00; cocktails and candles 18:00–06:00. Reduced motion retains still steam. Other environment layers remain unchanged.

Assets:

- assets/scene/day-v9.jpg
- assets/scene/night-v9.jpg
- assets/scene/kopi-cup.png
- assets/scene/night-table.png

Original generated masters are not bundled. They comprise the day scene, night scene, coffee sprite, and night-table sprite.

Day/night exports are native 1536 × 1024 JPEGs at quality 97, without resizing. The sprite PNGs retain their alpha channels. At load, the runtime prepares each sprite once: near-opaque interior pixels with alpha values of 240 or higher become fully opaque at 255. Lower alpha values remain unchanged, preserving transparent backgrounds and antialiased edges. The prepared canvases are cached and reused.

Initial reference-based coffee attempts baked in a checkerboard and were rejected. A fresh transparent generation produced the accepted coffee cutout.

## Day clean-plate prompt

Use case: precise-object-edit. Remove ONLY the three small candles and any drinking vessels from the FRONT CAFE TABLE inside the blue shophouse at approximately x1000–1145,y685–719. Restore a clean empty wooden tabletop and the tiny portions of interior backdrop immediately behind the removed objects. Keep the table, pedestal, chairs, perspective, edges and position exactly unchanged. This is a clean plate for separately animated table objects, so NO cup, candle, glass, spoon, bottle, floral arrangement, flame or steam on this table. Keep ALL other scene content and pixels as closely unchanged as possible: all3shophouses and facade/windows/tiles, pendant lamp and shelves, new morning glory green vine and small tie shu, large separate Tan Hua plant, hydrangea, grass around tree, Angsana withyellowcanopy/bird'snestferns, pinktrumpetflowers,skyline,shoreline andwater. Preserve original DAY lighting and material sharpness. No relighting or new objects anywhere. Original1536x1024full-scene framing. Exact current DAY scene with ONLY the front tabletop cleared.

## Night clean-plate prompt

Use case: precise-object-edit. Remove ONLY the three small candles and any drinking vessels from the FRONT CAFE TABLE inside the blue shophouse at approximately x1000–1145,y685–719. Restore a clean empty wooden tabletop and the tiny portions of interior backdrop immediately behind the removed objects. Keep the table, pedestal, chairs, perspective, edges and position exactly unchanged. This is a clean plate for separately animated table objects, so NO cup, candle, glass, spoon, bottle, floral arrangement, flame or steam on this table. Keep ALL other scene content and pixels as closely unchanged as possible: all3shophouses and facade/windows/tiles, pendant lamp and shelves, new morning glory green vine and small tie shu, large separate Tan Hua plant, hydrangea, grass around tree, Angsana withyellowcanopy/bird'snestferns, pinktrumpetflowers,skyline,shoreline andwater. Preserve original NIGHT lighting and material sharpness. No relighting or new objects anywhere. Original1536x1024full-scene framing. Exact current NIGHT scene with ONLY the front tabletop cleared.

## Accepted coffee sprite prompt

Create a transparent-background PNG cutout of a single photorealistic Nanyang kopi coffee cup, saucer and spoon. The image must have a real alpha channel around the object. A nostalgic white ceramic kopitiam cup with dark green peony-and-leaf floral transferware decoration, round handle on the right, matching decorated white saucer. Filled with caramel-brown milky Singapore kopi, with one orange plastic teaspoon inserted into the coffee, its handle leaning upward. Whole cup and saucer, seen from the front and slightly above, realistic three dimensional ceramic form, natural diffuse daytime light. One cup only. No steam, no other objects, no table, no shadow outside the silhouette, no text or brand logo. The product itself is opaque. Empty space outside it and inside the handle hole is transparent. A clean isolated photographic product sprite, NOT a product advertisement. Do not draw a checkerboard. Centered square canvas with safe transparent margins.

## Night sprite prompt

Use case: photorealistic-natural product sprite. Create one isolated small nighttime cafe tabletop arrangement for two: exactly TWO neon-colored COCKTAILS, one vivid turquoise-cyan drink at left and one saturated coral-magenta drink at right, with exactly TWO short cream wax candles between them. Drinks in attractive low stemmed coupe glasses with small lime/citrus garnishes; candle heights slightly different. Fine authentic photographic texture and form, warm candle illumination with restrained neon-colored drink highlights. Camera frontal from slightly above, low angle that matches objects on a distant cafe table. Arrange all bases on one shared horizontal tabletop plane, nearly level with subtle perspective. Spread the group horizontally in a roughly2.5:1silhouette, with comfortable separation so all2drinks/2candlescountclearly. No table or background surface: use genuinely transparent RGBA background outside the object silhouette. VERY IMPORTANT: glasses, stems, colored liquids, garnishes and candles are rendered as FULLY OPAQUE visible objects, including inner glass regions; no see-through alpha or ghostlike fades. Suggest glass through painted highlights and opaque color, not transparent interiors. Candle flames are tiny and realistic; no giant bloom/haze/smoke that washes out shapes. No coffee cups, spoons, extra drinks, bottle, humans, text, brands or UI. Sharp detailed3Dphotographic object cutout. Use1536x1024canvas, whole wide arrangement centered with safe transparent margins; object group roughly1400pxwideand560pxhigh.
