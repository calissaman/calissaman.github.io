import { FACADE_PANELS } from "./facade-panels.js?v=20260915-82";

export function drawFacadeClarity(ctx, image) {
  if (!image) return;
  ctx.save();
  ctx.beginPath();
  const outline = [
    [675, 150],
    [902, 90],
    [922, 90],
    [1250, 25],
    [1250, 810],
    [675, 785],
  ];
  outline.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.clip();
  const holes = [
    [
      [956, 540],
      [1250, 540],
      [1250, 810],
      [956, 810],
    ],
    [
      [665, 667],
      [774, 667],
      [774, 810],
      [665, 810],
    ],
    ...FACADE_PANELS.filter((p) => p.house !== "green").map((p) => p.quad),
  ];
  for (const points of holes) {
    ctx.beginPath();
    ctx.rect(665, 25, 585, 785);
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.clip("evenodd");
  }
  ctx.drawImage(image, 665, 25, 585, 785);
  ctx.restore();
}
