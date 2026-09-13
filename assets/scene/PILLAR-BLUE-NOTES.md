# Blue shophouse pillar

The vine-covered pillar and stepped base beside the bistro now match the
blue exterior paint. Day and night artwork preserve the corresponding
lighting, mouldings, greenery, and hydrangeas.

## Artwork and prompts

The built-in image tool produced both crop images:

- `pillar-day-blue.png`: `exec-fe94c2b6-0537-4a6d-89eb-d8985a1b2c2c.png`.
- `pillar-night-blue.png`: `exec-725c4521-06c4-4a7b-86f0-3743ef9e77b7.png`.

The saved files are unmodified outputs. The exact prompts are
`pillar-day-blue.prompt.txt` and `pillar-night-blue.prompt.txt`.
Each input magnifies the corresponding original day/night crop at x1130,
y480, width190, height350.

## Integration

`pillar-art.js` clips each crop to the pillar and its stepped base, keeping
the generated interior and flower-pot areas out of the scene. The two
outlines follow the hydrangea edge and the exposed steps.

The bistro composition applies the pillar after its shared room artwork.
The architecture detail layer repeats the same clipping after its room
detail, so both layers retain the blue pillar through the day/night blend.

## Checks

All 138 automated tests pass. Desktop and mobile browser checks cover dawn,
daylight, dusk, night, and the four bistro lamp/candle controls. Pixel
comparisons confirm no changes outside the pillar and base areas.
