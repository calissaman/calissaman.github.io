export const CANOPY_AREAS = [
  [
    [0, 0],
    [610, 0],
    [590, 60],
    [473, 110],
    [400, 175],
    [257, 228],
    [140, 315],
    [93, 431],
    [0, 480],
  ],
  [
    [944, 0],
    [1536, 0],
    [1536, 225],
    [1175, 225],
    [1152, 200],
    [1135, 178],
    [1090, 160],
    [1070, 124],
    [1033, 98],
    [961, 60],
  ],
];

export function drawTreeCanopy(ctx, canopy) {
  ctx.save();
  ctx.beginPath();
  for (const points of CANOPY_AREAS) {
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
  ctx.clip();
  ctx.drawImage(canopy, 0, 0);
  ctx.restore();
}

export const PARK_TREE_RECT = [138, 442, 266, 168];

export function drawParkTree(ctx, image) {
  const [x, y, width, height] = PARK_TREE_RECT;
  const patch = document.createElement("canvas");
  patch.width = width;
  patch.height = height;
  const paint = patch.getContext("2d");
  paint.drawImage(image, x, y, width, height, 0, 0, width, height);
  paint.globalCompositeOperation = "destination-in";
  for (const [dx, dy, size] of [
    [width, 0, width],
    [0, height, height],
  ]) {
    const fade = paint.createLinearGradient(0, 0, dx, dy);
    fade.addColorStop(0, "transparent");
    fade.addColorStop(8 / size, "white");
    fade.addColorStop(1 - 8 / size, "white");
    fade.addColorStop(1, "transparent");
    paint.fillStyle = fade;
    paint.fillRect(0, 0, width, height);
  }
  ctx.drawImage(patch, x, y);
}

export async function prepareTreeScene(original, canopy, park) {
  if (!canopy && !park) return original;
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(original, 0, 0);
  if (canopy) drawTreeCanopy(ctx, canopy);
  if (park) drawParkTree(ctx, park);
  const image = new Image();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve));
  image.src = URL.createObjectURL(blob);
  await image.decode();
  return image;
}
