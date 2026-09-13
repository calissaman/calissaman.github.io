# Pink facade artwork

The middle peach and pink shophouse now follows the supplied floral reference.
Ivory piping frames the arches and the panels below the green shutters. Pink
rosettes and green leaves repeat on white ceramic above the windows, beneath
both windows, and in the continuous band above the ground-floor doors.

## Selected assets and prompts

All five PNGs are unmodified outputs from the built-in image generation tool.
Each neighboring prompt file records the exact selected prompt.

- [Daytime trim](pink-window-trim-day.png), [prompt](pink-window-trim-day.prompt.txt)
- [Nighttime trim](pink-window-trim-night.png), [prompt](pink-window-trim-night.prompt.txt)
- [Shared pink panel](panel-pink-rosette.png), [prompt](panel-pink-rosette.prompt.txt)
- [Daytime vine overlap](pink-vine-join-day.png), [prompt](pink-vine-join-day.prompt.txt)
- [Nighttime vine overlap](pink-vine-join-night.png), [prompt](pink-vine-join-night.prompt.txt)

The trim maps to scene coordinates `(645, 135, 300, 410)`. Runtime masks retain
the original window interiors and fanlights. Both rectangular panels use one
mirrored texture, including a cached three-times-resolution layer on the facade.
The vine overlap maps to `(825, 458, 100, 90)` with faded edges and continues the
floral band beneath the existing morning glory vine. The remainder of that vine
and the neighboring blue facade retain their existing assets.

Day and night use the same decorations. Their lighting blends through dusk.
The green shutters still open and close, and their separate light switches work.

## Verification

The existing 138 tests pass. Browser checks cover desktop and mobile at noon,
dusk, and night, including all three middle-house window toggles and their
three light switches. Pixel comparisons confirm that the trim does not change
window interiors or pixels outside the middle facade. The Canvas fallback uses
the same artwork and controls.
