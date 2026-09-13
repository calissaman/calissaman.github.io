# Park frangipani

The built-in image tool replaces the central forked green park tree's crown
with a modest frangipani bearing white and blush-pink five-petal flowers.
The existing lower trunk and roots keep the tree grounded in the park.
The night image uses the approved day tree as a reference so its flowers and
branches remain consistent, with warm lantern light and cool ambient shade.

## Saved assets and prompts

- `park-frangipani-day.png`: original tool output
  `exec-d7b5d6a8-fd45-47a0-bd85-d1502f49a7c5.png`.
- `park-frangipani-night.png`: original tool output
  `exec-f2e8baec-dc1e-4894-9d87-143efd92208b.png`.
- Exact prompts: `park-frangipani-day.prompt.txt`,
  `park-frangipani-day-refine.prompt.txt`, and
  `park-frangipani-night.prompt.txt`.

The initial daytime draft had an oversized crown. The refinement reduces the
crown while retaining the flower colours and the position of the main trunk.
Both final PNGs preserve the tool's full 1536 by 1024 output without local
raster editing. The generated originals remain in the Codex images folder.

## Integration

`tree-art.js` draws only the park rectangle at x=138, y=442, width=266,
height=168, with an eight-pixel feather. All pixels outside this rectangle
remain unchanged. The crown sits below the HDB light regions and above the
street-lamp replacement masks. The shophouses, lamps, water, and path retain
their existing artwork and controls.

The park patch is part of the shared day/night scene composition, so WebGL
and the image fallback use the same tree. Existing viewport framing remains
unchanged.

## Verification

All 138 automated tests pass. Browser checks at 1280 by 800 and 390 by 844
verify the day and night composition and every visible light switch.
Pixel comparisons against both original masters confirm zero changes outside
the designated park rectangle.
