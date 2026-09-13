import { FACADE_PANELS } from "./facade-panels.js?v=20260914-77";
import { YELLOW_WINDOWS } from "./yellow-windows.js?v=20260913-65";

function trace(ctx, points) {
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

export function drawPinkWindowTrim(ctx, image) {
  if (!image) return;
  ctx.save();
  ctx.beginPath();
  trace(ctx, [
    [669, 205],
    [898, 156],
    [916, 194],
    [916, 510],
    [672, 533],
  ]);
  ctx.clip();
  for (const hole of [
    ...YELLOW_WINDOWS.slice(0, 2).map((window) => window.quad),
    ...FACADE_PANELS.filter((panel) => panel.house === "cream").map(
      (panel) => panel.quad,
    ),
  ]) {
    ctx.beginPath();
    ctx.rect(645, 135, 300, 410);
    trace(ctx, hole);
    ctx.clip("evenodd");
  }
  ctx.beginPath();
  ctx.rect(645, 135, 300, 410);
  ctx.moveTo(695, 278);
  ctx.lineTo(695, 258);
  ctx.bezierCurveTo(697, 242, 717, 228, 737, 228);
  ctx.bezierCurveTo(751, 228, 760, 237, 763, 250);
  ctx.lineTo(763, 268);
  ctx.closePath();
  ctx.clip("evenodd");
  ctx.beginPath();
  ctx.rect(645, 135, 300, 410);
  ctx.moveTo(811, 261);
  ctx.lineTo(811, 247);
  ctx.bezierCurveTo(817, 224, 849, 211, 868, 217);
  ctx.bezierCurveTo(876, 220, 881, 230, 881, 241);
  ctx.lineTo(881, 250);
  ctx.closePath();
  ctx.clip("evenodd");
  ctx.drawImage(image, 645, 135, 300, 410);
  ctx.restore();
}

const vineJoins = new WeakMap();

export function drawPinkVineJoin(ctx, image) {
  if (!image) return;
  let patch = vineJoins.get(image);
  if (!patch) {
    patch = document.createElement("canvas");
    patch.width = image.naturalWidth || image.width;
    patch.height = image.naturalHeight || image.height;
    const paint = patch.getContext("2d");
    const scale = patch.width / 100;
    paint.scale(scale, patch.height / 90);
    paint.translate(-825, -458);
    paint.beginPath();
    paint.rect(841, 458, 65, 73);
    paint.fillStyle = "white";
    paint.fill();
    paint.globalCompositeOperation = "destination-out";
    paint.filter = `blur(${2 * scale}px)`;
    paint.lineWidth = 4;
    paint.stroke();
    paint.filter = "none";
    paint.globalCompositeOperation = "source-in";
    paint.drawImage(image, 825, 458, 100, 90);
    vineJoins.set(image, patch);
  }
  ctx.drawImage(patch, 825, 458, 100, 90);
}
