# Bistro furniture and lamps

The bistro uses one shared room image throughout the day and night. It contains
the block-built watermelon and orange dragon playground models, two white tutu
kueh lamps on green leaf trays, the kokedama and marimo, and the colourful display
tiles. Both chair backs and seats have hydrangea-blue upholstery. The right
chair has no loose straw detail. The empty oval tabletop has a shallow visible
surface and a continuous edge above its two existing pedestal supports.

`bistro-room-consistent.png` is a 912 by 852 crop corresponding to source-scene
coordinates x956, y534, width304, height284. The renderer applies it only within
the room and furniture regions defined in `bistro-scene.js`. Night uses the same
pixels with reduced brightness and saturation, so objects cannot change shape
or position when the time changes. The earlier outdoor plant removal remains.

The shelf and counter tutu kueh lamps have independent native buttons and glow
textures. Clicking removes or restores their glow without replacing the lamp.
Their selected states persist through time changes. The counter candle target
and adjacent lamp target divide the overlapping touch area at source x1173, so
neither blocks the other's visible fixture on small screens.

`kopi-cup-low-view.png` is a 768 by 528 transparent cup and saucer viewed close to
table height. The two cups sit near the table centre, with the farther cup
slightly smaller and higher on the tabletop. The established daytime coffee
and evening tiffin/cocktail schedule remains.

## Image provenance

The built-in image tool produced the artwork. Exact prompts are saved in:

- `bistro-room-consistent.prompt.txt`
- `bistro-room-spacing.prompt.txt`
- `kopi-cup-low-view.prompt.txt`

The initial room output is `exec-b451a182-7a17-470b-afaf-402033beff52.png`.
The final room output is `exec-50ea5d7c-c719-410e-92eb-1044aac6c231.png`.
The cup output is `exec-7502791c-2f85-4a47-8326-ffd1d8b94464.png`.
Originals remain in the conversation's generated-images directory. The cup uses
the user's previously approved local Vision background removal, followed by
edge cleanup and a tightly cropped export. No master scene image changes.

## Verification

All 127 Node tests pass. Browser checks cover both lamp domes at 1280, 390, and
320 pixels, visible glow removal and exact restoration after transitions,
independent state across day/night, all 26 desktop light controls and all 19
lights visible in the mobile crop. The room and table were inspected in both
day and night. Browser checks report no page errors.
