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

export async function prepareTreeScene(original, canopy) {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(original, 0, 0);
  drawTreeCanopy(ctx, canopy);
  const image = new Image();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve));
  image.src = URL.createObjectURL(blob);
  await image.decode();
  return image;
}
