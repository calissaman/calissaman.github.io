# Cream-blonde full-body raccoon

Asset: `assets/scene/blonde-raccoon-cream.png`.

The built-in image generation tool recoloured the existing full-body sprite
using the left raccoon in the user's comparison as the colour reference.
The accepted prompt is in `blonde-raccoon-cream.prompt.txt`.

The output contains a painted checkerboard. The user's previously approved
local background-cleanup method restores the original sprite's alpha channel
without changing the silhouette, dimensions, or body opacity. Transparent
pixels have zero RGB values. Edge colours come from adjacent fur to remove
checkerboard contamination without changing alpha. The original sprite
remains available.

The website displays the raccoon at 65% of its previous width and height.
Its centre stays at scene x=1144, and its feet stay at scene y=812. The
existing hide/reveal animation and minimum 44px touch target remain active.
