# White shophouse restoration

The exterior now has clean white plaster, dark-red tile borders, and orderly
turquoise floral insets based on the supplied reference. Both panels below the
upstairs windows use one mirrored ceramic texture. Their cached detail layer
keeps the small flowers and medallions sharp.

## Selected assets and prompts

The following PNGs are unmodified outputs from the built-in image generation
tool. Runtime masks place the artwork in the scene.

- [Daytime exterior](white-exterior-day.png), [prompt](white-exterior-day.prompt.txt)
- [Nighttime exterior](white-exterior-night.png), [lighting prompt](white-exterior-night.prompt.txt), [cleanup prompt](white-exterior-night-cleanup.prompt.txt)
- [Turquoise panel](panel-white-turquoise.png), [prompt](panel-white-turquoise.prompt.txt)
- [Nighttime sill cleanup](white-sill-night-clean.png), [prompt](white-sill-night-clean.prompt.txt)

The exterior maps to `(420, 185, 280, 600)` in scene coordinates. Masks retain
the existing emerald awning. The restored windows keep their positions and
opening behavior, with their lights derived from the new artwork. A small additional nighttime cleanup removes a residual beige spot
on the white strip immediately above the awning. It is clipped away from the
roof and the tile panel.

The pink and blue houses retain their existing artwork. White plaster uses
neutral shadows at night instead of the previous yellow/brown discoloration.

## Verification

All 138 tests pass. Browser checks cover desktop and mobile at noon, dusk, and
night, including the green shutter toggle and all six window/door light
switches. The WebGL and Canvas renderers use the same restored artwork.
Pixel comparisons confirm no changes inside the protected roof area and no exterior changes outside the white house's bounds.
