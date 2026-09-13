export const BLUE_PILLAR_OUTLINES = [
  [
    [1197, 480],
    [1267, 480],
    [1267, 639],
    [1260, 678],
    [1256, 688],
    [1250, 680],
    [1243, 671],
    [1238, 668],
    [1233, 669],
    [1225, 679],
    [1214, 682],
    [1210, 691],
    [1197, 687],
  ],
  [
    [1192, 768],
    [1209, 775],
    [1217, 775],
    [1210, 790],
    [1212, 807],
    [1220, 822],
    [1189, 822],
    [1189, 809],
    [1190, 809],
    [1190, 791],
    [1192, 791],
  ],
];

export function drawBluePillar(ctx, image) {
  if (!image) return;
  ctx.save();
  ctx.beginPath();
  for (const outline of BLUE_PILLAR_OUTLINES) {
    outline.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
  ctx.clip();
  ctx.drawImage(image, 1130, 480, 190, 350);
  ctx.restore();
}
