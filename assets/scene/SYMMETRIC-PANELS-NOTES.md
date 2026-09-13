# Symmetric facade panels

The built-in image tool generated three opaque ceramic pattern textures:
- `panel-green-symmetric.png`: white, red flowers, and green foliage.
- `panel-cream-symmetric.png`: coral, teal rosettes, green leaves, and pink edging.
- `panel-blue-symmetric.png`: coral flowers, blue and green geometry, and golden accents.

Adjacent `.prompt.txt` files contain the exact prompts. Source output IDs:
- Green: `exec-292d4259-cf62-4121-84f4-eceb49f1f4aa.png`
- Cream: `exec-ed55a41d-18bc-4328-8fde-42116f928919.png`
- Blue: `exec-4f962012-66bc-4c9b-bb7e-86a33b071f49.png`

Each web texture is 512 by 256. The renderer repeats one mirrored half-pattern
and uses the same source for both panels of each house. Perspective mapping
fits the six existing openings; the right blue panel keeps its foliage cover.
Day and night apply their own illumination to the same geometry and motif.

Pixel checks confirm full opacity and no changes outside the six panel bounds.
The other facade decoration, window openings, frames, and main scene masters
remain separate from these panel textures.
