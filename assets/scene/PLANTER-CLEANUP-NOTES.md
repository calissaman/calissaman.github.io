# Planter stain removal

The large blue-and-white planter in front of the yellow shophouse had an
irregular dark blot in both scene masters. The night version made it almost
black. The cleanup removes that blot while retaining the blue decoration,
rounded shading, foliage, rim, and contact shadow.

## Artwork

Both files are unmodified 1448 by 1086 outputs from the built-in image tool:

- `planter-day-clean.png`: `exec-02f75aab-d8ab-4d30-84c9-93b6c89b303f.png`.
- `planter-night-clean.png`: `exec-26ca554b-5fe6-4ab3-a80a-714578a2bbe2.png`.

The exact prompts are `planter-day-clean.prompt.txt` and
`planter-night-clean.prompt.txt`. Each input magnifies the corresponding
`day-v12.png` or `night-v12.png` crop at x680, y736, width80, height60.

## Composition and checks

`scene-facade.js` maps each generated crop to its original coordinates.
An elliptical feather limits the edit to x708..734 and y750..775, entirely
inside the porcelain. The existing scene preparation carries the cleaned
day and night artwork into both renderers, the architecture detail layer,
and manual lighting variants.

Browser pixel comparisons confirm zero changes outside that rectangle in
both daytime and nighttime. Desktop and mobile checks cover dawn, daylight,
dusk, and night. All 138 automated tests pass.
