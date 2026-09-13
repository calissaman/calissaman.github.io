import {
  drawFacadePanels,
  FACADE_PANELS,
} from "./facade-panels.js?v=20260913-62";
import { drawMatchingYellowShutters } from "./yellow-windows.js?v=20260913-65";

export function drawBlueWindowTrim(ctx, image) {
  if (!image) return;
  ctx.save();
  ctx.beginPath();
  trace(ctx, [
    [937, 160],
    [1167, 110],
    [1167, 366],
    [1179, 405],
    [1176, 437],
    [1190, 474],
    [1190, 490],
    [937, 505],
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
    ctx.rect(925, 40, 345, 465);
    trace(ctx, hole);
    ctx.clip("evenodd");
  }
  ctx.beginPath();
  ctx.rect(925, 40, 345, 465);
  ctx.moveTo(971, 233);
  ctx.lineTo(971, 214);
  ctx.bezierCurveTo(975, 194, 1008, 176, 1038, 192);
  ctx.lineTo(1043, 198);
  ctx.lineTo(1043, 221);
  ctx.closePath();
  ctx.clip("evenodd");
  ctx.beginPath();
  ctx.rect(925, 40, 345, 465);
  ctx.moveTo(1092, 218);
  ctx.lineTo(1092, 190);
  ctx.bezierCurveTo(1112, 164, 1154, 151, 1176, 167);
  ctx.lineTo(1185, 185);
  ctx.lineTo(1185, 202);
  ctx.closePath();
  ctx.clip("evenodd");
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
  x: 425,
  y: 185,
  width: 248,
  height: 313,
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
  [668, 482],
  [445, 498],
  [430, 479],
]);

const GRILLES = [
  [
    [475, 282],
    [483, 274],
    [498, 269],
    [515, 271],
    [526, 280],
    [532, 297],
    [475, 307],
  ],
  [
    [568, 269],
    [578, 260],
    [594, 254],
    [610, 255],
    [623, 263],
    [631, 279],
    [568, 290],
  ],
];

function trace(ctx, points) {
  points.forEach(([x, y], index) =>
    index ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
  );
  ctx.closePath();
}

export function traceGreenWindows(ctx) {
  GREEN_WINDOW_OPENINGS.forEach((points) => trace(ctx, points));
}

export async function prepareFacadeScene(
  original,
  { floral, wallLamp, panels, planter, blueShutter, blueTrim, night = false },
  createCanvas = () => document.createElement("canvas"),
) {
  const canvas = createCanvas();
  canvas.width = 1536;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(original, 0, 0);
  if (floral) {
    ctx.save();
    ctx.beginPath();
    trace(ctx, FACADE_OUTLINE);
    ctx.clip();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    traceGreenWindows(ctx);
    ctx.clip("evenodd");
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    GRILLES.forEach((points) => trace(ctx, points));
    ctx.clip("evenodd");
    ctx.drawImage(floral, FACADE_RECT.x, FACADE_RECT.y);
    ctx.restore();
  }
  if (wallLamp) {
    ctx.drawImage(wallLamp, WALL_LAMP_RECT.x, WALL_LAMP_RECT.y);
  }
  drawBlueWindowTrim(ctx, blueTrim);
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
