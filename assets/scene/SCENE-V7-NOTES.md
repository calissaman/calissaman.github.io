# Scene v7 — grass around the tree

Replaced the lower-right yellow flowering bush with short green grass around the existing tree roots in both modes. The canopy's yellow Angsana flowers, bird's-nest ferns, potted hydrangea, pink trumpet flowers and scene composition remain.

Method: built-in image_gen editing; full native 1536 × 1024 output, converted with sips to JPEG quality 97 without resizing. Original v6 assets and generated PNG masters retained.

Assets:
- assets/scene/day-v7.jpg
- assets/scene/night-v7.jpg

Day master: day-v7 master (not bundled)
Night master: night-v7 master (not bundled)

## Exact day prompt

Use case: precise-object-edit. Edit target: the supplied DAY photograph of three Peranakan shophouses. Make ONE localized botanical replacement, maintaining the original 1536x1024 canvas, composition, camera and ALL other pixels as closely as possible.
Remove ONLY the low, dense yellow-flowering BUSH at the bottom right, at the base of the large tree (approximately x1340–1536, y685–868), immediately right of the blue/purple hydrangea pot. This is the shrub near ground level, NOT the yellow blossoms in the Angsana canopy overhead. Replace this low bush with an understated natural patch of short lush green tropical grass growing around the existing tree's roots. Reveal a little of the lower tree trunk/root flare where the bush was, and give the grass fine, realistic blades and believable dappled daylight. No flowers among this ground grass. Keep it behind the existing narrow stone border and walkway; do not expand the bank or cover paving or water. Match existing perspective and photograph texture.
Absolutely preserve the upper Angsana tree, its yellow canopy blooms and both bird's-nest ferns, adjacent green foliage, the hydrangea bush with blue/lavender flower heads and its white-and-blue ceramic pot, the foreground pink trumpet blossoms, the other pink flowers, all three shophouses and exact windows/doors/tile patterns, skyline, pots, furniture, paving, shoreline, crisp water and reflection patterns. No added objects, flowers, animals, pots, text or UI. No relighting or color grading. No global redraw, sharpening change, zoom or crop. Only the lower-right yellow bush becomes low green grass at the same tree base. Output the full DAY scene at the original dimensions.

## Exact night prompt

Use case: precise-object-edit. Input 1 is the existing NIGHT image and the EXACT edit target. Input 2 is the newly approved DAY image and is ONLY a geometry reference for the lower-right tree base and grass replacement.
Make one localized edit to Input 1: remove the ground-level yellow-flowering bush immediately right of the blue/lavender hydrangea pot, approximately x1340–1536, y685–868. Replace it with the same low natural green grass, exposed lower trunk and root flare shown in Input 2. Match that new grass patch/root silhouette, stone border and extent closely so day/night modes align. Light the grass and revealed tree base with Input 1's restrained night illumination: subtle warm amber highlights from the existing street/cafe lights and cool navy shadows. No flowers in the ground grass. Keep the existing walkway and stone border unobstructed.
Do not change ANYTHING else in Input 1: preserve its exact 1536x1024 canvas and camera, all three shophouses with exact facades/windows/doors/ornament, pots and cafe furniture, blue/purple hydrangea and its ceramic pot, upper Angsana canopy with yellow blossoms, both bird's-nest ferns, adjacent green foliage, the pale ruffled pink trumpet flowers, foreground pink blur, skyline, shoreline and water/reflections. Preserve the current night sky and lighting and fine texture throughout; do not relight the whole image or copy daytime illumination. No added lights, objects, flowers, animals, signs, text or UI. No scaling, crop, global redraw, or redesign. Only the lower-right yellow bush becomes grass around the existing tree, matching the daylight edit. Output one full NIGHT scene.
