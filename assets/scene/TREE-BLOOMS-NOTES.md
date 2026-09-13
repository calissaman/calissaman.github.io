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

All 122 tests pass. Browser checks exercised 88 clicks on each tree at 1280 by
800 and 390 by 844, and checked automatic falling without consuming clicks.
Pixel checks found zero changes outside the two canopy bounds. Day/night
screenshots were inspected. Flower colour processing happens once when sprites
load rather than once per bloom per frame.
