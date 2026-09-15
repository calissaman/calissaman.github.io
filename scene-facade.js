import { drawPinkWindowTrim } from "./pink-facade.js?v=20260914-77";
import {
  drawFacadePanels,
  FACADE_PANELS,
} from "./facade-panels.js?v=20260915-82";
import { drawMatchingYellowShutters } from "./yellow-windows.js?v=20260913-65";

export function drawBlueWindowTrim(ctx, image) {
  if (!image) return;
  ctx.save();
  ctx.beginPath();
  trace(ctx, [
    [916, 160],
    [1167, 110],
    [1167, 366],
    [1179, 405],
    [1176, 437],
    [1190, 474],
    [1190, 490],
    [916, 505],
  ]);
  ctx.clip();
  for (const hole of [
    [
      [970, 237],
      [1051, 217],
      [1051, 374],
      [970, 388],
    ],
    [
      [1087, 197],
      [1188, 179],
      [1188, 370],
      [1087, 384],
    ],
    ...FACADE_PANELS.filter((panel) => panel.house === "blue").map(
      (panel) => panel.quad,
    ),
  ]) {
    ctx.beginPath();
    ctx.rect(916, 40, 354, 465);
    trace(ctx, hole);
    ctx.clip("evenodd");
  }
  ctx.beginPath();
  ctx.rect(916, 40, 354, 465);
  ctx.moveTo(971, 233);
  ctx.lineTo(971, 214);
  ctx.bezierCurveTo(975, 194, 1008, 176, 1038, 192);
  ctx.lineTo(1043, 198);
  ctx.lineTo(1043, 221);
  ctx.closePath();
  ctx.clip("evenodd");
  ctx.beginPath();
  ctx.rect(916, 40, 354, 465);
  ctx.moveTo(1092, 218);
  ctx.lineTo(1092, 190);
  ctx.bezierCurveTo(1112, 164, 1154, 151, 1176, 167);
  ctx.lineTo(1185, 185);
  ctx.lineTo(1185, 202);
  ctx.closePath();
  ctx.clip("evenodd");
  // Carry the clean column edge across the narrow join with the pink facade.
  ctx.drawImage(
    image,
    0,
    0,
    (image.width * 9) / 345,
    image.height,
    916,
    40,
    9,
    465,
  );
  ctx.drawImage(image, 925, 40, 345, 465);
  ctx.restore();
}

export function drawMatchingBlueShutter(ctx, image) {
  if (!image) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(1027, 216);
  ctx.lineTo(1049, 224);
  ctx.lineTo(1049, 369);
  ctx.lineTo(1027, 363);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, 948, 205, 128, 192);
  ctx.restore();
}

export const FACADE_RECT = Object.freeze({
  x: 420,
  y: 185,
  width: 280,
  height: 600,
});

export const WALL_LAMP_RECT = Object.freeze({
  x: 615,
  y: 491,
  width: 53,
  height: 52,
});

const PLANTER_CROP = [680, 736, 80, 60];

function drawCleanPlanter(ctx, image, createCanvas) {
  const mask = createCanvas();
  mask.width = 26;
  mask.height = 25;
  const paint = mask.getContext("2d");
  paint.scale(13, 12.5);
  const fade = paint.createRadialGradient(1, 1, 0.62, 1, 1, 1);
  fade.addColorStop(0, "white");
  fade.addColorStop(1, "transparent");
  paint.fillStyle = fade;
  paint.fillRect(0, 0, 2, 2);
  paint.setTransform(1, 0, 0, 1, 0, 0);
  paint.globalCompositeOperation = "source-in";
  const [x, y, width, height] = PLANTER_CROP;
  paint.drawImage(image, x - 708, y - 750, width, height);
  ctx.drawImage(mask, 708, 750);
}

export const GREEN_WINDOW_OPENINGS = Object.freeze([
  [
    [444, 307],
    [536, 290],
    [537, 420],
    [449, 435],
  ],
  [
    [559, 286],
    [638, 273],
    [640, 413],
    [559, 422],
  ],
]);

export const FACADE_OUTLINE = Object.freeze([
  [433, 226],
  [660, 185],
  [668, 481],
  [668, 780],
  [422, 780],
  [421, 750],
  [429, 710],
  [432, 686],
  [433, 575],
  [441, 520],
  [430, 479],
]);

export const EMERALD_ROOF_OUTLINE = Object.freeze([
  [461, 487],
  [632, 470],
  [647, 473],
  [638, 503],
  [632, 518],
  [633, 526],
  [482, 538],
  [481, 525],
  [432, 518],
  [428, 515],
  [457, 497],
]);

function trace(ctx, points) {
  points.forEach(([x, y], index) =>
    index ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
  );
  ctx.closePath();
}

export function traceGreenWindows(ctx) {
  GREEN_WINDOW_OPENINGS.forEach((points) => trace(ctx, points));
}

export function prepareWhiteWindowGlass(original, edited) {
  if (!original || !edited) return original;
  const canvas = document.createElement("canvas");
  canvas.width = original.naturalWidth || original.width;
  canvas.height = original.naturalHeight || original.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(original, 0, 0);
  const { x, y, width, height } = FACADE_RECT;
  ctx.scale(canvas.width / width, canvas.height / height);
  ctx.translate(-x, -y);
  ctx.beginPath();
  traceGreenWindows(ctx);
  ctx.clip();
  ctx.drawImage(edited, x, y, width, height);
  return canvas;
}

const whiteFacadeLayers = new WeakMap();

export function drawWhiteFacade(ctx, image, cleanSill) {
  if (!image) return;
  ctx.save();
  ctx.beginPath();
  trace(ctx, FACADE_OUTLINE);
  ctx.clip();
  for (const hole of [
    ...FACADE_PANELS.filter((panel) => panel.house === "green").map(
      (panel) => panel.quad,
    ),
    EMERALD_ROOF_OUTLINE,
  ]) {
    ctx.beginPath();
    ctx.rect(420, 185, 280, 600);
    trace(ctx, hole);
    ctx.clip("evenodd");
  }
  const { x, y, width, height } = FACADE_RECT;
  let layer = whiteFacadeLayers.get(image);
  if (!layer) {
    layer = document.createElement("canvas");
    layer.width = image.naturalWidth || image.width;
    layer.height = image.naturalHeight || image.height;
    const paint = layer.getContext("2d");
    const scale = layer.width / width;
    paint.scale(scale, layer.height / height);
    paint.translate(-x, -y);
    paint.beginPath();
    trace(paint, FACADE_OUTLINE);
    paint.fillStyle = "white";
    paint.fill();
    paint.globalCompositeOperation = "destination-out";
    paint.filter = `blur(${2 * scale}px)`;
    paint.lineWidth = 12;
    paint.stroke();
    paint.filter = "none";
    paint.globalCompositeOperation = "source-in";
    paint.drawImage(image, x, y, width, height);
    whiteFacadeLayers.set(image, layer);
  }
  ctx.drawImage(layer, x, y, width, height);
  if (cleanSill) {
    ctx.beginPath();
    ctx.ellipse(507.5, 480.5, 4.8, 3.5, -0.1, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(cleanSill, 490, 470, 50, 18);
  }
  ctx.restore();
}

export async function prepareFacadeScene(
  original,
  {
    floral,
    wallLamp,
    panels,
    planter,
    blueShutter,
    blueTrim,
    pinkTrim,
    whiteSill,
    night = false,
  },
  createCanvas = () => document.createElement("canvas"),
) {
  const canvas = createCanvas();
  canvas.width = 1536;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(original, 0, 0);
  if (wallLamp) {
    ctx.drawImage(wallLamp, WALL_LAMP_RECT.x, WALL_LAMP_RECT.y);
  }
  drawWhiteFacade(ctx, floral, whiteSill);
  drawBlueWindowTrim(ctx, blueTrim);
  drawPinkWindowTrim(ctx, pinkTrim);
  if (panels) drawFacadePanels(ctx, panels, { night, createCanvas });
  drawMatchingYellowShutters(ctx);
  drawMatchingBlueShutter(ctx, blueShutter);
  if (planter) drawCleanPlanter(ctx, planter, createCanvas);
  const image = new Image();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve));
  image.src = URL.createObjectURL(blob);
  await image.decode();
  return image;
}
