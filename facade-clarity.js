import { FACADE_PANELS } from "./facade-panels.js?v=20260915-82";

export const GREEN_ROOF_RECT = Object.freeze({
  x: 380,
  y: 20,
  width: 360,
  height: 310,
});

function paintWithLeftFeather(
  ctx,
  paint,
  { start, end, alpha = 1, steps = 12 },
) {
  const bandWidth = (end - start) / steps;
  for (let index = 0; index < steps; index += 1) {
    const progress = (index + 0.5) / steps;
    const opacity = progress * progress * (3 - 2 * progress);
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      start + index * bandWidth,
      -2048,
      bandWidth + 0.5,
      4096,
    );
    ctx.clip();
    ctx.globalAlpha = alpha * opacity;
    paint();
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(end, -2048, 2048, 4096);
  ctx.clip();
  ctx.globalAlpha = alpha;
  paint();
  ctx.restore();
}

export function drawGreenRoofClarity(ctx, image) {
  if (!image) return;
  ctx.save();
  ctx.beginPath();
  const outline = [
    [409, 205],
    [450, 185],
    [642, 124],
    [646, 158],
    [450, 220],
    [424, 226],
  ];
  outline.forEach(([x, y], index) =>
    index ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
  );
  ctx.closePath();
  ctx.clip();
  const { x, y, width, height } = GREEN_ROOF_RECT;
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();
}

const NIGHT_YELLOW_ROOF_OUTLINE = Object.freeze([
  [665, 170],
  [902, 80],
  [925, 176],
  [675, 220],
]);

function coolNightYellowRoof(ctx) {
  ctx.save();
  ctx.beginPath();
  NIGHT_YELLOW_ROOF_OUTLINE.forEach(([x, y], index) =>
    index ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
  );
  ctx.closePath();
  ctx.clip();
  paintWithLeftFeather(
    ctx,
    () => {
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = "#bfd5d8";
      ctx.fillRect(640, 15, 310, 225);
    },
    { start: 710, end: 750, alpha: 0.5 },
  );
  paintWithLeftFeather(
    ctx,
    () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#75a2b3";
      ctx.fillRect(640, 15, 310, 225);
    },
    { start: 710, end: 750, alpha: 0.11 },
  );
  ctx.restore();
}

export function drawFacadeClarity(ctx, image, { night = false } = {}) {
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
  paintWithLeftFeather(
    ctx,
    () => ctx.drawImage(image, 665, 25, 585, 785),
    { start: 710, end: 750 },
  );
  ctx.restore();
  if (night) coolNightYellowRoof(ctx);
}
