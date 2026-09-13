# Calissa — Singapore after rain

A static personal website with an interactive shophouse opening, followed by the original introduction, Bio, Evals, SG → SF, Bookshelf, and Contact sections.

## Run

Serve this directory over HTTP. No build step or dependencies are required:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. Run the scene logic checks with `node --test`.

## Scene

`scene-model.js` owns coordinates, timezone conversion, bloom phases, and the bounded flower/ripple pools. `scene-renderer.js` renders registered day/night textures and displaces only the water mask. `scene.js` connects the renderer to the controls, pointer input, audio, visibility, and responsive layout. `app.js` preserves the original content interactions and theme preference.

All positions use the daytime artwork's 1536 × 1024 coordinates. Scaling uses one factor for both axes. Portrait crops cover x=360–1390 so all three facades, the Tan Hua plant, the hydrangea pot and the inward bird's nest fern remain visible. Near-square layouts use the same wider botanical framing; wider layouts show the background buildings. Portrait sky and water fades fill the remaining viewport without stretching architecture.

| Layer                 | Source bounds / anchor                                |
| --------------------- | ----------------------------------------------------- |
| Sky and canopy        | Full width, y=0–260                                   |
| Skyscraper            | x=135–190, y=255–440                                  |
| Two HDB blocks        | x=215–405, y=340–440                                  |
| Shophouses            | x=410–1230, y=0–825                                   |
| Interactive branch    | x=325–585, y=28–148                                   |
| Tan Hua plant         | x=650–790, y=645–790                                  |
| Two bud/bloom anchors | (701,690), (744,681)                                  |
| Water boundary        | Shared WATER geometry; excludes foreground vegetation |
| Bistro light control  | x=1015–1195, y=550–790                                |
| Interface             | Screen coordinates, outside the artwork transform     |

Environmental minutes control the registered textures, theme, lighting, and two buds/blooms. Simulation seconds control water, falling/drifting flowers, and ripple age. Scrubbing never steps or resets the simulation. Singapore, San Francisco, and local mode use `Intl.DateTimeFormat` timezone rules.

One animation loop pauses when the scene is offscreen or the document is hidden. Frame deltas are capped after stalls; pixel ratio follows the screen up to 3 within a six-million-pixel budget, adapts gradually under sustained load, and recovers when frame times improve. Reduced motion stops automatic falling and drifting, and retains very small water shimmer and manual interactions. Seven flower objects and twelve ripple objects are reused. Four flowers float on arrival, and the first gentle fall starts immediately. Both day and night use separate photographic front and side trumpet-flower views, with broad crinkled corollas, pale pink-lilac petals and cream-yellow throats. The left tree retains pink trumpet flowers. The right framing tree is an angsana with yellow flowers confined to its upper canopy and green lower branches with bird's nest ferns, and the cafe-side pot holds a fuller hydrangea with distinct blue-lavender and blush mopheads. Architectural detail restoration is documented in `assets/scene/SCENE-V11-NOTES.md`; the upper-canopy flowering correction is documented in `assets/scene/SCENE-V10-NOTES.md`; earlier tree and hydrangea generation notes are in `assets/scene/SCENE-V4-NOTES.md`; trumpet-flower notes are in `assets/scene/FLOWER-V3-NOTES.md`.

The time panel offers the original slider and a Breeze blocks view with a draggable, scrollable ceramic column. Both views share environmental time and paired SG/SF clocks. The green upstairs shutters open and close. The left blue upstairs window hides an otter from 18:00 until 23:00. The neighboring right window holds a Merlion plushie from 23:00 until 05:00. Each window has its own click target to reveal more of its visitor; both are quiet outside their scheduled hours.

A blonde raccoon stays hidden behind the hydrangeas until their hotspot is clicked, tapped, or activated with Enter/Space. A second activation hides it. It stays behind the blooms in either lighting mode, and reduced motion changes its pose immediately.

The water supports taps. Floating flowers support pointer dragging and keyboard arrow keys. The branch releases one flower at a time. The time panel supports a native range input and keyboard operation. Light controls affect existing artwork regions. The theme button also remains available while reading lower sections.

## Assets and fallback

The Evals section displays `assets/evals/peranakan-panel.jpg` as twelve ceramic tiles. `eval-tiles.js` assembles them once when they enter view, with an optional replay button. It pauses while offscreen or hidden and shows the completed panel for reduced-motion preferences. The unanimated layout also works without JavaScript. The adjacent asset README records the reference photograph and image-generation prompt.

`assets/scene/` contains generated day/night textures prepared from the chosen shophouse composition, plus small transparent flowers and the ceramic time-slider handle. The two textures are closely registered; they remain raster artwork rather than separate architectural geometry.

`assets/books/manifest.json` records the cover sources and editions. The four original reviews remain intact. Aesthetic Intelligence by Pauline Brown has an empty review for Calissa to write. Add it to that book's `review` field in the `books` array in `app.js`; until then, selecting it shows its title and author only.

Ambient water is synthesized only after a click. Music controls accept local audio files, keep them on the device, and release object URLs when the playlist changes. No music is bundled or autoplayed.

If WebGL is unavailable, the scene keeps aligned day/night images, clocks, flowers, manual ripple overlays, and audio. Lighting hotspots are disabled with an explanatory label in this mode. Missing decorative images do not disable the remaining controls.

## Verification

Node tests cover time-independent simulation, the seven-flower limit, ripple pooling, stall recovery, reduced motion, DST changes, river-bank hit testing, flower landing, a ten-minute simulation, and crop protection across phone, tablet, desktop, ultrawide, and landscape dimensions. Browser checks covered the 1440 × 900 desktop and 390 × 844 phone layouts, day/night switching, time scrubbing, SG/SF switching, normal scrolling, real book covers and reviews, and the SG → SF dialog with Escape.

Frame-rate targets are implementation targets, not a benchmark guarantee across devices. The GitHub Pages-compatible static structure and existing domain file are retained.

The follow-up browser pass checked 390 × 844 portrait and 667 × 375 landscape layouts, flower dragging and keyboard movement, time changes without repositioning flowers, pause below the fold, and bounded music/time panels. The caption and Bio use the revised wording supplied by Calissa.

Flower interaction: click or tap a falling or floating trumpet blossom to separate its five textured petals. Floating blossoms can still be dragged or moved with arrow keys; Enter/Space separates them. Petal fragments retain the seven-flower capacity, settle onto the water and fade; reduced motion uses a short, restrained separation. Water has continuous local reflection movement and visible click ripples, with a masked Canvas fallback if WebGL is unavailable.

Water flowers replenish gradually when fewer than four whole blossoms remain afloat. Each replacement waits at least six seconds after a breakup, appears at a spaced position within the river with opaque petals. This also works with reduced motion, without automatic falling or floating movement. The seven-flower pool still includes falling blossoms and petal fragments.

Whole trumpet flowers render at full opacity from arrival. A one-time preparation sets near-opaque sprite interiors to full alpha while retaining the original RGB, transparent backgrounds, and antialiased edges. Water reflections and retiring detached petals keep their separate opacity.
