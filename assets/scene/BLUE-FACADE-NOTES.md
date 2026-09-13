# Blue facade windows, trim, and tiles

The angled right shutter matches the left shutter's glazed top, middle
louvres, and glazed bottom. Its open angle and the otter recess remain.
The light control includes both new panes.

White piping follows the arches, column edges, sills, and tile frames.
The two yellow column ornaments are removed. Orange blossoms and blue
leaves replace the pink-green panels and lower yellow diamond frieze.
Both panels share the same mirrored texture through `drawFacadePanels`.

All five PNGs are unmodified outputs from the built-in image generation
tool. The scene applies registered masks at runtime.

| Asset | Exact final prompt |
| --- | --- |
| [Day shutter](blue-shutter-day-matched.png) | [Prompt](blue-shutter-day-matched.prompt.txt) |
| [Night shutter](blue-shutter-night-matched.png) | [Prompt](blue-shutter-night-matched.prompt.txt) |
| [Day facade trim](blue-window-trim-day.png) | [Prompt](blue-window-trim-day.prompt.txt) |
| [Night facade trim](blue-window-trim-night.png) | [Prompt](blue-window-trim-night.prompt.txt) |
| [Orange-blue panel](panel-blue-orange.png) | [Prompt](panel-blue-orange.prompt.txt) |

The shutter images map to source coordinates `(948, 205, 128, 192)`.
The facade images map to `(925, 40, 345, 465)`. The facade mask protects
window panes, recesses, and panel interiors. Separate day and night art
feeds both the base scene and its detail layer.

Selected source image IDs:

- Shutter day: `exec-0673028d-9d22-411a-819d-ba5488a7cd54`.
- Shutter night: `exec-a2a1674c-5913-45cd-bc4f-aaeb1add6773`.
- Facade day: `exec-407a2988-4585-4f7c-ad09-10b35efb0b15`.
- Facade night: `exec-4015701f-8197-49e9-bd8d-cbee81aa90f9`.
- Panel: `exec-2af1c23c-77fb-4682-8e77-e6b71c81645a`.

Validation: all 138 unit tests pass. Desktop and mobile browser checks
cover noon, dusk, and night, including both new pane lights and the otter.
Pixel comparison finds no changes outside the blue facade region and no
changes to the existing front panes. Both former yellow ornament sites
now contain blue or white architectural colors.
