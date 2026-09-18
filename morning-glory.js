import { clamp, smooth } from "./scene-model.js?v=20260919-128";

export const MORNING_GLORY_VINE_OUTLINE = [
  [878, 365],
  [934, 365],
  [942, 520],
  [933, 678],
  [939, 814],
  [849, 814],
  [849, 752],
  [855, 650],
  [855, 546],
  [850, 475],
  [850, 455],
  [877, 445],
  [879, 411],
];

const vinePatches = new WeakMap();

function traceVine(ctx) {
  ctx.beginPath();
  MORNING_GLORY_VINE_OUTLINE.forEach(([x, y], i) =>
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
  );
  ctx.closePath();
}

export function drawMorningGloryVine(ctx, image) {
  if (!image) return;
  let patch = vinePatches.get(image);
  if (!patch) {
    patch = document.createElement("canvas");
    patch.width = image.naturalWidth || image.width;
    patch.height = image.naturalHeight || image.height;
    const paint = patch.getContext("2d");
    const scale = patch.width / 158;
    paint.scale(scale, patch.height / 464);
    paint.translate(-803, -365);
    traceVine(paint);
    paint.fillStyle = "white";
    paint.fill();
    paint.globalCompositeOperation = "destination-out";
    paint.filter = `blur(${2 * scale}px)`;
    paint.lineWidth = 6;
    paint.stroke();
    paint.filter = "none";
    paint.globalCompositeOperation = "source-in";
    paint.drawImage(image, 803, 365, 158, 464);
    vinePatches.set(image, patch);
  }
  ctx.save();
  traceVine(ctx);
  ctx.clip();
  ctx.drawImage(patch, 803, 365, 158, 464);
  ctx.restore();
}

export const MORNING_GLORY_BLOOMS = Object.freeze([
  { x: 888, y: 474, size: 24, angle: -0.24 },
  { x: 881, y: 522, size: 22, angle: 0.18 },
  { x: 898, y: 572, size: 27, angle: -0.15 },
  { x: 882, y: 626, size: 25, angle: 0.12 },
  { x: 908, y: 665, size: 21, angle: -0.28 },
]);

export function morningGloryAt(minutes) {
  const time = ((minutes % 1440) + 1440) % 1440;
  return smooth(360, 420, time) * (1 - smooth(600, 720, time));
}

export function drawMorningGlory(ctx, image, openness, night) {
  const open = clamp(openness, 0, 1);
  if (!image || open <= 0.001) return;
  const aspect = image.height / image.width;
  ctx.save();
  ctx.globalAlpha *= open;
  ctx.filter = `brightness(${1 - clamp(night, 0, 1) * 0.22})`;
  for (const { x, y, size, angle } of MORNING_GLORY_BLOOMS) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(0.48 + open * 0.52, 0.7 + open * 0.3);
    const height = size * aspect;
    ctx.drawImage(image, -size / 2, -height / 2, size, height);
    ctx.restore();
  }
  ctx.restore();
}
