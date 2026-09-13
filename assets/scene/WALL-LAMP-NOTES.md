# Small wall lamp removal

Assets: `wall-lamp-day-removed.png` and `wall-lamp-night-removed.png`.
Both edits use the built-in image generation tool. The adjacent prompt
files record the final instructions. The user's crop identifies the small
cream bowl-shaped fixture beside the right end of the green awning.

The final 53 by 52 PNG exports copy only scene x=615..668, y=491..543.
The repaired white column replaces the lamp, bracket and fixture shadow.
The second night edit follows the accepted day repair's column geometry.
The existing floral facade and all other scene assets remain separate.

Generated source files:
- Day: `exec-5db68c99-5c5e-457b-bac6-3039cb66ecf3.png`
- Night: `exec-aea20971-f7da-4338-88cb-b17bbf53b4f6.png`

Pixel checks compare the actual compositor with and without the lamp edit.
They confirm zero changes outside the 53 by 52 rectangle and full opacity
in both lighting modes. All nine window interaction tests pass.
