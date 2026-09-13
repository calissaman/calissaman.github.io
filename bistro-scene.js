export const BISTRO_EDIT_REGIONS = Object.freeze([
  { x: 842, y: 639, width: 127, height: 176 },
  { x: 1030, y: 555, width: 171, height: 148 },
]);

export const BISTRO_ROOM_RECT = Object.freeze({
  x: 956,
  y: 534,
  width: 304,
  height: 284,
});

export const BISTRO_SHARED_REGIONS = Object.freeze([
  { x: 1028, y: 551, width: 173, height: 247 },
  { x: 978, y: 693, width: 223, height: 113 },
]);

function paintRegion(
  ctx,
  image,
  rect,
  createCanvas,
  { cropped = false, night = false } = {},
) {
  const local = createCanvas();
  local.width = rect.width;
  local.height = rect.height;
  const paint = local.getContext("2d");
  const scale = cropped
    ? (image.naturalWidth || image.width) / BISTRO_ROOM_RECT.width
    : 1;
  paint.filter = night ? "brightness(.82) saturate(.96)" : "none";
  paint.drawImage(
    image,
    (rect.x - (cropped ? BISTRO_ROOM_RECT.x : 0)) * scale,
    (rect.y - (cropped ? BISTRO_ROOM_RECT.y : 0)) * scale,
    rect.width * scale,
    rect.height * scale,
    0,
    0,
    rect.width,
    rect.height,
  );
  paint.filter = "none";
  paint.globalCompositeOperation = "destination-in";
  for (const [x, y] of [
    [rect.width, 0],
    [0, rect.height],
  ]) {
    const gradient = paint.createLinearGradient(0, 0, x, y);
    const edge = 2 / (x || y);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(edge, "white");
    gradient.addColorStop(1 - edge, "white");
    gradient.addColorStop(1, "transparent");
    paint.fillStyle = gradient;
    paint.fillRect(0, 0, rect.width, rect.height);
  }
  ctx.drawImage(local, rect.x, rect.y);
}

export async function prepareBistroScene(
  original,
  patch,
  { shared, night = false } = {},
  createCanvas = () => document.createElement("canvas"),
) {
  const canvas = createCanvas();
  canvas.width = 1536;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(original, 0, 0);
  for (const rect of BISTRO_EDIT_REGIONS) {
    paintRegion(ctx, patch, rect, createCanvas);
  }
  if (shared)
    for (const rect of BISTRO_SHARED_REGIONS)
      paintRegion(ctx, shared, rect, createCanvas, { cropped: true, night });
  const image = new Image();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve));
  image.src = URL.createObjectURL(blob);
  await image.decode();
  return image;
}
