export function drawHydrangeas(ctx, images, night) {
  ctx.save();
  ctx.beginPath();
  const outline = [
    [1228, 664],
    [1256, 673],
    [1264, 685],
    [1297, 687],
    [1308, 719],
    [1305, 753],
    [1313, 768],
    [1288, 783],
    [1200, 785],
    [1170, 770],
    [1176, 714],
    [1194, 690],
    [1212, 682],
  ];
  outline.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.clip();
  images.forEach((image, i) => {
    if (!image) return;
    ctx.globalAlpha = i ? night : 1;
    ctx.drawImage(image, 1160, 590, 240, 250);
  });
  ctx.restore();
}
