# Street railings and lamp schedule

The original day/night masters contain a black fence. The scene applies
cleanup artwork before preparing its lit and unlit versions.

The daytime source is `street-day-patch.jpg`. The nighttime source combines
`street-night-patch.jpg` with `street-night-no-railings.png`, a detailed crop
that removes the capped fence-post remnants. Both show continuous low plants
instead of a fence. The actual street lamps and their poles remain.

## Composition

`street-scene.js` replaces x=138..336 and y=684..754 in every lighting state.
The rectangle extends beyond the original railings so its feathered boundary
cannot reveal their edges. Lit variants retain the original lamp glow.
Unlit variants also replace the lamp region and local nighttime reflections.
A hard clip at x=400 preserves the shophouses.

The night crop maps to x=110, y=665, width=280, height=100. It paints inside
the existing cleanup mask, so its surrounding context cannot overwrite other
scene details. Its magnified source removes the small post caps that are
easy to miss at the full scene scale.

The initial HTML image and preload use the clean daytime patch. If required
street artwork cannot load, the page keeps that clean image instead of
falling back to a master containing railings.

Street lamps follow the selected time from 17:30 inclusive to 04:00 exclusive,
unless individually switched. The fence removal applies throughout the
day/night blend and during manual switching and flicker. WebGL and the
Canvas fallback use the same prepared images.

## Artwork and exact prompt

- `street-night-no-railings.png`: unmodified 2098 by 749 output from the
  built-in image tool, `exec-0f74a0eb-16c5-4e90-8b34-2ffdd781dac6.png`.
- Final exact prompt: `street-night-no-railings-crop.prompt.txt`.
- The crop refines source `exec-9d864878-347b-4ea8-91f3-345305706edb.png`.
  Its source prompt is `street-night-no-railings.prompt.txt`.
- Existing daytime patch: generated source
  `exec-b64199ad-87f4-4bb5-93e5-407d99fb97c0.png`, exported as JPEG quality 97.

The generated originals remain in the Codex generated-images folder.
Runtime masking keeps unrelated generated changes out of the website.

## Verification

All 138 automated tests pass. Browser checks cover all four lighting variants
and all 1,440 minutes of the day/night blend. They also exercise 13 selected
times around dawn, dusk, and the street-lamp schedule boundaries, manual lamp
switches, the initial image with JavaScript disabled, and failure to load the
night cleanup artwork.
