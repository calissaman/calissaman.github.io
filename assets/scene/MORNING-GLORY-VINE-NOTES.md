# Morning glory vine

Replace the tangled foliage and mottled plaster between the pink door and
blue shophouse with a coiling vine and fresh green heart-shaped leaves.

Both assets use the built-in image generation tool. The PNGs are unmodified
copies of the selected outputs; the scene applies its mask at runtime.

| Lighting | Asset | Exact prompt |
| --- | --- | --- |
| Day | [morning-glory-vine-day.png](morning-glory-vine-day.png) | [Day prompt](morning-glory-vine-day.prompt.txt) |
| Night | [morning-glory-vine-night.png](morning-glory-vine-night.png) | [Night prompt](morning-glory-vine-night.prompt.txt) |

Day source: `exec-a9457b21-4337-42db-bf47-9780e1fb0d35.png`.
Night source: `exec-3f908004-844d-4f75-9ff5-67e3cb6e17a4.png`.
Each source is 732 × 2149 pixels. The night edit uses the selected day image
to retain the same leaf and stem positions.

The input crop comes from the assembled scene, including the existing plant
removal and facade repairs: source coordinates `(803, 365, 158, 464)`.
The narrow mask in `morning-glory.js` protects the adjacent symmetric tile
panel and feathers the border into the wall. The base scene and detail layer
share this artwork. The five morning blooms retain their existing positions
and opening schedule.

Validation: all 138 unit tests pass. Chrome checks cover 07:30, 09:00, 12:00,
18:45, and 22:00 on desktop and mobile. Pixel comparison finds zero changes
outside the vine region and zero changes inside the adjacent tile panel.
