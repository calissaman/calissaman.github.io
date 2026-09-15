export function drawBlueBorder(ctx, image, night) {
  if (!image) return;
  ctx.save();
  ctx.beginPath();
  [
    [938, 476],
    [1193, 449],
    [1193, 468],
    [938, 494],
  ].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.clip();
  ctx.globalAlpha = 1;
  ctx.filter = `brightness(${1 - night * 0.35})`;
  ctx.drawImage(image, 665, 25, 585, 785);
  ctx.restore();
}
