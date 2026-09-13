export const BISTRO_EDIT_REGIONS = Object.freeze([
  { x: 842, y: 639, width: 127, height: 176 },
  { x: 1030, y: 555, width: 171, height: 148 },
]);

export async function prepareBistroScene(
  original,
  patch,
  createCanvas = () => document.createElement("canvas"),
) {
  const canvas = createCanvas();
  canvas.width = 1536;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(original, 0, 0);
  for (const rect of BISTRO_EDIT_REGIONS) {
    const local = createCanvas();
    local.width = rect.width;
    local.height = rect.height;
    const paint = local.getContext("2d");
    paint.drawImage(
      patch,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height,
    );
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
  const image = new Image();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve));
  image.src = URL.createObjectURL(blob);
  await image.decode();
  return image;
}
