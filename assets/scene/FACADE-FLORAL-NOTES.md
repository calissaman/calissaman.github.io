# White, red and green Peranakan facade

Assets: `facade-day-floral.png` and `facade-night-floral.png`.
Both were edited with the built-in image generation tool using the user's
green-shophouse crop as the target and the second image as a floral motif
reference. Their adjacent `.prompt.txt` files contain the accepted prompts.

The paired panels, central pier, side ornament, arch surrounds and frieze
use green leaves and red flowers on consistent white grounds. The rest of
the scene keeps its existing artwork. The original day and night masters
remain unchanged.

The generated full frames are exported as lossless 248 by 313 PNG crops
at scene x=425, y=185. These web assets total approximately 343 kB.
`scene-facade.js` clips them to the upper facade and excludes the window
openings and grilles. `scene-windows.js` shares the window outlines so
closing the shutters preserves the decorative pier between them.

Source outputs:
- Day: `exec-da3e0261-a4d7-482c-b6ce-fc5542758bc5.png`
- Night: `exec-928cf211-a4cd-4e22-ac4a-1a497f922d74.png`

Pixel comparison of the actual compositor confirms zero changes outside
the facade crop and zero changes in the protected window interiors in
both lighting modes. Every composed pixel remains opaque.
