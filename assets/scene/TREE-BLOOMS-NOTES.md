# Tree blooms

Generated with the built-in image tool, then cropped and resized for the scene.
The original day/night masters remain unchanged. `tree-art.js` confines the
replacement artwork to the two canopy areas; it preserves the facade panels,
windows, bistro, street, and water.

## Final assets and exact prompts

- `canopy-day.png`: left trumpet canopy from
  `exec-9b97a2e0-e084-4f7b-b61e-38f25046368e.png`, with the focused angsana
  correction from `exec-0fa00918-6bd8-4d95-8ffd-6d9f8c386501.png`.
  Prompts: `treeDayPrompt.txt` and `angsanaCanopyDayPrompt.txt`.
- `canopy-night.png`: left trumpet canopy from
  `exec-5075c736-c1d3-44f9-b94f-7e674bffe54e.png`, with the matching night
  angsana correction from `exec-40004afc-452a-4680-ab84-117fce17e5a9.png`.
  Prompts: `treeNightPrompt.txt` and `angsanaCanopyNightPrompt.txt`.
- `angsana-flower.png`: transparent bloom from
  `exec-8a767364-d25e-4d38-9526-3d5538b1549e.png`.
  Prompt: `angsanaSpritePrompt.txt`. The generated alpha is preserved.

Generated originals are in the Codex generated-images folder for this task.
Both canopy exports are 1536 by 480 pixels with transparent unused areas.
The falling angsana sprite is 256 by 256 pixels.

## Behaviour and verification

Each tree accepts 88 manual clicks per page visit. Pink flowers fall in random
groups of one, two, or three into the water. Yellow blooms fall singly onto the
right-hand ground. Separate automatic timers do not consume manual clicks.
Mobile releases use the visible canopy and ground. Reduced motion keeps manual
releases available while placing blooms directly at their destinations.

The flower collection grows when every existing flower is active and reuses
retired slots. There is no seven-flower limit, fixed capacity, or active-count
gate on automatic releases. The two manual click allowances remain independent.
Pink automatic drops recur every 10–19 seconds; yellow drops recur every
25–42 seconds. Pink groups contain one, two, or three flowers; yellow drops
contain one small bloom.

The renderer creates a clickable flower button for each new flower. Canopy
buttons sit above falling flower targets until their 88 clicks are exhausted.
This prevents a new bloom from intercepting the next tap on its tree.

All 129 tests pass, including 667 active pink blooms and 89 yellow blooms,
continued automatic drops after both manual allowances are exhausted, and
creation and reuse of 300 rendered flower buttons. Desktop and mobile browser
checks exercise all 88 clicks on each tree and preserve all visible light
controls. Reduced motion keeps clicks available and settles flowers directly.

## Trumpet side-profile correction

Built-in image editing produced the revised artwork. Final project assets:

- `canopy-day-v2.png`, from `exec-99946e58-31fc-4d14-99d1-6f9c644a18b4.png`.
  Exact prompt: `trumpet-canopy-day-v2.prompt.txt`.
- `canopy-night-v2.png`, from `exec-f82f82fc-2d03-4851-8fe9-744b835cd635.png`.
  Exact prompt: `trumpet-canopy-night-v2.prompt.txt`.
- `trumpet-side-v4.png`, from `exec-7cc10cc4-e42c-4223-bfb2-85dc79e2b507.png`.
  Exact prompt: `trumpet-side-v4.prompt.txt`.

The detached bloom has a shorter curved tube, a broad papery mouth, and five
softly ruffled lobes. The exported sprite is 512 by 512 pixels. Local foreground
masking removes the painted checkerboard using the previously approved method.

The canopy edits are registered to the existing left canopy. A feathered edge
retains the original sky boundary and distant tower. The right angsana canopy,
all pixels outside the left canopy, and the original alpha remain unchanged.
Both exports remain 1536 by 480 pixels. Generated originals remain in the Codex
generated-images folder. Flower opacity processing occurs once when sprites
load, and the petal bodies render at full opacity in day and night.
