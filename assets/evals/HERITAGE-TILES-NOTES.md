# Heritage floral tile atlas

## Asset

- Final file: `assets/evals/heritage-floral-tiles-v1.jpg`.
- Integrated website file: `assets/evals/heritage-floral-tiles-v1.jpg`.
- Final dimensions: 1024 × 1024 pixels, RGB JPEG, quality 95, 594,059 bytes.
- Source photograph: `user-provided eight-tile heritage panel photograph (not bundled)`.
- Generated master: `heritage floral tile atlas master (not bundled)`, native 1254 × 1254 RGB.
- Method: built-in `image_gen.imagegen` with the supplied photograph as the exact pattern reference. The tool returned 1254 × 1254 despite the requested 1024 or 1536 square size. The final atlas was downsampled to 1024 with macOS `sips -Z 1024 -s format jpeg -s formatOptions 95`. No upscaling or Python image editing.
- The candidate and exported atlas were visually inspected. The eight motifs, order, raised ceramic relief and antique crackle match the reference closely. The table, camera perspective and external shadows are removed. Final JPEG decoding was verified.
- Existing artwork assets are preserved. The new panel appears above the turquoise panel in Evals. Its alternating rows slide horizontally into place, then light sweeps across the glaze. Each panel has independent replay, visibility pausing and reduced-motion handling.

## Geometry for eight separate tiles

The atlas is square, containing exactly two columns and four rows. Each real tile is a horizontal rectangle, 512 × 256 pixels, with a 2:1 aspect ratio. Read order is left to right, then top to bottom.

- Column edges: x = 0, 512, 1024.
- Row edges: y = 0, 256, 512, 768, 1024.
- Normalized vertical split: 50%.
- Normalized horizontal splits: 25%, 50%, 75%.
- The original tile edges form narrow nearly flush seams; no outer canvas margin or enclosing border was added.

| Row | Vertical source region | Tile pair |
| --- | --- | --- |
| 1 | y = 0–256 | Ivory and dusty pink geometric floral relief |
| 2 | y = 256–512 | Turquoise bows, deep green garland, burgundy floral ornaments |
| 3 | y = 512–768 | Mint/aqua bands with mauve fruit-like medallion and green leaves |
| 4 | y = 768–1024 | Ivory and green foliage with a domed dusty pink flower |

For CSS background slicing, each separate tile uses `background-size: 200% 400%`. Column positions are 0% and 100%; row positions are 0%, 33.333333%, 66.666667%, and 100%. The row-position percentages differ from the atlas boundary percentages because CSS positions the remaining background area.

## Exact generation prompt

Use case: precise-object-edit. Asset type: a square atlas of EIGHT antique decorative ceramic tiles for a CSS animation that will separate the real tiles. The input photograph is the exact design source. Produce a clean FRONT-FACING, orthographic, photographically realistic restoration of THESE EXACT EIGHT TILES, retaining each tile's pattern, color, raised relief, antique crackle glaze and slight individual age marks. Exactly TWO COLUMNS and FOUR ROWS, original reading order unchanged; each individual tile is a horizontal2:1rectangle. Together the2-column×4-row grid fills one perfectly SQUARE image edge-to-edge. Target native1024×1024or1536×1536, square. Geometric layout is strict: vertical seam at50%width; horizontal seams at25%,50%,75%height. All eight cells identical dimensions. Tile edges straight and aligned, nearly flush, with at most2pixels of consistent unobtrusive grout, no outer canvas margin and no extra enclosing border. Do not crop any original tile motif. Row1: the two original ivory tiles with dusty pink geometric floral relief, center rectangular bar and fan/rosette motifs, preserve their exact ornament. Row2: the two original ivory tiles with turquoise ribbon bows at upper corners, deep green hanging floral/leaf garland, burgundy/mauve flowers and central ornament, exactly as photographed. Row3: the two original mint/aqua banded tiles with mauve curved horizontal bands, central pink/mauve fruit-like medallion framed by green leaves, and small repeated arc borders at top/bottom. Row4: the two original ivory tiles with sweeping green foliage and stems around a domed dusty pink flower head, preserve the original pattern and existing hand-made texture. Do not redesign, simplify, modernize, mirror, replace, reorder, recolor or add motifs. Keep restrained actual source colors, aged ivory, muted dusty pink, turquoise, mint and deep green; natural ceramic surface and fine crackling with subtle raised relief shading. Remove only the wood table, camera perspective and external object shadows. No background scene, no outer frame, no text, icons, labels, logos, signatures, extra tiles or decorative additions. This is the original8-tile set precisely rectified into a continuous square2×4atlas, ready to slice at exact percentage boundaries.

Date: 2026-09-12.
